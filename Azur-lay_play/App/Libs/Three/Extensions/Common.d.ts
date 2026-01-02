import "three";

declare module "three" {
  interface EventDispatcher {
    __enhancedListeners?: Record<
      string,
      Array<{
        callback: (...args: any[]) => void;
        context?: any;
        priority: number;
      }>
    >;

    on(
      type: string,
      callback: (...args: any[]) => void,
      context?: any,
      priority?: number,
    ): void;
    off(type: string, callback: (...args: any[]) => void, context?: any): void;
    emit(type: string, ...args: any[]): void;
  }

  interface Color {
    toGLSLString(): string;
  }
}
