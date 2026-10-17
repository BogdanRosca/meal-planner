import { parseInstagramShortcode } from './instagram';

describe('parseInstagramShortcode', () => {
  it.each([
    'https://www.instagram.com/reel/DAbcdEFghiJ/',
    'https://www.instagram.com/reel/DAbcdEFghiJ/?igsh=abc123',
    'https://instagram.com/reels/DAbcdEFghiJ',
    'https://m.instagram.com/p/DAbcdEFghiJ/',
    'https://www.instagram.com/tv/DAbcdEFghiJ/',
    'https://www.instagram.com/chef_anna/reel/DAbcdEFghiJ/',
    'www.instagram.com/reel/DAbcdEFghiJ/',
    'http://instagr.am/p/DAbcdEFghiJ/',
    '  https://www.instagram.com/reel/DAbcdEFghiJ/  ',
  ])('accepts %s', url => {
    expect(parseInstagramShortcode(url)).toBe('DAbcdEFghiJ');
  });

  it.each([
    [''],
    ['   '],
    ['not a url at all'],
    ['http://[invalid'],
    ['ftp://www.instagram.com/reel/DAbcdEFghiJ/'],
    ['https://www.instagram.com/chef_anna/'],
    ['https://www.instagram.com/stories/chef_anna/123/'],
    ['https://www.instagram.com/reel/'],
    ['https://www.instagram.com/reel/abc/'],
    ['https://evil-instagram.com/reel/DAbcdEFghiJ/'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
  ])('rejects %p', url => {
    expect(parseInstagramShortcode(url)).toBeNull();
  });
});
