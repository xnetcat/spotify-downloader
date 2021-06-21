from spotdl.console import console_entry_point

# ! Usage is simple - call:
#   'python __main__.py <links, search terms, tracking files separated by spaces>
# ! Eg.
# !      python __main__.py
# !          https://open.spotify.com/playlist/37i9dQZF1DWXhcuQw7KIeM
# !          'old gods of asgard Control'
# !          https://open.spotify.com/album/2YMWspDGtbDgYULXvVQFM6
# !          https://open.spotify.com/track/08mG3Y1vljYA6bvDt4Wqkj
# !
# ! Well, yeah its a pretty long example but, in theory, it should work like a charm.
# !
# ! A '.spotdlTrackingFile' is automatically  created with the name of the first song in the
# ! playlist/album or the name of the song supplied. We don't really re re re-query YTM and Spotify
# ! as all relevant details are stored to disk.
# !
# ! Files are cleaned up on download failure.
# !
# ! All songs are normalized to standard base volume. the soft ones are made louder,
# ! the loud ones, softer.
# !
# ! The progress bar is synched across multiple-processes (4 processes as of now), getting the
# ! progress bar to synch was an absolute pain, each process knows how much 'it' progressed,
# ! but the display has to be for the overall progress so, yeah... that took time.
# !
# ! spotdl will show you its true speed on longer download's - so make sure you try
# ! downloading a playlist.
# !
# ! still yet to try and package this but, in theory, there should be no errors.
# !
# !                                                          - cheerio! (Michael)
# !
# ! P.S. Tell me what you think. Up to your expectations?

if __name__ == "__main__":
    console_entry_point()
