'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WordSetId, WordSetState } from '@/types/wordSet';
import { createWordSet, loadWordSetState, saveWordSetState, selectWordSet } from '@/utils/wordSetsStorage';

export const useWordSets = () => {
  // IMPORTANT: The first render must match server output to avoid hydration mismatch.
  // So we start with an empty state and then hydrate from localStorage after mount.
  const [state, setState] = useState<WordSetState>({ sets: [], selectedSetId: null });

  // Indicates we've loaded from localStorage at least once.
  const hasLoadedFromStorageRef = useRef(false);

  // Load from localStorage after mount
  useEffect(() => {
    const stored = loadWordSetState();
    // Mark as loaded before applying state so any immediate state updates can't overwrite persisted data
    hasLoadedFromStorageRef.current = true;
    setState(stored);

    // Re-save the normalized payload (e.g., ensuring createdAt is ISO) to keep storage consistent.
    saveWordSetState(stored);
  }, []);

  const sets = state.sets;
  const selectedSetId = state.selectedSetId;

  const selectedSet = useMemo(() => {
    if (!selectedSetId) return null;
    return sets.find((s) => s.id === selectedSetId) ?? null;
  }, [sets, selectedSetId]);

  const createSet = useCallback((name: string) => {
    if (!hasLoadedFromStorageRef.current) return;
    setState((prev) => {
      const next = createWordSet(prev, name);
      saveWordSetState(next);
      return next;
    });
  }, []);

  const switchToMain = useCallback(() => {
    if (!hasLoadedFromStorageRef.current) return;
    setState((prev) => {
      const next = selectWordSet(prev, null);
      saveWordSetState(next);
      return next;
    });
  }, []);

  const switchToSet = useCallback((id: WordSetId) => {
    if (!hasLoadedFromStorageRef.current) return;
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
