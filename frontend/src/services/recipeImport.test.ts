import { recipeService, RecipeImportError } from './recipeService';
import { RecipeDraftResponse } from '../types/recipe';

global.fetch = jest.fn();

jest.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:8000',
  API_ENDPOINTS: {
    RECIPES: 'http://localhost:8000/recipes',
    RECIPE_IMPORT_YOUTUBE: 'http://localhost:8000/recipes/import/youtube',
    RECIPE_IMPORT_INSTAGRAM: 'http://localhost:8000/recipes/import/instagram',
  },
}));

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const draftResponse: RecipeDraftResponse = {
  status: 'success',
  draft: {
    name: 'Pasta',
    category: 'dinner',
    main_ingredients: [{ name: 'spaghetti', quantity: 200, unit: 'g' }],
    common_ingredients: ['salt'],
    instructions: '1. Boil',
    prep_time: 20,
    portions: 2,
    foto_url: 'https://i.ytimg.com/vi/abc/maxresdefault.jpg',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    field_flags: { portions: 'estimated' },
    duplicate_of: null,
    source: {
      platform: 'youtube',
      video_id: 'dQw4w9WgXcQ',
      title: 'Pasta!!',
      channel: 'Chef',
      transcript_used: true,
    },
  },
};

const jsonResponse = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response);

const expectImportError = async (
  promise: Promise<unknown>,
  status: number,
  code: string,
  message: string
) => {
  const error = await promise.catch(e => e);
  expect(error).toBeInstanceOf(RecipeImportError);
  expect(error).toMatchObject({ status, code, message });
};

describe('recipeService.importFromLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts the URL with the abort signal and returns the draft', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, draftResponse));
    const controller = new AbortController();

    const result = await recipeService.importFromLink(
      'youtube',
      'https://youtu.be/dQw4w9WgXcQ',
      controller.signal
    );

    expect(result).toEqual(draftResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/recipes/import/youtube',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://youtu.be/dQw4w9WgXcQ' }),
        signal: controller.signal,
      }
    );
  });

  it('posts Instagram links to the Instagram endpoint', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, draftResponse));

    await recipeService.importFromLink(
      'instagram',
      'https://www.instagram.com/reel/DAbcdEFghiJ/'
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/recipes/import/instagram',
      expect.objectContaining({
        body: JSON.stringify({
          url: 'https://www.instagram.com/reel/DAbcdEFghiJ/',
        }),
      })
    );
  });

  it.each([
    [404, 'video_not_found', 'Video not found or not public.'],
    [422, 'not_a_recipe', "We couldn't find a recipe in this video."],
    [502, 'upstream_error', 'Import failed, try again or add manually.'],
    [503, 'not_configured', 'YOUTUBE_API_KEY is not configured on the server'],
  ])('maps a %i error with code %s', async (status, code, message) => {
    mockFetch.mockResolvedValue(
      jsonResponse(status, { detail: { code, message } })
    );

    await expectImportError(
      recipeService.importFromLink('youtube', 'https://youtu.be/dQw4w9WgXcQ'),
      status,
      code,
      message
    );
  });

  it('treats a 422 validation error without a code as an invalid URL', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(422, { detail: [{ msg: 'Value error' }] })
    );

    await expectImportError(
      recipeService.importFromLink('youtube', 'https://youtu.be/x'),
      422,
      'invalid_url',
      'Enter a valid video URL.'
    );
  });

  it('falls back to a generic error for an unknown error code', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(500, { detail: { code: 'mystery', message: 'Boom' } })
    );

    await expectImportError(
      recipeService.importFromLink('youtube', 'https://youtu.be/dQw4w9WgXcQ'),
      500,
      'upstream_error',
      'Import failed, try again or add manually.'
    );
  });

  it('falls back to a generic error when the body has no detail', async () => {
    mockFetch.mockResolvedValue(jsonResponse(504, 'Gateway Timeout'));

    await expectImportError(
      recipeService.importFromLink('youtube', 'https://youtu.be/dQw4w9WgXcQ'),
      504,
      'upstream_error',
      'Import failed, try again or add manually.'
    );
  });

  it('falls back to a generic error when the body is not JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    } as unknown as Response);

    await expectImportError(
      recipeService.importFromLink('youtube', 'https://youtu.be/dQw4w9WgXcQ'),
      502,
      'upstream_error',
      'Import failed, try again or add manually.'
    );
  });

  it('reports a network failure', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expectImportError(
      recipeService.importFromLink('youtube', 'https://youtu.be/dQw4w9WgXcQ'),
      0,
      'network_error',
      'Import failed, try again or add manually.'
    );
  });

  it('rethrows aborts unchanged', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    mockFetch.mockRejectedValue(abortError);

    await expect(
      recipeService.importFromLink('youtube', 'https://youtu.be/dQw4w9WgXcQ')
    ).rejects.toBe(abortError);
  });
});
