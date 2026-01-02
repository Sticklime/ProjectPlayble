function isProblematicMobileBrowser(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isSafari =
    /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
  const isOldWebKit = /webkit\/([0-9]+)/.test(userAgent);

  return isIOS || (isSafari && isOldWebKit);
}

/**
 * Promise wrapper with iOS Safari/WebKit workaround for timing issues.
 *
 * Uses queueMicrotask or setTimeout to force async execution on problematic browsers.
 *
 * @typeParam T - Promise value type
 * @param callback - Executor function
 * @param forceWorkaround - Apply workaround regardless of browser
 */
export function safePromise<T = unknown>(
  callback: (
    resolve: (value: T) => void,
    reject: (reason?: unknown) => void,
  ) => void,
  forceWorkaround = false,
): Promise<T> {
  const shouldUseWorkaround = forceWorkaround || isProblematicMobileBrowser();

  if (!shouldUseWorkaround) {
    return new Promise<T>(callback);
  }

  return new Promise<T>((resolve, reject) => {
    try {
      const executeCallback = (): void => {
        try {
          callback(resolve, reject);
        } catch (error) {
          console.error(
            "[safePromise] Error in callback execution (iOS Safari workaround):",
            error,
          );
          reject(error);
        }
      };

      if (typeof queueMicrotask === "function") {
        queueMicrotask(executeCallback);
      } else {
        setTimeout(executeCallback, 1);
      }
    } catch (error) {
      console.error("[safePromise] Error in scheduling callback:", error);
      reject(error);
    }
  });
}

/**
 * Async delay with iOS Safari setTimeout throttling workaround.
 *
 * Uses requestAnimationFrame for visible tabs, setTimeout intervals for background.
 *
 * @param duration - Wait time (seconds)
 * @param forceWorkaround - Apply workaround regardless of browser
 */
export function safeWait(
  duration: number,
  forceWorkaround = false,
): Promise<void> {
  const shouldUseWorkaround = forceWorkaround || isProblematicMobileBrowser();

  if (!shouldUseWorkaround) {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, duration * 1000);
    });
  }

  return new Promise<void>((resolve) => {
    const startTime = performance.now();
    const targetDuration = duration * 1000;

    const isPageVisible =
      typeof document !== "undefined"
        ? document.visibilityState !== "hidden"
        : true;

    if (isPageVisible && typeof requestAnimationFrame === "function") {
      const checkTime = (): void => {
        const elapsed = performance.now() - startTime;

        if (elapsed >= targetDuration) {
          resolve();
        } else {
          requestAnimationFrame(checkTime);
        }
      };

      requestAnimationFrame(checkTime);
    } else {
      const checkInterval = Math.min(targetDuration * 0.1, 100);

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
