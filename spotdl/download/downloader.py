import sys
import asyncio
import traceback
import concurrent.futures

from pathlib import Path
from pytube import YouTube
from typing import List, Optional

from spotdl.search import SongObject
from spotdl.download import ffmpeg, set_id3_data, DisplayManager, DownloadTracker


# ========================
# === Helper function ===
# ========================


def _sanitize_filename(input_str: str) -> str:
    output = input_str

    # ! this is windows specific (disallowed chars)
    output = "".join(char for char in output if char not in "/?\\*|<>")

    # ! double quotes (") and semi-colons (:) are also disallowed characters but we would
    # ! like to retain their equivalents, so they aren't removed in the prior loop
    output = output.replace('"', "'").replace(":", "-")

    return output


def _get_smaller_file_path(input_song: SongObject, output_format: str) -> Path:
    # Only use the first artist if the song path turns out to be too long
    smaller_name = (
        f"{input_song.contributing_artists[0]} - {input_song.song_name}"
    )

    # ! this is windows specific (disallowed chars)
    smaller_name = "".join(char for char in smaller_name if char not in "/?\\*|<>")

    # ! double quotes (") and semi-colons (:) are also disallowed characters
    # ! but we would like to retain their equivalents, so they aren't removed
    # ! in the prior loop
    smaller_name = smaller_name.replace('"', "'")
    smaller_name = smaller_name.replace(":", "-")

    smaller_name = _sanitize_filename(smaller_name)

    try:
        return Path(f"{smaller_name}.{output_format}").resolve()
    except (OSError, WindowsError):
        # Expected to happen in the rare case when the saved path is too long,
        # even with the short filename
        raise OSError("Cannot save song due to path issues.")


def _get_converted_file_path(song_obj: SongObject, output_format: str = None) -> Path:

    # ! we eliminate contributing artist names that are also in the song name, else we
    # ! would end up with things like 'Jetta, Mastubs - I'd love to change the world
    # ! (Mastubs REMIX).mp3' which is kinda an odd file name.

    # also make sure that main artist is included in artistStr even if they
    # are in the song name, for example
    # Lil Baby - Never Recover (Lil Baby & Gunna, Drake).mp3

    artists_filtered = []

    if output_format is None:
        output_format = "mp3"

    for artist in song_obj.contributing_artists:
        if artist.lower() not in song_obj.song_name:
            artists_filtered.append(artist)
        elif artist.lower() is song_obj.contributing_artists[0].lower():
            artists_filtered.append(artist)

    artist_str = ", ".join(artists_filtered)

    converted_file_name = _sanitize_filename(
        f"{artist_str} - {song_obj.song_name}.{output_format}"
    )

    converted_file_path = Path(converted_file_name)

    # ! Checks if a file name is too long (256 max on both linux and windows)
    try:
        if len(str(converted_file_path.resolve().name)) > 256:
            print("Path was too long. Using Small Path.")
            return _get_smaller_file_path(song_obj, output_format)
    except (OSError, WindowsError):
        return _get_smaller_file_path(song_obj, output_format)

    return converted_file_path


