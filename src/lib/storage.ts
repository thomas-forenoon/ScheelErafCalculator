import type { EventConfig, Participant } from "@/types";

const STORAGE_KEY = "scheel-eraf-calculator-state-v1";

export type StoredCalculatorState = {
  config: EventConfig;
  participants: Participant[];
};

export function loadStoredState(): StoredCalculatorState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredCalculatorState;

    if (!parsed.config || !Array.isArray(parsed.participants)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredState(state: StoredCalculatorState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearStoredState(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
