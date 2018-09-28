import {StorageRef} from "typexs-base/libs/storage/StorageRef";
import {ISchemaMapper} from "./ISchemaMapper";
import {IFindOp} from "./IFindOp";
import {ISaveOp} from "./ISaveOp";
import {IDeleteOp} from "./IDeleteOp";
import {EntityController} from "../EntityController";
import {SchemaDef} from "../registry/SchemaDef";

export interface IFramework {

  on(storageRef: StorageRef): boolean;

  getSchemaMapper(storageRef: StorageRef, schemaDef: SchemaDef): ISchemaMapper;

  getFindOp<T>(entityController: EntityController): IFindOp<T>;

  getDeleteOp<T>(entityController: EntityController): IDeleteOp<T>;

  getSaveOp<T>(entityController: EntityController): ISaveOp<T>;
}
