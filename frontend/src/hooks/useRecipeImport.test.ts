import { act, renderHook, waitFor } from '@testing-library/react';
import { canAddManually, useRecipeImport } from './useRecipeImport';
import { RecipeImportError, recipeService } from '../services/recipeService';
import { RecipeDraft } from '../types/recipe';

jest.mock('../services/recipeService', () => {
  const actual = jest.requireActual('../services/recipeService');
  return {
    ...actual,
    recipeService: { importFromYoutube: jest.fn() },
  };
});

const mockImport = recipeService.importFromYoutube as jest.MockedFunction<
  typeof recipeService.importFromYoutube
>;

const draft: RecipeDraft = {
  name: 'Pasta',
  category: 'dinner',
  main_ingredients: [{ name: 'spaghetti', quantity: 200, unit: 'g' }],
  common_ingredients: ['salt'],
  instructions: '1. Boil',
  prep_time: 20,
  portions: 2,
  foto_url: null,
  video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  field_flags: {},
  duplicate_of: null,
  source: {
    video_id: 'dQw4w9WgXcQ',
    title: 'Pasta',
    channel: 'Chef',
    transcript_used: false,
  },
};

// Resolves never; rejects with an AbortError when the signal aborts, like fetch
const pendingUntilAborted = (_url: string, signal?: AbortSignal) =>
  new Promise<never>((_resolve, reject) => {
    signal?.addEventListener('abort', () =>
      reject(new DOMException('Aborted', 'AbortError'))
    );
  });

describe('useRecipeImport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts idle', () => {
    const { result } = renderHook(() => useRecipeImport());

    expect(result.current.draft).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.phase).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('returns and stores the draft on success', async () => {
    mockImport.mockResolvedValue({ status: 'success', draft });
    const { result } = renderHook(() => useRecipeImport());

    let returned: RecipeDraft | null = null;
    await act(async () => {
      returned = await result.current.importRecipe('https://youtu.be/x');
    });

    expect(returned).toEqual(draft);
    expect(result.current.draft).toEqual(draft);
    expect(result.current.loading).toBe(false);
    expect(mockImport).toHaveBeenCalledWith(
      'https://youtu.be/x',
      expect.any(AbortSignal)
    );
  });

  it('switches from fetching to extracting while the request runs', async () => {
    jest.useFakeTimers();
    mockImport.mockImplementation(pendingUntilAborted);
    const { result } = renderHook(() => useRecipeImport());

    act(() => {
      result.current.importRecipe('https://youtu.be/x');
    });
    expect(result.current.phase).toBe('fetching');
    expect(result.current.loading).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2500);
    });
    expect(result.current.phase).toBe('extracting');

    act(() => {
      result.current.cancel();
    });
    expect(result.current.phase).toBe('idle');
  });

  it('exposes the code and message of an import error', async () => {
    mockImport.mockRejectedValue(
      new RecipeImportError(
        422,
        'not_a_recipe',
        "We couldn't find a recipe in this video."
      )
    );
    const { result } = renderHook(() => useRecipeImport());

    await act(async () => {
      await result.current.importRecipe('https://youtu.be/x');
    });

    expect(result.current.error).toEqual({
      code: 'not_a_recipe',
      message: "We couldn't find a recipe in this video.",
    });
    expect(result.current.draft).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('maps unexpected errors to a generic upstream error', async () => {
    mockImport.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useRecipeImport());

    await act(async () => {
      await result.current.importRecipe('https://youtu.be/x');
    });

    expect(result.current.error).toEqual({
      code: 'upstream_error',
      message: 'Import failed, try again or add manually.',
    });
  });

  it('cancel aborts the request without reporting an error', async () => {
    mockImport.mockImplementation(pendingUntilAborted);
    const { result } = renderHook(() => useRecipeImport());

    let pending: Promise<RecipeDraft | null> = Promise.resolve(null);
    act(() => {
      pending = result.current.importRecipe('https://youtu.be/x');
    });
    act(() => {
      result.current.cancel();
    });

    await expect(pending).resolves.toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('a new import supersedes a running one', async () => {
    mockImport
      .mockImplementationOnce(pendingUntilAborted)
      .mockResolvedValueOnce({ status: 'success', draft });
    const { result } = renderHook(() => useRecipeImport());

    let first: Promise<RecipeDraft | null> = Promise.resolve(null);
    act(() => {
      first = result.current.importRecipe('https://youtu.be/first');
    });
    await act(async () => {
      await result.current.importRecipe('https://youtu.be/second');
    });

    await expect(first).resolves.toBeNull();
    expect(result.current.draft).toEqual(draft);
    expect(result.current.loading).toBe(false);
  });

  it('reset clears the draft and error', async () => {
    mockImport.mockResolvedValue({ status: 'success', draft });
    const { result } = renderHook(() => useRecipeImport());

    await act(async () => {
      await result.current.importRecipe('https://youtu.be/x');
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.draft).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('aborts the in-flight request on unmount', async () => {
    jest.useFakeTimers();
    let capturedSignal: AbortSignal | undefined;
    mockImport.mockImplementation((url, signal) => {
      capturedSignal = signal;
      return pendingUntilAborted(url, signal);
    });
    const { result, unmount } = renderHook(() => useRecipeImport());

    act(() => {
      result.current.importRecipe('https://youtu.be/x');
    });
    unmount();

    await waitFor(() => expect(capturedSignal?.aborted).toBe(true));
  });

  it('unmounting while idle is a no-op', () => {
    const { unmount } = renderHook(() => useRecipeImport());
    expect(() => unmount()).not.toThrow();
  });
});

describe('canAddManually', () => {
  it.each([
    ['upstream_error', true],
    ['timeout', true],
    ['network_error', true],
    ['internal_error', true],
    ['not_configured', true],
    ['not_a_recipe', false],
    ['video_not_found', false],
    ['invalid_url', false],
  ] as const)('%s -> %s', (code, expected) => {
    expect(canAddManually({ code, message: '' })).toBe(expected);
  });

  it('is false without an error', () => {
    expect(canAddManually(null)).toBe(false);
  });
});
