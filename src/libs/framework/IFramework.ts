import {ISchemaMapper} from './ISchemaMapper';
import {EntityController} from '../EntityController';
import {SchemaRef} from '../registry/SchemaRef';
import {IStorageRef} from '@typexs/base/libs/storage/IStorageRef';
import {IFindOp} from '@typexs/base/libs/storage/framework/IFindOp';
import {IDeleteOp} from '@typexs/base/libs/storage/framework/IDeleteOp';
import {ISaveOp} from '@typexs/base/libs/storage/framework/ISaveOp';
import {ISchemaRef} from '../../../../../node-commons/allgemein-schema-api/build/package';

export interface IFramework {

  on(storageRef: IStorageRef): boolean;

  getSchemaMapper(storageRef: IStorageRef, schemaDef: ISchemaRef): ISchemaMapper;

  getFindOp<T>(entityController: EntityController): IFindOp<T>;

  getDeleteOp<T>(entityController: EntityController): IDeleteOp<T>;

  getSaveOp<T>(entityController: EntityController): ISaveOp<T>;
}
