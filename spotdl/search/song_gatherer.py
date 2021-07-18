from pathlib import Path
from typing import Dict, List, Optional

from spotdl.providers import (
    metadata_provider,
    yt_provider,
    ytm_provider,
    provider_utils,
)
from spotdl.search import SongObject, SpotifyClient


def from_spotify_url(
    spotify_url: str, output_format: str = None, use_youtube: bool = False
) -> Optional[SongObject]:
    """
    Creates song object using spotfy url

    `str` `spotify_url` : spotify url used to create song object
    `str` `output_format` : output format of the song

    returns a `SongObject`
    """

    # Set default ouput format to mp3
    if output_format is None:
        output_format = "mp3"

    # Get the Song Metadata
    print(f"Gathering Spotify Metadata for: {spotify_url}")
    raw_track_meta, raw_artist_meta, raw_album_meta = metadata_provider.from_url(
        spotify_url
    )

    if raw_track_meta is None:
        return None

    song_name = raw_track_meta["name"]
    album_name = raw_track_meta["album"]["name"]
    isrc = raw_track_meta.get("external_ids", {}).get("isrc")
    duration = round(raw_track_meta["duration_ms"] / 1000, ndigits=3)
    contributing_artists = [artist["name"] for artist in raw_track_meta["artists"]]
    display_name = ", ".join(contributing_artists) + " - " + song_name

    # Create file name
    converted_file_name = SongObject.create_file_name(
        song_name, [artist["name"] for artist in raw_track_meta["artists"]]
    )

    # If song name is too long use only first artist
    if len(converted_file_name) > 250:
        converted_file_name = SongObject.create_file_name(
            song_name, [raw_track_meta["artists"][0]["name"]]
        )

    converted_file_path = Path(".", f"{converted_file_name}.{output_format}")

    # if a song is already downloaded skip it
    if converted_file_path.is_file():
        print(f'Skipping "{converted_file_name}" as it\'s already downloaded')
        return None

    # Get the song's downloadable audio link
    if use_youtube is True:
        print(f'Searching YouTube for "{display_name}"', end="\r")
        youtube_link = yt_provider.search_and_get_best_match(
            song_name, contributing_artists, duration, isrc
        )
    else:
        print(f'Searching YouTube Music for "{display_name}"', end="\r")
        youtube_link = ytm_provider.search_and_get_best_match(
            song_name, contributing_artists, album_name, duration, isrc
        )

    # Check if we found youtube url
    if youtube_link is None:
        print("Could not match any of the results on YouTube. Skipping")
        return None
    else:
        print(" " * (len(display_name) + 25), end="\r")
        print(f'Found YouTube URL for "{display_name}" : {youtube_link}')

    # (try to) Get lyrics from Genius
    lyrics = provider_utils._get_song_lyrics(song_name, contributing_artists)

    return SongObject(
        raw_track_meta, raw_album_meta, raw_artist_meta, youtube_link, lyrics
    )


def from_search_term(
    query: str, output_format: str = None, use_youtube: bool = False
) -> List[SongObject]:
    """
    Queries Spotify for a song and returns the best match

    `str` `query` : what you'd type into Spotify's search box
    `str` `output_format` : output format of the song

    returns a `list<SongObject>` containing Url's of each track in the given album
    """

    # get a spotify client
    spotify_client = SpotifyClient()

    # get possible matches from spotify
    result = spotify_client.search(query, type="track")

    # return first result link or if no matches are found, raise Exception
    if result is None or len(result.get("tracks", {}).get("items", [])) == 0:
        raise Exception("No song matches found on Spotify")
    else:
        song_url = "http://open.spotify.com/track/" + result["tracks"]["items"][0]["id"]
        song = from_spotify_url(song_url, output_format, use_youtube)
        return [song] if song is not None else []


def from_album(
    album_url: str, output_format: str = None, use_youtube: bool = False
) -> List[SongObject]:
    """
    Create and return list containing SongObject for every song in the album

    `str` `album_url` : Spotify Url of the album whose tracks are to be retrieved
    `str` `output_format` : output format of the song

    returns a `list<SongObject>` containing Url's of each track in the given album
    """

    spotify_client = SpotifyClient()
    tracks = []

    album_response = spotify_client.album_tracks(album_url)
    if album_response is None:
        raise ValueError("Wrong album id")

    album_tracks = album_response["items"]

    # Get all tracks from album
    while album_response["next"]:
        album_response = spotify_client.next(album_response)

        # Failed to get response, break the loop
        if album_response is None:
            break

        album_tracks.extend(
            [
                track
                for track in album_response["items"]
                # check if track has id
                if track.get("track", {}).get("id") is not None
            ]
        )

    # Create song objects from track ids
    for track in album_tracks:
        song = from_spotify_url(
            "https://open.spotify.com/track/" + track["id"], output_format, use_youtube
        )

        if song is not None and song.youtube_link is not None:
            tracks.append(song)

    return tracks


def from_playlist(
    playlist_url: str, output_format: str = None, use_youtube: bool = False
) -> List[SongObject]:
    """
    Create and return list containing SongObject for every song in the playlist

    `str` `album_url` : Spotify Url of the album whose tracks are to be retrieved
    `str` `output_format` : output format of the song

    returns a `list<SongObject>` containing Url's of each track in the given album
    """

    spotify_client = SpotifyClient()
    tracks = []

    playlist_response = spotify_client.playlist_tracks(playlist_url)
    if playlist_response is None:
        raise ValueError("Wrong playlist id")

    playlist_tracks = [
        track
        for track in playlist_response["items"]
        # check if track has id
        if track.get("track", {}).get("id") is not None
    ]

    # Get all tracks from playlist
    while playlist_response["next"]:
        playlist_response = spotify_client.next(playlist_response)

        # Failed to get response, break the loop
        if playlist_response is None:
            break

        playlist_tracks.extend(
            [
                track
                for track in playlist_response["items"]
                # check if track has id
                if track.get("track", {}).get("id") is not None
            ]
        )

    # Create song object for each track
    for track in playlist_tracks:
        song = from_spotify_url(
            "https://open.spotify.com/track/" + track["track"]["id"],
            output_format,
            use_youtube,
        )

        if song is not None and song.youtube_link is not None:
            tracks.append(song)

    return tracks


