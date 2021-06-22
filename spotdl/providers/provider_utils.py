from rapidfuzz import fuzz


def _match_percentage(str1: str, str2: str, score_cutoff: float = 0) -> float:
    """
    A wrapper around `rapidfuzz.fuzz.partial_ratio` to handle UTF-8 encoded
    emojis that usually cause errors

    `str` `str1` : a random sentence
    `str` `str2` : another random sentence
    `float` `score_cutoff` : minimum score required to consider it a match returns 0 when similarity < score_cutoff

    RETURNS `float`
    """

    # ! this will throw an error if either string contains a UTF-8 encoded emoji
    try:
        return fuzz.partial_ratio(str1, str2, score_cutoff=score_cutoff)

    # ! we build new strings that contain only alphanumerical characters and spaces
    # ! and return the partial_ratio of that
    except:  # noqa:E722
        new_str1 = ""

        for each_letter in str1:
            if each_letter.isalnum() or each_letter.isspace():
                new_str1 += each_letter

        new_str2 = ""

        for each_letter in str2:
            if each_letter.isalnum() or each_letter.isspace():
                new_str2 += each_letter

        return fuzz.partial_ratio(new_str1, new_str2, score_cutoff=score_cutoff)

def _parse_duration(duration: str) -> float:
    """
    Convert string value of time (duration: "25:36:59") to a float value of seconds (92219.0)
    """
    try:
        # {(1, "s"), (60, "m"), (3600, "h")}
        mapped_increments = zip([1, 60, 3600], reversed(duration.split(":")))
        seconds = 0
        for multiplier, time in mapped_increments:
            seconds += multiplier * int(time)

        return float(seconds)

    # ! This usually occurs when the wrong string is mistaken for the duration
    except (ValueError, TypeError, AttributeError):
        return 0.0

def _map_result_to_song_data(result: dict) -> dict:
    song_data = {}
    artists = ", ".join(map(lambda a: a["name"], result["artists"]))
    video_id = result["videoId"]

    # Ignore results without video id
    if video_id is None:
        return {}

    song_data = {
        "name": result["title"],
        "type": result["resultType"],
        "artist": artists,
        "length": _parse_duration(result.get("duration", None)),
        "link": f"https://www.youtube.com/watch?v={video_id}",
        "position": 0,
    }

    album = result.get("album")
    if album:
        song_data["album"] = album["name"]

    return song_data
