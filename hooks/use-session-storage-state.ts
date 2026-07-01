"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export const SESSION_STORAGE_LEAD_PREFIX = "fabrika:lead:";

function readSessionStorageValue<T>(key: string | null, initialValue: T): T {
  if (!key || typeof window === "undefined") return initialValue;
  try {
    const stored = window.sessionStorage.getItem(key);
    return stored === null ? initialValue : (JSON.parse(stored) as T);
  } catch {
    return initialValue;
  }
}

export function clearSessionStorageKey(key: string | null): void {
  if (!key || typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}

export function useSessionStorageState<T>(
  key: string | null,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const initialValueRef = useRef(initialValue);
  const [value, setValue] = useState<T>(() =>
    readSessionStorageValue(key, initialValue),
  );

  useEffect(() => {
    setValue(readSessionStorageValue(key, initialValueRef.current));
  }, [key]);

  const setStoredValue = useCallback<Dispatch<SetStateAction<T>>>(
    (nextValue) => {
      setValue((current) => {
        const resolved =
          typeof nextValue === "function"
            ? (nextValue as (value: T) => T)(current)
            : nextValue;
        if (key && typeof window !== "undefined") {
          try {
            window.sessionStorage.setItem(key, JSON.stringify(resolved));
          } catch {
            // Keep React state working even when sessionStorage is unavailable.
          }
        }
        return resolved;
      });
    },
    [key],
  );

  const clearStoredValue = useCallback(() => {
    clearSessionStorageKey(key);
    setValue(initialValueRef.current);
  }, [key]);

  return [value, setStoredValue, clearStoredValue];
}
