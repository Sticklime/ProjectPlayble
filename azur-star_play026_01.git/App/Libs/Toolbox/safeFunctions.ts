const ONE_TENTH = 0.1;

/**
 * Checks if the current browser is iOS Safari or another mobile browser
 * with known Promise and timing issues.
 *
 * @returns true if the browser may have timing issues
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
 * Creates a Promise with safe callback execution and proper error handling.
 * Works around iOS Safari and mobile WebKit Promise execution issues.
 *
 * Uses queueMicrotask or setTimeout to force asynchronous execution,
 * preventing Promise hangs in problematic browsers.
 *
 * @typeParam T - type of the value the promise resolves to
 * @param callback - function that receives resolve and reject parameters
 * @param forceWorkaround - force the workaround even on non-problematic browsers
 * @returns Promise that resolves or rejects based on callback execution
 *
 * @example
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
 * Returns a Promise that resolves after the specified delay.
 * Works around iOS Safari setTimeout throttling issues in background tabs.
 *
 * Uses requestAnimationFrame for active tabs and setTimeout for background tabs.
 * Prioritizes reliability over precision.
 *
 * @param duration - wait time in seconds
 * @param forceWorkaround - force the workaround even on non-problematic browsers
 * @returns Promise that resolves after the specified time
 *
 * @example
 * ```typescript
 * await safeWait(0.5);
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
