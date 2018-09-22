export interface IFindOp<T> {

  run(entityType: Function | string, findConditions: any, limit: number): Promise<T[]>;

}
