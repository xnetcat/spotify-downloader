import asyncio
import subprocess
import sys
import re


def has_correct_version(
    skip_version_check: bool = False, ffmpeg_path: str = "ffmpeg"
) -> bool:
    try:
        process = subprocess.Popen(
            [ffmpeg_path, "-version"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            encoding="utf-8",
        )
    except FileNotFoundError:
        print("FFmpeg was not found, spotDL cannot continue.", file=sys.stderr)
        return False

    output = "".join(process.communicate())

    if skip_version_check is False:
        result = re.search(r"ffmpeg version \w?(\d+\.)?(\d+)", output)

        if result is not None:
            version = result.group(0).replace("ffmpeg version ", "")

            # remove all non numeric characters from string example: n4.3
            version = re.sub(r"[a-zA-Z]", "", version)

            if float(version) < 4.2:
                print(
                    f"Your FFmpeg installation is too old ({version}), please update to 4.2+\n",
                    file=sys.stderr,
                )
                return False

            return True
        else:
            # fallback to copyright date check
            date_result = re.search(r"Copyright \(c\) \d\d\d\d\-\d\d\d\d", output)

            if date_result is not None:
                date = date_result.group(0)
                if "2021" in date or "2020" in date:
                    return True

            print("Your FFmpeg version couldn't be detected", file=sys.stderr)
            return False
    else:
        return True


async def convert(
    downloaded_file_path, converted_file_path, ffmpeg_path, output_format
) -> bool:
    # ! '-abr true' automatically determines and passes the
    # ! audio encoding bitrate to the filters and encoder. This ensures that the
    # ! sampled length of songs matches the actual length (i.e. a 5 min song won't display
    # ! as 47 seconds long in your music player, yeah that was an issue earlier.)

    downloaded_file_path = str(downloaded_file_path)
    converted_file_path = str(converted_file_path)

    formats = {
        "mp3": ["-codec:a", "libmp3lame"],
        "flac": ["-codec:a", "flac"],
        "ogg": ["-codec:a", "libvorbis"],
        "opus": ["-codec:a", "libopus"],
        "m4a": ["-codec:a", "aac", "-vn"],
    }

    if output_format is None:
        output_format_command = formats["mp3"]
    else:
        output_format_command = formats[output_format]

    if ffmpeg_path is None:
        ffmpeg_path = "ffmpeg"

    arguments = [
        "-i",
        downloaded_file_path,
        *output_format_command,
        "-abr",
        "true",
        "-q:a",
        "0",
        "-v",
        "debug",
        converted_file_path,
    ]

    process = await asyncio.subprocess.create_subprocess_exec(
        ffmpeg_path,
        *arguments,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    proc_out = await process.communicate()

    if proc_out[0] is not None and proc_out[1]:
        out = str(b"".join(proc_out))
    else:
        out = ""

    if process.returncode != 0:
        message = (
            f"ffmpeg returned an error ({process.returncode})"
            f'\nffmpeg arguments: "{" ".join(arguments)}"'
            "\nffmpeg gave this output:"
            "\n=====\n"
            f"{out}"
            "\n=====\n"
        )

        print(message, file=sys.stderr)
        return False

    return True
