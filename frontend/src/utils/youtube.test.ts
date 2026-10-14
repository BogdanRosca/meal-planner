import { parseYoutubeVideoId } from './youtube';

describe('parseYoutubeVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PL1', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['  youtube.com/watch?v=dQw4w9WgXcQ  ', 'dQw4w9WgXcQ'],
    ['http://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('accepts %s', (url, expected) => {
    expect(parseYoutubeVideoId(url)).toBe(expected);
  });

  it.each([
    [''],
    ['   '],
    ['not a url at all'],
    ['https://vimeo.com/123456'],
    ['ftp://youtube.com/watch?v=dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=tooShort'],
    ['https://www.youtube.com/watch'],
    ['https://www.youtube.com/channel/UC123'],
    ['https://youtu.be/'],
    ['https://www.youtube.com/shorts/'],
    ['http://[invalid'],
  ])('rejects %p', url => {
    expect(parseYoutubeVideoId(url)).toBeNull();
  });
});
