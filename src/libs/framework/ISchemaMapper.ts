import {INameResolver} from './INameResolver';

export interface ISchemaMapper {

  nameResolver: INameResolver;

  initialize(): void;
}
