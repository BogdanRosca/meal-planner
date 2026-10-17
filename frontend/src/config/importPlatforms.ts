import { Facebook, Instagram, LucideIcon, Youtube } from 'lucide-react';
import { ImportPlatform } from '../types/recipe';
import { parseYoutubeVideoId } from '../utils/youtube';
import { parseInstagramShortcode } from '../utils/instagram';
import { parseFacebookVideoRef } from '../utils/facebook';

export interface ImportPlatformConfig {
  id: ImportPlatform;
  label: string;
  description: string;
  urlLabel: string;
  placeholder: string;
  invalidUrlMessage: string;
  parse: (_url: string) => string | null;
  Icon: LucideIcon;
}

const PLATFORMS: Record<ImportPlatform, ImportPlatformConfig> = {
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    description: 'Videos and Shorts',
    urlLabel: 'YouTube video URL',
    placeholder: 'https://www.youtube.com/watch?v=...',
    invalidUrlMessage:
      'Enter a YouTube video link, e.g. https://www.youtube.com/watch?v=…',
    parse: parseYoutubeVideoId,
    Icon: Youtube,
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    description: 'Reels',
    urlLabel: 'Instagram reel URL',
    placeholder: 'https://www.instagram.com/reel/...',
    invalidUrlMessage:
      'Enter an Instagram reel link, e.g. https://www.instagram.com/reel/…',
    parse: parseInstagramShortcode,
    Icon: Instagram,
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    description: 'Reels and videos',
    urlLabel: 'Facebook reel URL',
    placeholder: 'https://www.facebook.com/reel/...',
    invalidUrlMessage:
      'Enter a Facebook reel or video link, e.g. https://www.facebook.com/reel/…',
    parse: parseFacebookVideoRef,
    Icon: Facebook,
  },
};

// Display order of the platform cards
export const IMPORT_PLATFORMS: ImportPlatformConfig[] = [
  PLATFORMS.youtube,
  PLATFORMS.instagram,
  PLATFORMS.facebook,
];

export const getImportPlatform = (id: ImportPlatform): ImportPlatformConfig =>
  PLATFORMS[id];

// Platform a saved recipe's video link points to, if any
export const getRecipeSource = (
  videoUrl: string | null | undefined
): ImportPlatformConfig | null =>
  (videoUrl && IMPORT_PLATFORMS.find(platform => platform.parse(videoUrl))) ||
  null;
