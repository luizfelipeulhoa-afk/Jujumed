/** Shared signals for the animated mascot. Keep model rendering independent from app logic. */
export type MascotEvent =
  | { type: "welcome" }
  | { type: "correct-answer" }
  | { type: "thinking"; active: boolean }
  | { type: "drag"; active: boolean; velocityX: number }
  | { type: "music"; playing: boolean; time: number };

export interface MascotState {
  welcomeAt: number;
  applauseAt: number;
  thinking: boolean;
  musicPlaying: boolean;
  musicTime: number;
  musicUpdatedAt: number;
  dragging: boolean;
  dragVelocityX: number;
}

export const initialMascotState: MascotState = {
  welcomeAt: 0,
  applauseAt: 0,
  thinking: false,
  musicPlaying: false,
  musicTime: 0,
  musicUpdatedAt: 0,
  dragging: false,
  dragVelocityX: 0,
};

export function reduceMascotEvent(
  state: MascotState,
  event: MascotEvent,
  now: number,
): MascotState {
  switch (event.type) {
    case "welcome":
      return { ...state, welcomeAt: now };
    case "correct-answer":
      return { ...state, applauseAt: now };
    case "thinking":
      return { ...state, thinking: event.active };
    case "drag":
      return { ...state, dragging: event.active, dragVelocityX: event.velocityX };
    case "music":
      return {
        ...state,
        musicPlaying: event.playing,
        musicTime: Math.max(0, event.time),
        musicUpdatedAt: now,
      };
  }
}

let state = initialMascotState;
const listeners = new Set<() => void>();

export function notifyMascot(event: MascotEvent) {
  if (typeof window === "undefined") return;
  state = reduceMascotEvent(state, event, Date.now());
  listeners.forEach((listener) => listener());
}

export const getMascotState = () => state;
export const getServerMascotState = () => initialMascotState;
export function subscribeMascot(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
