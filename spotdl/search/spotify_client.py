from spotipy import Spotify
from spotipy.oauth2 import SpotifyClientCredentials, SpotifyOAuth


class Singleton(type):
    """
    Singleton metaclass for SpotifyClient. Ensures that SpotifyClient is not
    instantiated without prior initialization. Every other instantiation of
    SpotifyClient will return the same instance.
    """

    _instance = None

    def __call__(cls):
        if cls._instance is None:
            raise Exception(
                "Spotify client not created. Call SpotifyClient.init"
                "(client_id, client_secret, user_auth) first."
            )
        return cls._instance

    def init(cls, client_id: str, client_secret: str, user_auth: bool) -> "Singleton":
        """
        `str` `client_id` : client id from your spotify account

        `str` `client_secret` : client secret for your client id

        `bool` `user_auth` : Determines if the Authorization Code Flow or
                   the Client Credentials Flow is used

        creates and caches a spotify client if a client doesn't exist. Can only be called
        once, multiple calls will cause an Exception.
        """

        # check if initialization has been completed, if yes, raise an Exception
        if cls._instance and cls._instance.is_initialized:
            raise Exception("A spotify client has already been initialized")

        credential_manager = None

        # Use SpotifyOAuth as auth manager
        if user_auth:
            credential_manager = SpotifyOAuth(
                client_id=client_id,
                client_secret=client_secret,
                redirect_uri="http://127.0.0.1:8080/",
                scope="user-library-read",
            )
        # Use SpotifyClientCredentials as auth manager
        else:
            credential_manager = SpotifyClientCredentials(
                client_id=client_id, client_secret=client_secret
            )

        # Create instance
        cls._instance = super().__call__(auth_manager=credential_manager)

        # Return instance
        return cls._instance


class SpotifyClient(Spotify, metaclass=Singleton):
    """
    This is the Spotify client meant to be used in the app. Has to be initialized first by
    calling `SpotifyClient.init(client_id, client_secret, user_auth)`.
    """

    _initialized = False

    def __init__(self, user_auth=False, *args, **kwargs):
        if user_auth:
            self._user_auth = True
        super().__init__(*args, **kwargs)
        self._initialized = True

    @property
    def is_intialized(self):
        return self._initialized
