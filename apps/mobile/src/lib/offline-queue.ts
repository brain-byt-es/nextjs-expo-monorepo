import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import { isOnline, onConnectivityChange } from "./connectivity";

const QUEUE_KEY = "@logistikapp/offline_queue";

export interface QueuedAction {
  id: string;
  type: "stock-change" | "tool-booking" | "commission-update" | "commission-entry";
  method: "POST" | "PATCH";
  path: string;
  body: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
}

type QueueListener = (queue: QueuedAction[]) => void;
let queue: QueuedAction[] = [];
const queueListeners = new Set<QueueListener>();
let flushing = false;

function notifyQueueListeners() {
  for (const listener of queueListeners) {
    listener([...queue]);
  }
}

export async function loadQueue(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    if (stored) queue = JSON.parse(stored);
  } catch {}
}

async function persistQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export async function enqueue(
  action: Omit<QueuedAction, "id" | "createdAt" | "retryCount">
): Promise<void> {
  const item: QueuedAction = {
    ...action,
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    retryCount: 0,
  };
  queue.push(item);
  await persistQueue();
  notifyQueueListeners();
}

export function getQueue(): QueuedAction[] {
  return [...queue];
}

export function getPendingCount(): number {
  return queue.length;
}

export async function flushQueue(): Promise<void> {
  if (flushing || queue.length === 0 || !isOnline()) return;
  flushing = true;

  // Import apiFetch dynamically to avoid circular dep
  const { apiFetch } = await import("./api");

  while (queue.length > 0 && isOnline()) {
    const item = queue[0];
    try {
      await apiFetch(item.path, {
        method: item.method,
        body: JSON.stringify(item.body),
      });
      queue.shift(); // success — remove from queue
      await persistQueue();
      notifyQueueListeners();
    } catch (err: any) {
      if (err?.status >= 400 && err?.status < 500) {
        // Client error — discard (dead letter)
        console.warn(
          `[offline-queue] Discarding action ${item.id} (${err.status}):`,
          item
        );
        queue.shift();
        await persistQueue();
        notifyQueueListeners();
      } else {
        // Network error — stop flushing, retry later
        item.retryCount++;
        await persistQueue();
        break;
      }
    }
  }
  flushing = false;
}

export async function clearQueue(): Promise<void> {
  queue = [];
  await persistQueue();
  notifyQueueListeners();
}

export function useQueue(): { queue: QueuedAction[]; pendingCount: number } {
  const [state, setState] = useState<QueuedAction[]>([...queue]);
  useEffect(() => {
    const listener: QueueListener = (q) => setState(q);
    queueListeners.add(listener);
    return () => {
      queueListeners.delete(listener);
    };
  }, []);
  return { queue: state, pendingCount: state.length };
}

// Auto-flush on reconnect
onConnectivityChange((online) => {
  if (online) {
    flushQueue();
  }
});

// Load queue on module init
loadQueue();
