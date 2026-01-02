interface BroadcastEventOptions {
  index?: string;
  bind?: any;
  times?: number;
  delay?: number;
  delayTimeout?: NodeJS.Timeout | null;
}

interface BroadcastDebugOptions {
  excludeEvents?: string[];
  excludeEventsStarts?: string[] | null;
  excludeEventsEnds?: string[] | null;
  showEventArgs?: boolean;
  logFunc?: (
    action: string,
    name: string,
    count: number,
    color: string,
  ) => void;
}

interface BroadcastEventSubscriber {
  caller: (...args: any[]) => void;
  options: BroadcastEventOptions;
}

interface BroadcastEvents {
  [name: string]: {
    [index: string]: BroadcastEventSubscriber;
  };
}

interface BroadcastTimeouts {
  [key: string]: NodeJS.Timeout | null;
}

interface BroadcastPrototype {
  _broadcast_events: BroadcastEvents;
  _broadcast_timeouts: BroadcastTimeouts;
  _broadcast_codename?: string;
  _broadcast_debug: boolean | BroadcastDebugOptions;
  _index: number;

  on(
    name: string | string[],
    caller: (...args: any[]) => void,
    source?: any,
    options?: BroadcastEventOptions,
  ): void;
  once(
    name: string | string[],
    caller: (...args: any[]) => void,
    source?: any,
    options?: BroadcastEventOptions,
  ): void;
  off(name: string | string[], source: any): void;
  call(
    name: string,
    args?: any[],
    options?: BroadcastEventOptions,
    source?: any,
  ): void;
  listenerExists(name: string): boolean;
  enableDebug(options?: BroadcastDebugOptions): void;
  disableDebug(): void;
  isLogEnabled(eventName?: string): boolean;
  logEvent(
    action: string,
    name: string,
    args: any[],
    callerListCount: number,
  ): void;

  _delay_call(
    caller: (...args: any[]) => void,
    options: BroadcastEventOptions,
    args: any[],
  ): void;
  _call(
    caller: (...args: any[]) => void,
    options: BroadcastEventOptions,
    args: any[],
  ): void;
}

interface BroadcastStatic {
  _prototype: BroadcastPrototype;
  _index: number;

  make(object: any): void;
  _warn(...args: any[]): void;
  _getSourceCodename(source: any): string;
}

declare const Broadcast: BroadcastStatic & BroadcastPrototype;

export default Broadcast;