def from_artist(
    artistUrl: str, output_format: str = None, use_youtube: bool = False
) -> List[SongObject]:
    """
    Create and return list containing SongObject for every song that artists has

    `str` `album_url` : Spotify Url of the artist whose tracks are to be retrieved
    `str` `output_format` : output format of the song

    returns a `list<SongObject>` containing Url's of each track in the artist profile
    """

    spotify_client = SpotifyClient()

    artist_response = spotify_client.artist_albums(artistUrl, album_type="album,single")
    if artist_response is None:
        raise ValueError("Wrong artist id")

    albums_list = artist_response["items"]
    albums_object: Dict[str, str] = {}
    tracks_object: Dict[str, str] = {}
    artist_tracks = []
    tracks_list = []

    # Fetch all artist albums
    while artist_response["next"]:
        response = spotify_client.next(artist_response)

        # wrong response, break the loop
        if response is None:
            break

        artist_response = response
        albums_list.extend(artist_response["items"])

    # Remove duplicate albums
    for album in albums_list:
        # return an iterable containing the string's alphanumeric characters
        alpha_numeric_filter = filter(str.isalnum, album["name"].lower())

        # join all characters into one string
        album_name = "".join(alpha_numeric_filter)

        if albums_object.get(album_name) is None:
            albums_object[album_name] = album["uri"]

    # Fetch all tracks from all albums
    for album_uri in albums_object.values():
        response = spotify_client.album_tracks(album_uri)

        # Wrong response, get next album
        if response is None:
            continue

        album_response = response
        album_tracks = [
            track
            for track in album_response["items"]
            # check if track has id
            if track.get("track", {}).get("id") is not None
        ]

        while album_response["next"]:
            spotify_client.next(album_response)
            album_tracks.extend(
                [
                    track
                    for track in album_response["items"]
                    # check if track has id
                    if track.get("track", {}).get("id") is not None
                ]
            )

        tracks_list.extend(album_tracks)

    # Filter tracks to remove duplicates and songs without our artist
    for track in tracks_list:
        # return an iterable containing the string's alphanumeric characters
        alpha_numeric_filter = filter(str.isalnum, track["name"].lower())

        # join all characters into one string
        track_name = "".join(alpha_numeric_filter)

        if tracks_object.get(track_name) is None:
            for artist in track["artists"]:
                # get artist id from url
                # https://api.spotify.com/v1/artists/1fZAAHNWdSM5gqbi9o5iEA/albums
                #
                # split string
                #  ['https:', '', 'api.spotify.com', 'v1', 'artists',
                #  '1fZAAHNWdSM5gqbi9o5iEA', 'albums']
                #
                # get second element from the end
                # '1fZAAHNWdSM5gqbi9o5iEA'
                artist_id = artist_response["href"].split("/")[-2]

                # ignore tracks that are not from our artist by checking
                # the id
                if artist["id"] == artist_id:
                    tracks_object[track_name] = track["uri"]

    # Create song objects from track ids
    for track_uri in tracks_object.values():
        song = from_spotify_url(
            f"https://open.spotify.com/track/{track_uri}", output_format, use_youtube
        )

        if song is not None and song.youtube_link is not None:
            artist_tracks.append(song)

    return artist_tracks


def from_saved_tracks(
    output_format: str = None, use_youtube: bool = False
) -> List[SongObject]:
    """
    Create and return list containing SongObject for every song that user has saved

    `str` `output_format` : output format of the song

    returns a `list<songObj>` containing Url's of each track in the user's saved tracks
    """

    spotify_client = SpotifyClient()

    saved_tracks_response = spotify_client.current_user_saved_tracks()
    if saved_tracks_response is None:
        raise Exception("Couldn't get saved tracks")

    saved_tracks = saved_tracks_response["items"]
    tracks = []

    # Fetch all saved tracks
    while saved_tracks_response["next"]:
        response = spotify_client.next(saved_tracks_response)
        # response is wrong, break
        if response is None:
            break

        saved_tracks_response = response
        saved_tracks.extend(
            [
                track
                for track in saved_tracks_response["items"]
                # check if track has id
                if track.get("track", {}).get("id") is not None
            ]
        )

    # Create song object for each track
    for track in saved_tracks:
        song = from_spotify_url(
            "https://open.spotify.com/track/" + track["track"]["id"],
            output_format,
            use_youtube,
        )

        if song is not None and song.youtube_link is not None:
            tracks.append(song)

    return tracks


def from_dump(data_dump: dict) -> SongObject:
    """
    Creates song object from data dump

    `dict` `data_dump` : data dump used to create song object

    returns `SongObject`
    """

    raw_track_meta = data_dump["raw_track_meta"]
    raw_album_meta = data_dump["raw_album_meta"]
    raw_artist_meta = data_dump["raw_album_meta"]
    youtube_link = data_dump["youtube_link"]
    lyrics = data_dump["lyrics"]

    return SongObject(
        raw_track_meta, raw_album_meta, raw_artist_meta, youtube_link, lyrics
    )
