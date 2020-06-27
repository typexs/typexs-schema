import * as _ from 'lodash';
import {SchemaRef} from './registry/SchemaRef';
import {EntityRef} from './registry/EntityRef';
import {ISchemaMapper} from './framework/ISchemaMapper';
import {INameResolver} from './framework/INameResolver';
import {IFramework} from './framework/IFramework';
import {ISaveOptions, IStorageRef, NotSupportedError, StorageRef, TypeOrmStorageRef} from '@typexs/base';
import {IFindOptions} from './framework/IFindOptions';
import {ClassType} from 'commons-schema-api/browser';


export class EntityController {

  constructor(name: string, schema: SchemaRef = null, storageRef: IStorageRef = null, framework: IFramework = null) {
    this.name = name;
    this.storageRef = storageRef;
    this.schemaDef = schema;
    if (framework) {
      this.framework = framework;
      this.mapper = framework.getSchemaMapper(this.storageRef, this.schemaDef);
    }
  }

  // revision support
  readonly storageRef: IStorageRef;

  readonly schemaDef: SchemaRef;

  readonly mapper: ISchemaMapper;

  readonly name: string;

  readonly framework: IFramework;


  static resolveByEntityDef<T>(objs: T[]) {
    const resolved: { [entityType: string]: T[] } = {};
    for (const obj of objs) {
      const entityName = EntityRef.resolveName(obj);
      if (!resolved[entityName]) {
        resolved[entityName] = [];
      }
      resolved[entityName].push(obj);

    }
    return resolved;
  }

  nameResolver(): INameResolver {
    if (this.mapper) {
      return this.mapper.nameResolver;
    }
    throw new NotSupportedError('no framework support');
  }

  schema(): SchemaRef {
    return this.schemaDef;
  }

  async initialize() {
    if (!this.mapper) {
      throw new NotSupportedError('no framework support');
    }
    await this.mapper.initialize();
  }


  async save<T>(object: T, options?: ISaveOptions): Promise<T>;
  async save<T>(object: T[], options?: ISaveOptions): Promise<T[]>;
  async save<T>(object: T | T[], options: ISaveOptions = {validate: true}): Promise<T | T[]> {
    if (!this.framework) { throw new NotSupportedError('no framework support'); }
    return this.framework.getSaveOp<T>(this).run(object, options);
  }


  async findOne<T>(fn: Function | string | ClassType<T>, conditions: any = null, options: IFindOptions = {limit: 1}): Promise<T> {
    return this.find<T>(fn, conditions, _.assign(options, {limit: 1})).then(r => r.shift());
  }


  async find<T>(fn: Function | string | ClassType<T>, conditions: any = null, options?: IFindOptions): Promise<T[]> {
    if (!this.framework) { throw new NotSupportedError('no framework support'); }
    return this.framework.getFindOp<T>(this).run(fn, conditions, options);
  }


  async remove<T>(object: T): Promise<T>;
  async remove<T>(object: T[]): Promise<T[]>;
  async remove<T>(object: T | T[]): Promise<T[] | number | T> {
    if (!this.framework) { throw new NotSupportedError('no framework support'); }
    return this.framework.getDeleteOp<T>(this).run(object);
  }

}




