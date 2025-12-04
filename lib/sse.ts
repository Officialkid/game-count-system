// lib/sse.ts
// Simple pub/sub for server-sent events channels

type Handler = (data: any) => void;

const channels = new Map<string, Set<Handler>>();

export function subscribe(channel: string, handler: Handler): () => void {
  if (!channels.has(channel)) channels.set(channel, new Set());
  const set = channels.get(channel)!;
  set.add(handler);
  return () => {
    set.delete(handler);
    if (set.size === 0) channels.delete(channel);
  };
}

export function publish(channel: string, data: any): void {
  const set = channels.get(channel);
  if (!set) return;
  set.forEach(fn => {
    try {
      fn(data);
    } catch {/* ignore */}
  });
}

export function hasSubscribers(channel: string): boolean {
  return (channels.get(channel)?.size || 0) > 0;
}
