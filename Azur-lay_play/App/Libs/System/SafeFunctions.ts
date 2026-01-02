export function safePromise(
  callback: (
    resolve: (value?: unknown) => void,
    reject: (reason?: unknown) => void,
  ) => void,
): Promise<unknown> {
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

export function safeWait(duration: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const start = Date.now();
    const wait = () => {
      if (Date.now() - start >= duration * 1000) {
        resolve();
      } else {
        requestAnimationFrame(wait);
      }
    };
    wait();
  });
}
