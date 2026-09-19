import { useRef, useState } from "react";

export function useUndoRedo<T>() {
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const [counts, setCounts] = useState({ past: 0, future: 0 });

  const push = (snapshot: T) => {
    past.current = [...past.current, snapshot];
    future.current = [];
    setCounts({ past: past.current.length, future: future.current.length });
  };

  const undo = (current: T) => {
    const previous = past.current.at(-1);
    if (previous === undefined) return undefined;
    past.current = past.current.slice(0, -1);
    future.current = [current, ...future.current];
    setCounts({ past: past.current.length, future: future.current.length });
    return previous;
  };

  const redo = (current: T) => {
    const next = future.current[0];
    if (next === undefined) return undefined;
    future.current = future.current.slice(1);
    past.current = [...past.current, current];
    setCounts({ past: past.current.length, future: future.current.length });
    return next;
  };

  return {
    push,
    undo,
    redo,
    canUndo: counts.past > 0,
    canRedo: counts.future > 0,
  };
}
