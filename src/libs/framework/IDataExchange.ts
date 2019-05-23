export interface IDataExchange<T> {
  next: T;
  abort?: boolean;
  status?: any;
}
