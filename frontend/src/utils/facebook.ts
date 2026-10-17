const VIDEO_ID_PATTERN = /^\d{5,25}$/;
const SHORT_CODE_PATTERN = /^[A-Za-z0-9_-]{3,40}$/;
const FACEBOOK_HOST_PATTERN = /^(?:[\w-]+\.)?facebook\.com$/;
const SHORT_HOSTS = ['fb.watch', 'www.fb.watch'];
const WATCH_PATHS = ['/watch', '/watch/', '/video.php', '/video/video.php'];
const SHARE_KINDS = ['r', 'v'];

const parseUrl = (url: string): URL | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(
      trimmed.includes('://') ? trimmed : `https://${trimmed}`
    );
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? parsed
      : null;
  } catch {
    return null;
  }
};

const parseVideoId = (parsed: URL, segments: string[]): string | null => {
  let candidate: string | null | undefined = null;
  if (WATCH_PATHS.includes(parsed.pathname)) {
    candidate = parsed.searchParams.get('v');
  } else if (segments.length >= 2 && ['reel', 'reels'].includes(segments[0])) {
    candidate = segments[1];
  } else if (segments.slice(0, -1).includes('videos')) {
    // /{page}/videos/{id}/ and /{page}/videos/{slug}/{id}/
    candidate = [...segments].reverse().find(s => VIDEO_ID_PATTERN.test(s));
  }
  return candidate && VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
};

const isShortLink = (host: string, segments: string[]): boolean =>
  (SHORT_HOSTS.includes(host) &&
    segments.length === 1 &&
    SHORT_CODE_PATTERN.test(segments[0])) ||
  (FACEBOOK_HOST_PATTERN.test(host) &&
    segments.length === 3 &&
    segments[0] === 'share' &&
    SHARE_KINDS.includes(segments[1]) &&
    SHORT_CODE_PATTERN.test(segments[2]));

/**
 * Mirrors backend facebook_client.parse_reference: returns the numeric video ID for
 * reel/watch/video URLs, or the link itself for fb.watch and share/{r|v} short links
 * (the backend resolves those). The backend re-validates and is the authority.
 */
export const parseFacebookVideoRef = (url: string): string | null => {
  const parsed = parseUrl(url);
  if (!parsed) return null;

  const host = parsed.hostname.toLowerCase();
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (FACEBOOK_HOST_PATTERN.test(host)) {
    const videoId = parseVideoId(parsed, segments);
    if (videoId) return videoId;
  }
  return isShortLink(host, segments) ? url.trim() : null;
};
