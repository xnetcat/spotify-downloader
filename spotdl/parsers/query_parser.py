from typing import List

from spotdl.search import SongObject
from spotdl.search.song_gatherer import (
    songobject_from_spotify_url,
    get_album_tracks,
    get_playlist_tracks,
    get_artist_tracks,
    get_saved_tracks,
    from_search_term,
)


def parse_query(query: List[str], format) -> List[SongObject]:
    """
    Parse query and return list containing song object
    """

    songs_list = []

    # Iterate over all search queries and add them to songs_list
    for request in query:
        songs_list.extend(parse_request(request, format))

        # linefeed to visually separate output for each query
        print()

    return songs_list


def parse_request(request: str, output_format: str = None) -> List[SongObject]:
    song_list: List[SongObject] = []
    if "open.spotify.com" in request and "track" in request:
        print("Fetching Song...")
        song = songobject_from_spotify_url(request, output_format)
        song_list = [song] if song is not None else []
    elif "open.spotify.com" in request and "album" in request:
        print("Fetching Album...")
        song_list = get_album_tracks(request, output_format)
    elif "open.spotify.com" in request and "playlist" in request:
        print("Fetching Playlist...")
        song_list = get_playlist_tracks(request, output_format)
    elif "open.spotify.com" in request and "artist" in request:
        print("Fetching artist...")
        song_list = get_artist_tracks(request, output_format)
    elif request == "saved":
        print("Fetching Saved Songs...")
        song_list = get_saved_tracks(output_format)
    else:
        print('Searching Spotify for song named "%s"...' % request)
        try:
            song_list = from_search_term(request, output_format)
        except Exception as e:
            print(e)

    # filter out NONE songObj items (already downloaded)
    song_list = [song_object for song_object in song_list if song_object is not None]

    return song_list
