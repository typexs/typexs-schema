import {StorageRef} from 'typexs-base/libs/storage/StorageRef';
import {SchemaDef} from './SchemaDef';
import {EntityDef} from './EntityDef';
import {TypeOrmSchemaMapper} from './framework/TypeOrmSchemaMapper';
import {SaveOp} from './ops/SaveOp';
import {FindOp} from './ops/FindOp';
import {TypeOrmNameResolver} from './framework/TypeOrmNameResolver';


/**
 *
 *
 *
 */
export class EntityManager {

  // revision support
  readonly storageRef: StorageRef;

  readonly schemaDef: SchemaDef;

  readonly mapper: TypeOrmSchemaMapper;


  constructor(schema: SchemaDef = null, storageRef: StorageRef = null) {
    this.storageRef = storageRef;
    this.schemaDef = schema;
    this.mapper = new TypeOrmSchemaMapper(this.storageRef, this.schemaDef);
  }

  nameResolver(): TypeOrmNameResolver {
    return this.mapper.nameResolver;
  }

  schema(): SchemaDef {
    return this.schemaDef;
  }

  async initialize() {
    await this.mapper.initialize();
  }

  async save<T>(object: T): Promise<T>;
  async save<T>(object: T[]): Promise<T[]>;
  async save<T>(object: T | T[]): Promise<T | T[]> {
    return new SaveOp<T>(this).run(object);
  }


  async find<T>(fn: Function, conditions: any = null, limit:number=100): Promise<T[]> {
    return new FindOp<T>(this).run(fn, conditions,limit);
  }


  static resolveByEntityDef<T>(objs: T[]) {
    let resolved: { [entityType: string]: T[] } = {};
    for (let obj of objs) {
      let entityName = EntityDef.resolveName(obj);
      if (!resolved[entityName]) {
        resolved[entityName] = [];
      }
      resolved[entityName].push(obj);

    }
    return resolved;
  }

}

export class Bindings {
  variant: string;
  source: any;
  propertyName: string;
  index: number = -1;
  target: any;
}




