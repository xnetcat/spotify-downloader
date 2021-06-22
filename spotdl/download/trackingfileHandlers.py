from pathlib import Path
from typing import Optional, List

from spotdl.search import SongObject
from spotdl.search import song_gatherer


class DownloadTracker:
    def __init__(self):
        self.song_list = []
        self.save_file: Optional[Path] = None

    def load_tracking_file(self, trackingFilePath: str) -> None:
        """
        `str` `trackingFilePath` : path to a .spotdlTrackingFile

        RETURNS `~`

        reads songsObj's from disk and prepares to track their download
        """

        # Attempt to read .spotdlTrackingFile, raise exception if file can't be read
        trackingFile = Path(trackingFilePath).resolve()
        if not trackingFile.is_file():
            raise FileNotFoundError(f"no such tracking file found: {trackingFilePath}")

        with trackingFile.open("rb") as file_handle:
            songDataDumps = eval(file_handle.read().decode())

        # Save path to .spotdlTrackingFile
        self.save_file = trackingFile

        # convert song data dumps to songObj's
        # ! see, songGatherer.get_data_dump and songGatherer.from_dump for more details
        for dump in songDataDumps:
            self.song_list.append(song_gatherer.from_dump(dump))

    def load_song_list(self, song_list: List[SongObject]) -> None:
        """
        `list<songOjb>` `song_list` : songObj's being downloaded

        RETURNS `~`

        prepares to track download of provided songObj's
        """

        self.song_list = song_list

        self.backup_to_disk()

    def get_song_list(self) -> List[SongObject]:
        """
        RETURNS `list<songObj>

        get songObj's representing songs yet to be downloaded
        """
        return self.song_list

    def backup_to_disk(self):
        """
        RETURNS `~`

        backs up details of songObj's yet to be downloaded to a .spotdlTrackingFile
        """
        # remove tracking file if no songs left in queue
        # ! we use 'return None' as a convenient exit point
        if len(self.song_list) == 0:
            if self.save_file and self.save_file.is_file():
                self.save_file.unlink()
            return None

        # prepare datadumps of all songObj's yet to be downloaded
        songDataDumps = []

        for song in self.song_list:
            songDataDumps.append(song.data_dump)

        # ! the default naming of a tracking file is $nameOfFirstSOng.spotdlTrackingFile,
        # ! it needs a little fixing because of disallowed characters in file naming
        if not self.save_file:
            songName = self.song_list[0].song_name

            for disallowedChar in ["/", "?", "\\", "*", "|", "<", ">"]:
                if disallowedChar in songName:
                    songName = songName.replace(disallowedChar, "")

            songName = songName.replace('"', "'").replace(":", " - ")

            self.save_file = Path(songName + ".spotdlTrackingFile")

        # save encoded string to a file
        with open(self.save_file, "wb") as file_handle:
            file_handle.write(str(songDataDumps).encode())

    def notify_download_completion(self, song_object: SongObject) -> None:
        """
        `songObj` `songObj` : songObj representing song that has been downloaded

        RETURNS `~`

        removes given songObj from download queue and updates .spotdlTrackingFile
        """

        if song_object in self.song_list:
            self.song_list.remove(song_object)

        self.backup_to_disk()

    def clear(self):
        self.song_list = []
        self.save_file = None
