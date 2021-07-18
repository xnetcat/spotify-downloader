from typing import List

from spotdl.search import SongObject, song_gatherer


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
    if "open.spotify.com" in request and "track" in request:
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
