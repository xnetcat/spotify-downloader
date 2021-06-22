import requests

from typing import List
from bs4 import BeautifulSoup

from spotdl.search import SpotifyClient


def from_url(spotify_url: str):
    if not ("open.spotify.com" in spotify_url and "track" in spotify_url):
        raise Exception(f"passed URL is not that of a track: {spotify_url}")

    # query spotify for song, artist, album details
    spotify_client = SpotifyClient()

    raw_track_meta = spotify_client.track(spotify_url)

    primary_artist_id = raw_track_meta["artists"][0]["id"]
    raw_artist_meta = spotify_client.artist(primary_artist_id)

    albumId = raw_track_meta["album"]["id"]
    raw_album_meta = spotify_client.album(albumId)

    return raw_track_meta, raw_artist_meta, raw_album_meta


def get_song_lyrics(song_name: str, song_artists: List[str]) -> str:
    """
    Gets the metadata of the song.

    `str` `song_name` : name of song
    `list<str>` `song_artists` : list containing name of contributing artists

    returns `str` : Lyrics of the song.
    """

    headers = {
        "Authorization": "Bearer alXXDbPZtK1m2RrZ8I4k2Hn8Ahsd0Gh_o076HYvcdlBvmc0ULL1H8Z8xRlew5qaG",
    }
    api_search_url = "https://api.genius.com/search"
    search_query = f'{song_name} {", ".join(song_artists)}'

    api_response = requests.get(
        api_search_url, params={"q": search_query}, headers=headers
    ).json()

    song_id = api_response["response"]["hits"][0]["result"]["id"]
    song_api_url = f"https://api.genius.com/songs/{song_id}"

    api_response = requests.get(song_api_url, headers=headers).json()

    song_url = api_response["response"]["song"]["url"]

    genius_page = requests.get(song_url)
    soup = BeautifulSoup(genius_page.text, "html.parser")
    lyrics = soup.select_one("div.lyrics").get_text()

    return lyrics.strip()
