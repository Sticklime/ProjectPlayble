/**
 * Creates a Promise that safely executes the provided callback asynchronously,
 * ensuring that any synchronous errors inside the callback are caught and
 * reject the promise properly.
 *
 * If the environment supports `queueMicrotask`, it is used to schedule the
 * callback; otherwise, a `setTimeout` fallback is used.
 *
 * @template T The type of the value that the promise resolves to.
 * @param {(resolve: (value: T) => void, reject: (reason?: unknown) => void) => void} callback
 *   A function that takes resolve and reject functions to control the promise.
 * @returns {Promise<T>} A Promise that resolves or rejects based on the callback execution.
 */
export function safePromise<T = unknown>(
  callback: (
    resolve: (value: T) => void,
    reject: (reason?: unknown) => void,
  ) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof queueMicrotask === "function") {
        queueMicrotask(() => {
          try {
            callback(resolve, reject);
          } catch (error) {
            console.error("Error in safePromise callback:", error);
            reject(error);
          }
        });
      } else {
        setTimeout(() => {
          try {
            callback(resolve, reject);
          } catch (error) {
            console.error("Error in safePromise callback:", error);
            reject(error);
          }
        }, 1);
      }
    } catch (error) {
      console.error("Error in safePromise:", error);
      reject(error);
    }
  });
}

/**
 * Returns a Promise that resolves after waiting for the specified duration
 * using animation frames for more precise timing.
 *
 * @param {number} duration The duration to wait in seconds.
 * @returns {Promise<void>} A Promise that resolves after the specified duration.
 */
export function safeWait(duration: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const start = performance.now();
    const wait = () => {
      if (performance.now() - start >= duration * 1000) {
        resolve();
      } else {
        requestAnimationFrame(wait);
      }
    };
    wait();
  });
}
