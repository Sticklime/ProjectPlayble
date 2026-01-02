interface Array<T> {
  readonly first: T | undefined;
  readonly last: T | undefined;
  randomElement(): T | undefined;
  add(value: T): void;
  remove(value: T): T | null;
  rotate(count?: number): this;
  findFirst<S extends T>(
    callback: (value: T, index: number, array: T[]) => value is S,
  ): S | null;
  findFirst(
    callback: (value: T, index: number, array: T[]) => unknown,
  ): T | null;
}
