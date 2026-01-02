/**
 * Callback type for event listeners.
 * @param args - Arguments passed to the event listener.
 */
export type EventCallback = (...args: any[]) => void;

export default class EventHandler {
  /**
   * Map of event types to their listeners.
   * Each listener contains a callback, optional context, priority, and once flag.
   */
  private listeners = new Map<
    string,
    {
      callback: EventCallback;
      context?: unknown;
      priority: number;
      once?: boolean;
    }[]
  >();

  /**
   * Register an event listener.
   * @param type - The event type to listen for.
   * @param callback - The callback function to invoke when the event is emitted.
   * @param context - Optional context to bind the callback function.
   * @param priority - Priority of the listener; lower values are called first. Default is 100.
   * @returns The event handler instance for chaining.
   */
  public on(
    type: string,
    callback: EventCallback,
    context?: unknown,
    priority = 100,
  ): this {
    this.addListener(type, callback, context, priority, false);
    return this;
  }

  /**
   * Register a one-time event listener that will be removed after first invocation.
   * @param type - The event type to listen for.
   * @param callback - The callback function to invoke when the event is emitted.
   * @param context - Optional context to bind the callback function.
   * @param priority - Priority of the listener; lower values are called first. Default is 100.
   * @returns The event handler instance for chaining.
   */
  public once(
    type: string,
    callback: EventCallback,
    context?: unknown,
    priority = 100,
  ): this {
    this.addListener(type, callback, context, priority, true);
    return this;
  }

  /**
   * Remove event listeners.
   * @param type - The event type to remove listeners from.
   * @param callback - Optional callback function to remove. If omitted, no listeners remain.
   * @param context - Optional context that was bound to the callback.
   * @returns The event handler instance for chaining.
   */
  public off(type: string, callback?: EventCallback, context?: unknown): this {
    if (!this.listeners.has(type)) return this;

    const filtered = callback
      ? this.listeners
          .get(type)!
          .filter(
            (l) =>
              l.callback !== callback || (context && l.context !== context),
          )
      : [];

    filtered.length
      ? this.listeners.set(type, filtered)
      : this.listeners.delete(type);
    return this;
  }

  /**
   * Emit an event, invoking all listeners registered for the event type.
   * Listeners are called in order of ascending priority.
   * Listeners registered with `once` will be removed after invocation.
   * @param type - The event type to emit.
   * @param args - Arguments to pass to the event listeners.
   * @returns True if there were listeners invoked, otherwise false.
   */
  protected emit(type: string, ...args: any[]): boolean {
    const listeners = this.listeners.get(type);
    if (!listeners) return false;

    [...listeners]
      .sort((a, b) => a.priority - b.priority)
      .forEach((listener) => {
        listener.callback.call(listener.context, ...args);
        if (listener.once) this.off(type, listener.callback, listener.context);
      });

    return true;
  }

  /**
   * Add an event listener with specified options.
   * Throws an error if an identical listener (callback + context) already exists for the event type.
   * @param type - The event type.
   * @param callback - The callback function.
   * @param context - Optional context to bind the callback.
   * @param priority - Priority of the listener; lower values are called first.
   * @param once - Whether the listener should be invoked only once.
   */
  private addListener(
    type: string,
    callback: EventCallback,
    context?: unknown,
    priority = 100,
    once = false,
  ): void {
    const listeners = this.listeners.get(type) || [];

    if (
      listeners.some((l) => l.callback === callback && l.context === context)
    ) {
      throw new Error("Event listener already exists");
    }

    listeners.push({ callback, context, priority, once });
    this.listeners.set(type, listeners);
  }
}
