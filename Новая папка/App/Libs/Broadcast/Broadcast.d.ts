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
}

interface BroadcastStatic {
  make(object: any): void;
}

declare const Broadcast: BroadcastStatic & BroadcastPrototype;

export default Broadcast;
