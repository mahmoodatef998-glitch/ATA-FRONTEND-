import { DependencyList, useCallback, useEffect } from "react";

export function useStableAsyncEffect(
  effect: () => void | Promise<void>,
  deps: DependencyList
) {
  const stableEffect = useCallback(effect, deps);

  useEffect(() => {
    let cancelled = false;

    const result = stableEffect();

    if (result && typeof (result as Promise<void>).then === "function") {
      (result as Promise<void>).catch((error) => {
        if (!cancelled) {
          console.error("useStableAsyncEffect error:", error);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [stableEffect]);
}

