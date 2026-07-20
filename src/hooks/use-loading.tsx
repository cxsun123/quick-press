'use client';

import { useSyncExternalStore } from 'react';

const EVENT_NAME = '__loading__';

let isLoading = false;
let timerId: ReturnType<typeof setTimeout> | null = null;

function emitChange() {
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function startGlobalLoading() {
  isLoading = true;
  emitChange();
  if (timerId) clearTimeout(timerId);
  timerId = setTimeout(() => {
    isLoading = false;
    emitChange();
  }, 600);
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}

function getSnapshot() {
  return isLoading;
}

export function useGlobalLoading() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
