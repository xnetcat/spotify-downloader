from typing import List
from pathlib import Path

from spotdl.search import SongObject, song_gatherer
from spotdl.providers import provider_utils, metadata_provider


def parse_query(query: List[str], format, use_youtube) -> List[SongObject]:
    """
    Parse query and return list containing song object
    """

    songs_list = []

    # Iterate over all search queries and add them to songs_list
    for request in query:
        songs_list.extend(parse_request(request, format, use_youtube))

        # linefeed to visually separate output for each query
        print()

    return songs_list


def parse_request(
    request: str, output_format: str = None, use_youtube: bool = False
) -> List[SongObject]:
    song_list: List[SongObject] = []
    if (
        "youtube.com/watch?v=" in request
        and "open.spotify.com" in request
        and "track" in request
        and "|" in request
    ):
        urls = request.split("|")

        if len(urls) <= 1 or "youtube" not in urls[0] or "spotify" not in urls[1]:
            print("Incorrect format used, please use YouTubeURL|SpotifyURL")
        else:
            print("Fetching YouTube video with spotify metadata")
            song_list = [
                song
                for song in [get_youtube_meta_track(urls[0], urls[1], output_format)]
                if song is not None
            ]
    elif "open.spotify.com" in request and "track" in request:
        print("Fetching Song...")
        song = song_gatherer.from_spotify_url(request, output_format, use_youtube)
        song_list = [song] if song is not None else []
    elif "open.spotify.com" in request and "album" in request:
        print("Fetching Album...")
        song_list = song_gatherer.from_album(request, output_format, use_youtube)
    elif "open.spotify.com" in request and "playlist" in request:
        print("Fetching Playlist...")
        song_list = song_gatherer.from_playlist(request, output_format, use_youtube)
    elif "open.spotify.com" in request and "artist" in request:
        print("Fetching artist...")
        song_list = song_gatherer.from_artist(request, output_format, use_youtube)
    elif request == "saved":
        print("Fetching Saved Songs...")
        song_list = song_gatherer.from_saved_tracks(output_format, use_youtube)
    else:
        print('Searching Spotify for song named "%s"...' % request)
        try:
            song_list = song_gatherer.from_search_term(
                request, output_format, use_youtube
            )
        except Exception as e:
            print(e)

    # filter out NONE songObj items (already downloaded)
    song_list = [song_object for song_object in song_list if song_object is not None]

    return song_list


def get_youtube_meta_track(youtubeURL: str, spotifyURL: str, outputFormat: str = None):
    # check if URL is a playlist, user, artist or album, if yes raise an Exception,
    # else procede

    # Get the Song Metadata
    print(f"Gathering Spotify Metadata for: {spotifyURL}")
    rawTrackMeta, rawArtistMeta, rawAlbumMeta = metadata_provider.from_url(spotifyURL)

    songName = rawTrackMeta["name"]
    contributingArtists = []
    for artist in rawTrackMeta["artists"]:
        contributingArtists.append(artist["name"])

    convertedFileName = SongObject.create_file_name(
        songName, [artist["name"] for artist in rawTrackMeta["artists"]]
    )

    if outputFormat is None:
        outputFormat = "mp3"

    convertedFilePath = Path(".", f"{convertedFileName}.{outputFormat}")

    # if a song is already downloaded skip it
    if convertedFilePath.is_file():
        print(f'Skipping "{convertedFileName}" as it\'s already downloaded')
        return None

    # (try to) Get lyrics from Genius
    lyrics = provider_utils._get_song_lyrics(songName, contributingArtists)

    return SongObject(rawTrackMeta, rawAlbumMeta, rawArtistMeta, youtubeURL, lyrics)
