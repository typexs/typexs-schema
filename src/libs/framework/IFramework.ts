import {StorageRef} from "@typexs/base/libs/storage/StorageRef";
import {ISchemaMapper} from "./ISchemaMapper";
import {IFindOp} from "./IFindOp";
import {ISaveOp} from "./ISaveOp";
import {IDeleteOp} from "./IDeleteOp";
import {EntityController} from "../EntityController";
import {SchemaRef} from "../registry/SchemaRef";

export interface IFramework {

  on(storageRef: StorageRef): boolean;

  getSchemaMapper(storageRef: StorageRef, schemaDef: SchemaRef): ISchemaMapper;

  getFindOp<T>(entityController: EntityController): IFindOp<T>;

  getDeleteOp<T>(entityController: EntityController): IDeleteOp<T>;

  getSaveOp<T>(entityController: EntityController): ISaveOp<T>;
}
