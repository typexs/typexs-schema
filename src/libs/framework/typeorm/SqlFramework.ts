import {IFramework} from '../IFramework';
import {EntityController} from '../../EntityController';
import {IDeleteOp} from '../IDeleteOp';
import {IFindOp} from '../IFindOp';
import {ISaveOp} from '../ISaveOp';
import {ISchemaMapper} from '../ISchemaMapper';
import {IStorageRef, StorageRef, TypeOrmStorageRef} from '@typexs/base';
import {SchemaRef} from '../../registry/SchemaRef';
import {SqlSchemaMapper} from './SqlSchemaMapper';
import {SqlFindOp} from './SqlFindOp';
import {SqlSaveOp} from './SqlSaveOp';
import {SqlDeleteOp} from './SqlDeleteOp';


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

  getSchemaMapper(storageRef: IStorageRef, schemaDef: SchemaRef): ISchemaMapper {
    return new SqlSchemaMapper(storageRef as TypeOrmStorageRef, schemaDef);
  }

  on(storageRef: StorageRef): boolean {
    // ignore| "cordova" | "react-native" | "sqljs"
    if (['mysql', 'postgres', 'mariadb', 'sqlite', 'oracle', 'mssql'].indexOf(storageRef.getType()) !== -1) {
      return true;
    } else if (storageRef.getType() === 'aios') {
      return true;
    }
    return false;

  }

}
