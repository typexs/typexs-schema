import {IEntityOptions} from '@allgemein/schema-api';

export interface IEntity extends IEntityOptions {

  schema?: string;

  typeorm?: any;

  storable?: boolean;

}
