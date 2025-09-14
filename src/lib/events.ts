// src/lib/events.ts
export type ReviewChangedPayload = {
  mediaType: "MOVIE" | "SERIE" | "ALBUM";
  mediaId: string | number;
};

const BUS_EVENT = "review:changed";

// usa EventTarget único no browser (evita múltiplas instâncias em HMR)
function getBus(): EventTarget {
  if (typeof window === "undefined") return new EventTarget();
  const w = window as any;
  if (!w.__SCOREIT_EVENT_BUS__) w.__SCOREIT_EVENT_BUS__ = new EventTarget();
  return w.__SCOREIT_EVENT_BUS__ as EventTarget;
}

export function onReviewChanged(handler: (payload: ReviewChangedPayload) => void) {
  const bus = getBus();
  const listener = (ev: Event) => {
    const ce = ev as CustomEvent<ReviewChangedPayload>;
    handler(ce.detail);
  };
  bus.addEventListener(BUS_EVENT, listener);
  return () => bus.removeEventListener(BUS_EVENT, listener);
}

export function emitReviewChanged(payload: ReviewChangedPayload) {
  const bus = getBus();
  bus.dispatchEvent(new CustomEvent<ReviewChangedPayload>(BUS_EVENT, { detail: payload }));
}
