import { IMPORT_PLATFORMS, getImportPlatform } from './importPlatforms';

describe('importPlatforms', () => {
  it('lists YouTube then Instagram', () => {
    expect(IMPORT_PLATFORMS.map(platform => platform.id)).toEqual([
      'youtube',
      'instagram',
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
      getImportPlatform('instagram').parse('https://youtu.be/dQw4w9WgXcQ')
    ).toBeNull();
  });
});
