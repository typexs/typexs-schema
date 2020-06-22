import {StorageRef} from '@typexs/base/libs/storage/StorageRef';
import {ISchemaMapper} from './ISchemaMapper';
import {IFindOp} from './IFindOp';
import {ISaveOp} from './ISaveOp';
import {IDeleteOp} from './IDeleteOp';
import {EntityController} from '../EntityController';
import {SchemaRef} from '../registry/SchemaRef';
import {IStorageRef} from '@typexs/base';

export interface IFramework {

  on(storageRef: IStorageRef): boolean;

  getSchemaMapper(storageRef: IStorageRef, schemaDef: SchemaRef): ISchemaMapper;

  getFindOp<T>(entityController: EntityController): IFindOp<T>;

  getDeleteOp<T>(entityController: EntityController): IDeleteOp<T>;

  getSaveOp<T>(entityController: EntityController): ISaveOp<T>;
}