class DownloadManager:
    # ! Big pool sizes on slow connections will lead to more incomplete downloads
    pool_size = 4

    def __init__(self, arguments: Optional[dict] = None):
        # start a server for objects shared across processes
        self.display_manager = DisplayManager()
        self.download_tracker = DownloadTracker()

        if sys.platform == "win32":
            # ! ProactorEventLoop is required on Windows to run subprocess asynchronously
            # ! it is default since Python 3.8 but has to be changed for previous versions
            loop = asyncio.ProactorEventLoop()
            asyncio.set_event_loop(loop)

        self.loop = asyncio.get_event_loop()
        # ! semaphore is required to limit concurrent asyncio executions
        self.semaphore = asyncio.Semaphore(self.pool_size)

        # ! thread pool executor is used to run blocking (CPU-bound) code from a thread
        self.thread_executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=self.pool_size
        )

        if arguments is None:
            arguments = {}

        arguments.setdefault("ffmpeg_path", "ffmpeg")
        arguments.setdefault("format", "mp3")

        self.arguments = arguments

    def __enter__(self):
        return self

    def __exit__(self, type, value, traceback):
        self.display_manager.close()

    def download_single_song(self, song_object: SongObject) -> None:
        """
        `song_object` `song` : song to be downloaded

        RETURNS `~`

        downloads the given song
        """

        self.download_tracker.clear()
        self.download_tracker.load_song_list([song_object])

        self.display_manager.set_song_count_to(1)

        self._download_asynchronously([song_object])

    def download_multiple_songs(self, song_list: List[SongObject]) -> None:
        """
        `list<song_object>` `song_list` : list of songs to be downloaded

        RETURNS `~`

        downloads the given songs in parallel
        """

        self.download_tracker.clear()
        self.download_tracker.load_song_list(song_list)

        self.display_manager.set_song_count_to(len(song_list))

        self._download_asynchronously(song_list)

    def resume_download_from_tracking_file(self, tracking_file_path: str) -> None:
        """
        `str` `tracking_file_path` : path to a .spotdlTrackingFile

        RETURNS `~`

        downloads songs present on the .spotdlTrackingFile in parallel
        """

        self.download_tracker.clear()
        self.download_tracker.load_tracking_file(tracking_file_path)

        song_list = self.download_tracker.get_song_list()

        self.display_manager.set_song_count_to(len(song_list))

        self._download_asynchronously(song_list)

    def _download_asynchronously(self, song_obj_list):
        tasks = [self._pool_download(song) for song in song_obj_list]
        # call all task asynchronously, and wait until all are finished
        self.loop.run_until_complete(asyncio.gather(*tasks))

    async def _pool_download(self, song_obj: SongObject):
        # ! Run asynchronous task in a pool to make sure that all processes
        # ! don't run at once.

        # tasks that cannot acquire semaphore will wait here until it's free
        # only certain amount of tasks can acquire the semaphore at the same time
        async with self.semaphore:
            return await self.download_song(song_obj)

    async def download_song(self, song_object: SongObject) -> None:
        """
        `song_object` `song_object` : song to be downloaded

        RETURNS `~`

        Downloads, Converts, Normalizes song & embeds metadata as ID3 tags.
        """

        display_progress_tracker = self.display_manager.new_progress_tracker(
            song_object
        )

        # ! since most errors are expected to happen within this function, we wrap in
        # ! exception catcher to prevent blocking on multiple downloads
        try:

            # ! all YouTube downloads are to .\Temp; they are then converted and put into .\ and
            # ! finally followed up with ID3 metadata tags

            # ! we explicitly use the os.path.join function here to ensure download is
            # ! platform agnostic

            # Create a .\Temp folder if not present
            temp_folder = Path(".", "Temp")

            if not temp_folder.exists():
                temp_folder.mkdir()

            converted_file_path = _get_converted_file_path(song_object, self.arguments["format"])

            # if a song is already downloaded skip it
            if converted_file_path.is_file():
                if self.display_manager:
                    display_progress_tracker.notify_download_skip()
                if self.download_tracker:
                    self.download_tracker.notify_download_completion(song_object)

                # ! None is the default return value of all functions, we just explicitly define
                # ! it here as a continent way to avoid executing the rest of the function.
                return None

            # download Audio from YouTube
            if display_progress_tracker:
                youtube_handler = YouTube(
                    url=song_object.youtube_link,
                    on_progress_callback=display_progress_tracker.pytube_progress_hook,
                )

            else:
                youtube_handler = YouTube(song_object.youtube_link)

            track_audio_stream = (
                youtube_handler.streams.filter(only_audio=True)
                .order_by("bitrate")
                .last()
            )
            if not track_audio_stream:
                print(
                    f'Unable to get audio stream for "{song_object.song_name}" '
                    f'by "{song_object.contributing_artists[0]}" '
                    f'from video "{song_object.youtube_link}"'
                )
                return None

            downloaded_file_path_string = await self._perform_audio_download_async(
                converted_file_path.name, temp_folder, track_audio_stream
            )

            if downloaded_file_path_string is None:
                return None

            if display_progress_tracker:
                display_progress_tracker.notify_youtube_download_completion()

            downloaded_file_path = Path(downloaded_file_path_string)

            ffmpeg_success = await ffmpeg.convert(
                downloaded_file_path=downloaded_file_path,
                converted_file_path=converted_file_path,
                output_format=self.arguments["format"],
                ffmpeg_path=self.arguments["ffmpeg_path"],
            )

            if display_progress_tracker:
                display_progress_tracker.notify_conversion_completion()

            if ffmpeg_success is False:
                # delete the file that wasn't successfully converted
                converted_file_path.unlink()
            else:
                # if a file was successfully downloaded, tag it
                set_id3_data(converted_file_path, song_object, self.arguments["format"])

            # Do the necessary cleanup
            if display_progress_tracker:
                display_progress_tracker.notify_download_completion()

            if self.download_tracker:
                self.download_tracker.notify_download_completion(song_object)

            # delete the unnecessary YouTube download File
            if downloaded_file_path and downloaded_file_path.is_file():
                downloaded_file_path.unlink()

        except Exception as e:
            tb = traceback.format_exc()
            if display_progress_tracker:
                display_progress_tracker.notify_error(e, tb)
            else:
                raise e

    async def _perform_audio_download_async(
        self, converted_file_name, temp_folder, track_audio_stream
    ):
        # ! The following function calls blocking code, which would block whole event loop.
        # ! Therefore it has to be called in a separate thread via ThreadPoolExecutor. This
        # ! is not a problem, since GIL is released for the I/O operations, so it shouldn't
        # ! hurt performance.
        return await self.loop.run_in_executor(
            self.thread_executor,
            self._perform_audio_download,
            converted_file_name,
            temp_folder,
            track_audio_stream,
        )

    def _perform_audio_download(
        self, converted_file_name, temp_folder, track_audio_stream
    ):
        # ! The actual download, if there is any error, it'll be here,
        try:
            # ! pyTube will save the song in .\Temp\$songName.mp4 or .webm,
            # ! it doesn't save as '.mp3'
            downloaded_file_path = track_audio_stream.download(
                output_path=temp_folder,
                filename=converted_file_name,
                skip_existing=False,
            )
            return downloaded_file_path
        except:  # noqa:E722
            # ! This is equivalent to a failed download, we do nothing, the song remains on
            # ! download_trackers download queue and all is well...
            # !
            # ! None is again used as a convenient exit
            temp_files = Path(temp_folder).glob(f"{converted_file_name}.*")
            for temp_file in temp_files:
                temp_file.unlink()
            return None
