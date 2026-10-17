import { parseFacebookVideoRef } from './facebook';

const VIDEO_ID = '1234567890123456';

describe('parseFacebookVideoRef', () => {
  it.each([
    `https://www.facebook.com/reel/${VIDEO_ID}`,
    `https://www.facebook.com/reel/${VIDEO_ID}/?mibextid=abc`,
    `https://m.facebook.com/watch/?v=${VIDEO_ID}&ref=sharing`,
    `facebook.com/watch?v=${VIDEO_ID}`,
    `https://web.facebook.com/reels/${VIDEO_ID}/`,
    `https://www.facebook.com/Tasty/videos/${VIDEO_ID}/`,
    `https://www.facebook.com/Tasty/videos/creamy-pasta/${VIDEO_ID}/`,
    `https://www.facebook.com/video.php?v=${VIDEO_ID}`,
  ])('returns the video ID for %s', url => {
    expect(parseFacebookVideoRef(url)).toBe(VIDEO_ID);
  });

  it.each([
    'https://fb.watch/abcDEF123/',
    'fb.watch/abcDEF123',
    'https://www.facebook.com/share/r/1AbCdEfGh/',
    '  https://m.facebook.com/share/v/1AbCdEfGh/?mibextid=x  ',
  ])('accepts the short link %s as-is for the backend to resolve', url => {
    expect(parseFacebookVideoRef(url)).toBe(url.trim());
  });

  it.each([
    [''],
    ['   '],
    ['http://[invalid'],
    [`ftp://www.facebook.com/reel/${VIDEO_ID}`],
    ['https://www.facebook.com/Tasty'],
    ['https://www.facebook.com/reel/abc'],
    ['https://www.facebook.com/watch/?v=12'],
    ['https://www.facebook.com/watch/'],
    ['https://www.facebook.com/Tasty/videos/'],
    ['https://www.facebook.com/share/p/1AbCdEfGh/'],
    ['https://fb.watch/'],
    [`https://notfacebook.com/reel/${VIDEO_ID}`],
    ['https://www.instagram.com/reel/DAbcdEFghiJ/'],
  ])('rejects %p', url => {
    expect(parseFacebookVideoRef(url)).toBeNull();
  });
});
