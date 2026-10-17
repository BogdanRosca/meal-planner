import { useEffect, useRef, useState } from 'react';
import {
  ImportPlatform,
  RecipeDraft,
  RecipeImportErrorCode,
} from '../types/recipe';
import { RecipeImportError, recipeService } from '../services/recipeService';

export type ImportPhase = 'idle' | 'fetching' | 'extracting';

export interface RecipeImportFailure {
  code: RecipeImportErrorCode;
  message: string;
}

// The request is a single call; switch the label once metadata is likely fetched
const EXTRACTING_AFTER_MS = 2500;
const RETRYABLE_CODES: RecipeImportErrorCode[] = [
  'upstream_error',
  'timeout',
  'network_error',
  'internal_error',
  'not_configured',
];

export const canAddManually = (failure: RecipeImportFailure | null) =>
  failure !== null && RETRYABLE_CODES.includes(failure.code);

export const useRecipeImport = () => {
  const [draft, setDraft] = useState<RecipeDraft | null>(null);
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [error, setError] = useState<RecipeImportFailure | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPhaseTimer = () => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  };

  const cancel = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    clearPhaseTimer();
    setPhase('idle');
  };

  const reset = () => {
    cancel();
    setDraft(null);
    setError(null);
  };

  // Abort any in-flight import when the owning page unmounts
  useEffect(
    () => () => {
      controllerRef.current?.abort();
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    },
    []
  );

  const importRecipe = async (
    platform: ImportPlatform,
    url: string
  ): Promise<RecipeDraft | null> => {
    cancel();
    const controller = new AbortController();
    controllerRef.current = controller;
    setError(null);
    setDraft(null);
    setPhase('fetching');
    phaseTimerRef.current = setTimeout(
      () => setPhase('extracting'),
      EXTRACTING_AFTER_MS
    );

    try {
      const { draft: result } = await recipeService.importFromLink(
        platform,
        url,
        controller.signal
      );
      setDraft(result);
      return result;
    } catch (err) {
      if (controller.signal.aborted) return null;
      setError(
        err instanceof RecipeImportError
          ? { code: err.code, message: err.message }
          : {
              code: 'upstream_error',
              message: 'Import failed, try again or add manually.',
            }
      );
      return null;
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        clearPhaseTimer();
        setPhase('idle');
      }
    }
  };

  return {
    importRecipe,
    draft,
    loading: phase !== 'idle',
    phase,
    error,
    cancel,
    reset,
  };
};
