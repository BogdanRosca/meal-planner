"""
Errors shared by the video source clients (YouTube, Instagram).
"""


class VideoNotFoundError(Exception):
    """Video is private, deleted or does not exist"""


class SourceFetchError(Exception):
    """The video source is unreachable or returned an error"""


class SourceTimeoutError(SourceFetchError):
    """The video source did not answer in time"""
