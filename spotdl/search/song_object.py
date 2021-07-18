from typing import List


class SongObject:

    # Constructor
    def __init__(self, rawTrackMeta, rawAlbumMeta, rawArtistMeta, youtubeLink, lyrics):
        self.__rawTrackMeta = rawTrackMeta
        self.__rawAlbumMeta = rawAlbumMeta
        self.__rawArtistMeta = rawArtistMeta
        self.__youtubeLink = youtubeLink
        self.__lyrics = lyrics

    # Equals method
    # for example song_obj1 == song_obj2
    def __eq__(self, comparedSong) -> bool:
        if comparedSong.data_dump == self.data_dump:
            return True
        else:
            return False

    # ================================
    # === Interface Implementation ===
    # ================================

    @property
    def youtube_link(self) -> str:
        """
        returns youtube link
        """
        return self.__youtubeLink

    @property
    def song_name(self) -> str:
        """
        returns songs's name.
        """

        return self.__rawTrackMeta["name"]

    @property
    def track_number(self) -> int:
        """
        returns song's track number from album (as in weather its the first
        or second or third or fifth track in the album)
        """

        return self.__rawTrackMeta["track_number"]

    @property
    def genres(self) -> List[str]:
        """
        returns a list of possible genres for the given song, the first member
        of the list is the most likely genre. returns None if genre data could
        not be found.
        """

        return self.__rawAlbumMeta["genres"] + self.__rawArtistMeta["genres"]

    @property
    def duration(self) -> float:
        """
        returns duration of song in seconds.
        """

        return round(self.__rawTrackMeta["duration_ms"] / 1000, ndigits=3)

    @property
    def contributing_artists(self) -> List[str]:
        """
        returns a list of all artists who worked on the song.
        The first member of the list is likely the main artist.
        """

        # we get rid of artist name that are in the song title so
        # naming the song would be as easy as
        # $contributingArtists + songName.mp3, we would want to end up with
        # 'Jetta, Mastubs - I'd love to change the world (Mastubs remix).mp3'
        # as a song name, it's dumb.

        contributingArtists = []

        for artist in self.__rawTrackMeta["artists"]:
            contributingArtists.append(artist["name"])

        return contributingArtists

    @property
    def disc_number(self) -> int:
        return self.__rawTrackMeta["disc_number"]

    @property
    def lyrics(self):
        """
        returns the lyrics of the song if found on Genius
        """

        return self.__lyrics

    @property
    def display_name(self) -> str:
        """
        returns songs's display name.
        """

        return str(", ".join(self.contributing_artists) + " - " + self.song_name)

    @property
    def album_name(self) -> str:
        """
        returns name of the album that the song belongs to.
        """

        return self.__rawTrackMeta["album"]["name"]

    @property
    def album_artists(self) -> List[str]:
        """
        returns list of all artists who worked on the album that
        the song belongs to. The first member of the list is likely the main
        artist.
        """

        albumArtists = []

        for artist in self.__rawTrackMeta["album"]["artists"]:
            albumArtists.append(artist["name"])

        return albumArtists

    @property
    def album_release(self) -> str:
        """
        returns date/year of album release depending on what data is available.
        """

        return self.__rawTrackMeta["album"]["release_date"]

    # ! Utilities for genuine use and also for metadata freaks:

    @property
    def album_cover_url(self) -> str:
        """
        returns url of the biggest album art image available.
        """

        return self.__rawTrackMeta["album"]["images"][0]["url"]

    @property
    def data_dump(self) -> dict:
        """
        returns a dictionary containing the spotify-api responses as-is. The
        dictionary keys are as follows:
            - rawTrackMeta      spotify-api track details
            - rawAlbumMeta      spotify-api song's album details
            - rawArtistMeta     spotify-api song's artist details

        Avoid using this function, it is implemented here only for those super
        rare occasions where there is a need to look up other details. Why
        have to look it up seperately when it's already been looked up once?
        """

        # ! internally the only reason this exists is that it helps in saving to disk

        return {
            "youtube_link": self.__youtubeLink,
            "raw_track_meta": self.__rawTrackMeta,
            "raw_album_meta": self.__rawAlbumMeta,
            "raw_artist_meta": self.__rawArtistMeta,
            "lyrics": self.__lyrics,
        }

    @property
    def file_name(self) -> str:
        return self.create_file_name(
            song_name=self.__rawTrackMeta["name"],
            song_artists=[artist["name"] for artist in self.__rawTrackMeta["artists"]],
        )

    @staticmethod
    def create_file_name(song_name: str, song_artists: List[str]) -> str:
        # build file name of converted file
        # the main artist is always included
        artistStr = song_artists[0]

        # ! we eliminate contributing artist names that are also in the song name, else we
        # ! would end up with things like 'Jetta, Mastubs - I'd love to change the world
        # ! (Mastubs REMIX).mp3' which is kinda an odd file name.
        for artist in song_artists[1:]:
            if artist.lower() not in song_name.lower():
                artistStr += ", " + artist

        convertedFileName = artistStr + " - " + song_name

        # ! this is windows specific (disallowed chars)
        convertedFileName = "".join(
            char for char in convertedFileName if char not in "/?\\*|<>"
        )

        # ! double quotes (") and semi-colons (:) are also disallowed characters but we would
        # ! like to retain their equivalents, so they aren't removed in the prior loop
        convertedFileName = convertedFileName.replace('"', "'").replace(":", "-")

        return convertedFileName
