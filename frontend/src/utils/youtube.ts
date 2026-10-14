const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com'];
const SHORT_HOSTS = ['youtu.be', 'www.youtu.be'];
const PATH_PREFIXES = ['shorts', 'embed', 'live'];

// Mirrors backend parse_video_id; the backend re-validates and is the authority
export const parseYoutubeVideoId = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  const host = parsed.hostname.toLowerCase();
  const segments = parsed.pathname.split('/').filter(Boolean);
  let videoId: string | null = null;

  if (SHORT_HOSTS.includes(host)) {
    videoId = segments[0] ?? null;
  } else if (YOUTUBE_HOSTS.includes(host)) {
    if (parsed.pathname === '/watch') {
      videoId = parsed.searchParams.get('v');
    } else if (segments.length >= 2 && PATH_PREFIXES.includes(segments[0])) {
      videoId = segments[1];
    }
  }

  return videoId && VIDEO_ID_PATTERN.test(videoId) ? videoId : null;
};
