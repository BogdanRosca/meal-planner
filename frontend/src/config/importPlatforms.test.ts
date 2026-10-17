import {
  IMPORT_PLATFORMS,
  getImportPlatform,
  getRecipeSource,
} from './importPlatforms';

describe('importPlatforms', () => {
  it('lists YouTube, Instagram then Facebook', () => {
    expect(IMPORT_PLATFORMS.map(platform => platform.id)).toEqual([
      'youtube',
      'instagram',
      'facebook',
    ]);
  });

  it('validates URLs per platform', () => {
    expect(
      getImportPlatform('youtube').parse('https://youtu.be/dQw4w9WgXcQ')
    ).toBe('dQw4w9WgXcQ');
    expect(
      getImportPlatform('instagram').parse(
        'https://www.instagram.com/reel/DAbcdEFghiJ/'
      )
    ).toBe('DAbcdEFghiJ');
    expect(
      getImportPlatform('facebook').parse(
        'https://www.facebook.com/reel/1234567890123456'
      )
    ).toBe('1234567890123456');
    expect(
      getImportPlatform('instagram').parse('https://youtu.be/dQw4w9WgXcQ')
    ).toBeNull();
  });

  describe('getRecipeSource', () => {
    it.each([
      ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube'],
      ['https://www.instagram.com/reel/C1a2b3c4d5/', 'instagram'],
      ['https://www.facebook.com/reel/1234567890', 'facebook'],
    ])('detects the platform of %s', (url, platform) => {
      expect(getRecipeSource(url)?.id).toBe(platform);
    });

    it.each([null, undefined, '', 'https://example.com/video'])(
      'returns null for %p',
      url => {
        expect(getRecipeSource(url)).toBeNull();
      }
    );
  });
});
