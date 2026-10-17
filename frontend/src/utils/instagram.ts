const SHORTCODE_PATTERN = /^[A-Za-z0-9_-]{5,40}$/;
const INSTAGRAM_HOSTS = [
  'instagram.com',
  'www.instagram.com',
  'm.instagram.com',
  'instagr.am',
  'www.instagr.am',
];
const POST_PATH_PREFIXES = ['reel', 'reels', 'p', 'tv'];

// Mirrors backend parse_shortcode; the backend re-validates and is the authority
export const parseInstagramShortcode = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (!INSTAGRAM_HOSTS.includes(parsed.hostname.toLowerCase())) return null;

  const segments = parsed.pathname.split('/').filter(Boolean);
  // Also accepts /{username}/reel/{code}/ share links
  for (let index = 0; index < segments.length - 1; index += 1) {
    const code = segments[index + 1];
    if (
      POST_PATH_PREFIXES.includes(segments[index]) &&
      SHORTCODE_PATTERN.test(code)
    ) {
      return code;
    }
  }
  return null;
};
