from typing import List
from spotdl.search.song_object import SongObject
from spotdl.search import songGatherer as song_gatherer


def parse_query(query: List[str], format) -> List[SongObject]:
    """
    Parse query and return list containing song object
    """

    songs_list = []

    # Iterate over all search queries and add them to songs_list
    for request in query:
        songs_list.extend(song_gatherer.from_query(request, format))

        # linefeed to visually separate output for each query
        print()

    return songs_list
