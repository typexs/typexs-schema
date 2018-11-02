import {StorageRef} from 'typexs-base/libs/storage/StorageRef';
import {SchemaDef} from './registry/SchemaDef';
import {EntityDef} from './registry/EntityDef';
import {ISchemaMapper} from "./framework/ISchemaMapper";
import {INameResolver} from "./framework/INameResolver";
import {IFramework} from "./framework/IFramework";
import {NotSupportedError} from "typexs-base";
import {IFindOptions} from "./framework/IFindOptions";


export class EntityController {

  // revision support
  readonly storageRef: StorageRef;

  readonly schemaDef: SchemaDef;

   readonly mapper: ISchemaMapper;

  readonly name: string;

  readonly framework: IFramework;

  constructor(name: string, schema: SchemaDef = null, storageRef: StorageRef = null, framework: IFramework = null) {
    this.name = name;
    this.storageRef = storageRef;
    this.schemaDef = schema;
    if(framework){
      this.framework = framework;
      this.mapper = framework.getSchemaMapper(this.storageRef,this.schemaDef);
    }
  }

  nameResolver(): INameResolver {
    if(this.mapper){
      return this.mapper.nameResolver;
    }
    throw new NotSupportedError('no framework support')
  }

  schema(): SchemaDef {
    return this.schemaDef;
  }

  async initialize() {
    if(!this.mapper){
      throw new NotSupportedError('no framework support')
    }
    await this.mapper.initialize();
  }

  async save<T>(object: T): Promise<T>;
  async save<T>(object: T[]): Promise<T[]>;
  async save<T>(object: T | T[]): Promise<T | T[]> {
    if(!this.framework) throw new NotSupportedError('no framework support');
    return this.framework.getSaveOp<T>(this).run(object);
  }


  async find<T>(fn: Function | string, conditions: any = null, options:IFindOptions = {limit:100}): Promise<T[]> {
    if(!this.framework) throw new NotSupportedError('no framework support');
    return this.framework.getFindOp<T>(this).run(fn, conditions, options);
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




