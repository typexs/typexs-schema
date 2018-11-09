import {IFramework} from "../IFramework";
import {EntityController} from "../../EntityController";
import {IDeleteOp} from "../IDeleteOp";
import {IFindOp} from "../IFindOp";
import {ISaveOp} from "../ISaveOp";
import {ISchemaMapper} from "../ISchemaMapper";
import {StorageRef} from "typexs-base";
import {SchemaDef} from "../../registry/SchemaDef";
import {SqlSchemaMapper} from "./SqlSchemaMapper";
import {SqlFindOp} from "./SqlFindOp";
import {SqlSaveOp} from "./SqlSaveOp";
import {SqlDeleteOp} from "./SqlDeleteOp";


export class SqlFramework implements IFramework {

  getDeleteOp<T>(entityController: EntityController): IDeleteOp<T> {
    return new SqlDeleteOp(entityController);
  }

  getFindOp<T>(entityController: EntityController): IFindOp<T> {
    return new SqlFindOp(entityController);
  }

  getSaveOp<T>(entityController: EntityController): ISaveOp<T> {
    return new SqlSaveOp(entityController);
  }

  getSchemaMapper(storageRef: StorageRef, schemaDef: SchemaDef): ISchemaMapper {
    return new SqlSchemaMapper(storageRef, schemaDef);
  }

  on(storageRef: StorageRef): boolean {
  // ignore| "cordova" | "react-native" | "sqljs"
    if(["mysql","postgres", "mariadb", "sqlite", "oracle", "mssql"].indexOf(storageRef.dbType)!==-1){
      return true;
    }else if(storageRef.dbType == 'aios'){
      return true;
    }
    return false;

  }

}
