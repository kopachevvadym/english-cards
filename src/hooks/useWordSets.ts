'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WordSetId, WordSetState } from '@/types/wordSet';
import { createWordSet, loadWordSetState, saveWordSetState, selectWordSet } from '@/utils/wordSetsStorage';

export const useWordSets = () => {
  // IMPORTANT: The first render must match server output to avoid hydration mismatch.
  // So we start with an empty state and then hydrate from localStorage after mount.
  const [state, setState] = useState<WordSetState>({ sets: [], selectedSetId: null });

  // Indicates we've loaded from localStorage at least once.
  // We don't persist until this is true, otherwise we'd overwrite stored sets with the empty initial state.
  const hasLoadedFromStorageRef = useRef(false);

  // Load from localStorage after mount
  useEffect(() => {
    setState(loadWordSetState());
    hasLoadedFromStorageRef.current = true;
  }, []);

  // Persist (only after we've loaded)
  useEffect(() => {
    if (!hasLoadedFromStorageRef.current) return;
    saveWordSetState(state);
  }, [state]);

  const sets = state.sets;
  const selectedSetId = state.selectedSetId;

  const selectedSet = useMemo(() => {
    if (!selectedSetId) return null;
    return sets.find((s) => s.id === selectedSetId) ?? null;
  }, [sets, selectedSetId]);

  const createSet = useCallback((name: string) => {
    setState((prev) => createWordSet(prev, name));
  }, []);

  const switchToMain = useCallback(() => {
    setState((prev) => selectWordSet(prev, null));
  }, []);

  const switchToSet = useCallback((id: WordSetId) => {
    setState((prev) => selectWordSet(prev, id));
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
