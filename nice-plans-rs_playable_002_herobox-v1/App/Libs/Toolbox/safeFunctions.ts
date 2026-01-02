const ONE_TENTH = 0.1;

/**
 * Detects if the current environment is likely iOS Safari or other problematic mobile browsers
 * that have known issues with Promise execution and timing functions.
 *
 * @returns True if the current browser is likely to have timing/Promise issues
 */
function isProblematicMobileBrowser(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isSafari =
    /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
  const isOldWebKit = /webkit\/([0-9]+)/.test(userAgent);

  // iOS Safari or other WebKit-based browsers that might have timing issues
  return isIOS || (isSafari && isOldWebKit);
}

/**
 * Creates a Promise that safely executes the provided callback asynchronously,
 * ensuring that any synchronous errors inside the callback are caught and
 * reject the promise properly.
 *
 * This function works around several iOS Safari and mobile WebKit bugs:
 * - Promises sometimes failing to execute in older iOS versions
 * - Microtask queue getting stuck or delayed
 * - Synchronous errors not properly rejecting promises in some edge cases
 *
 * The function forces asynchronous execution using queueMicrotask when available,
 * falling back to setTimeout for older browsers. This ensures the callback
 * runs in the next event loop iteration, preventing the Promise from getting stuck.
 *
 * @typeParam T - The type of the value that the promise resolves to
 * @param callback - A function that takes resolve and reject functions to control the promise
 * @param forceWorkaround - Force the workaround even on non-problematic browsers
 * @returns A Promise that resolves or rejects based on the callback execution
 *
 * @example
 * Use for potentially problematic async operations:
 * ```typescript
 * const result = await safePromise<string>((resolve, reject) => {
 *   someAsyncOperation()
 *     .then(resolve)
 *     .catch(reject);
 * });
 * ```
 */
export function safePromise<T = unknown>(
  callback: (
    resolve: (value: T) => void,
    reject: (reason?: unknown) => void,
  ) => void,
  forceWorkaround = false,
): Promise<T> {
  // Use workaround only for problematic browsers unless forced
  const shouldUseWorkaround = forceWorkaround || isProblematicMobileBrowser();

  if (!shouldUseWorkaround) {
    // Use standard Promise for non-problematic environments
    return new Promise<T>(callback);
  }

  return new Promise<T>((resolve, reject) => {
    // Outer try-catch for immediate synchronous errors in scheduling
    try {
      const executeCallback = (): void => {
        // Inner try-catch for errors during callback execution
        try {
          callback(resolve, reject);
        } catch (error) {
          // Log for debugging iOS Safari specific issues
          console.error(
            "[safePromise] Error in callback execution (iOS Safari workaround):",
            error,
          );
          reject(error);
        }
      };

      // Prefer queueMicrotask for better performance when available
      if (typeof queueMicrotask === "function") {
        queueMicrotask(executeCallback);
      } else {
        // Fallback to setTimeout with minimal delay for older browsers
        setTimeout(executeCallback, 1);
      }
    } catch (error) {
      // Handle errors in scheduling the callback
      console.error("[safePromise] Error in scheduling callback:", error);
      reject(error);
    }
  });
}

/**
 * Returns a Promise that resolves after waiting for the specified duration.
 *
 * This function works around iOS Safari setTimeout throttling issues:
 * - setTimeout can be throttled to 1000ms+ in background tabs
 * - Timer precision issues when switching between apps
 * - Inconsistent behavior during page visibility changes
 *
 * Uses requestAnimationFrame for active tabs (more reliable than setTimeout in iOS)
 * and falls back to setTimeout for background execution or when RAF is unavailable.
 *
 * Note: This prioritizes reliability over precision. For high-precision timing,
 * consider using performance.now() with your own timing loop.
 *
 * @param duration - The duration to wait in seconds
 * @param forceWorkaround - Force the workaround even on non-problematic browsers
 * @returns A Promise that resolves after the specified duration
 *
 * @example
 * Wait for 0.5 seconds reliably across all platforms:
 * ```typescript
 * await safeWait(0.5);
 * ```
 *
 * Force workaround for testing:
 * ```typescript
 * await safeWait(1.0, true);
 * ```
 */
export function safeWait(
  duration: number,
  forceWorkaround = false,
): Promise<void> {
  // Use workaround only for problematic browsers unless forced
  const shouldUseWorkaround = forceWorkaround || isProblematicMobileBrowser();

  if (!shouldUseWorkaround) {
    // Use standard setTimeout for non-problematic environments
    return new Promise<void>((resolve) => {
      setTimeout(resolve, duration * 1000);
    });
  }

  return new Promise<void>((resolve) => {
    const startTime = performance.now();
    const targetDuration = duration * 1000; // Convert to milliseconds

    // Check if page is visible to determine best timing strategy
    const isPageVisible =
      typeof document !== "undefined"
        ? document.visibilityState !== "hidden"
        : true;

    if (isPageVisible && typeof requestAnimationFrame === "function") {
      // Use RAF for visible pages - more reliable in iOS Safari
      const checkTime = (): void => {
        const elapsed = performance.now() - startTime;

        if (elapsed >= targetDuration) {
          resolve();
        } else {
          requestAnimationFrame(checkTime);
        }
      };

      // Start the timing loop
      requestAnimationFrame(checkTime);
    } else {
      // Fallback to setTimeout for background tabs or when RAF unavailable
      // Use multiple short timeouts to avoid throttling in iOS
      const checkInterval = Math.min(targetDuration * ONE_TENTH, 100); // Max 100ms intervals

      const checkTime = (): void => {
        const elapsed = performance.now() - startTime;

        if (elapsed >= targetDuration) {
          resolve();
        } else {
          setTimeout(checkTime, checkInterval);
        }
      };

      setTimeout(checkTime, checkInterval);
    }
  });
}
