export interface ISaveOp<T> {
  run(object: T | T[]): Promise<T | T[]>;
}
