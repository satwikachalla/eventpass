import { useSyncExternalStore } from 'react';
import { eventPassStore } from '@/lib/store';

export function useEventPassStoreVersion(): number {
  return useSyncExternalStore(
    eventPassStore.subscribe,
    eventPassStore.getVersion,
    eventPassStore.getVersion
  );
}