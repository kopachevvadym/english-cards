'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WordSetId, WordSetState } from '@/types/wordSet';
import { createWordSet, loadWordSetState, saveWordSetState, selectWordSet } from '@/utils/wordSetsStorage';

export const useWordSets = () => {
  // Initialize from localStorage immediately on the client.
  // This prevents an "empty" initial state from overwriting persisted sets before load runs.
  const [state, setState] = useState<WordSetState>(() => {
    return loadWordSetState();
  });

  // Track hydration so we don't accidentally persist the default empty state
  // before we had a chance to read from localStorage.
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    hasHydratedRef.current = true;
  }, []);

  // Persist (after hydration)
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    saveWordSetState(state);
  }, [state]);

  const sets = state.sets;
  const selectedSetId = state.selectedSetId;

  const selectedSet = useMemo(() => {
    if (!selectedSetId) return null;
    return sets.find((s) => s.id === selectedSetId) ?? null;
  }, [sets, selectedSetId]);

  const createSet = useCallback((name: string) => {
    setState((prev) => {
      const next = createWordSet(prev, name);
      saveWordSetState(next);
      return next;
    });
  }, []);

  const switchToMain = useCallback(() => {
    setState((prev) => {
      const next = selectWordSet(prev, null);
      saveWordSetState(next);
      return next;
    });
  }, []);

  const switchToSet = useCallback((id: WordSetId) => {
    setState((prev) => {
      const next = selectWordSet(prev, id);
      saveWordSetState(next);
      return next;
    });
  }, []);

  return {
    sets,
    selectedSetId,
    selectedSet,
    createSet,
    switchToMain,
    switchToSet,
  };
};
