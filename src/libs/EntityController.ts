import * as _ from 'lodash';
import {SchemaRef} from './registry/SchemaRef';
import {ISchemaMapper} from './framework/ISchemaMapper';
import {INameResolver} from './framework/INameResolver';
import {IFramework} from './framework/IFramework';
import {IEntityController, ISaveOptions, IStorageRef, NotSupportedError, NotYetImplementedError} from '@typexs/base';
import {IFindOptions} from './framework/IFindOptions';
import {ClassRef, ClassType, IClassRef, IEntityRef, ISchemaRef, METATYPE_CLASS_REF} from '@allgemein/schema-api';
import {IAggregateOptions} from '@typexs/base/libs/storage/framework/IAggregateOptions';
import {IUpdateOptions} from '@typexs/base/libs/storage/framework/IUpdateOptions';

export type CLS_DEF<T> = ClassType<T> | Function | string;

export class EntityController implements IEntityController {

  constructor(name: string, schema: ISchemaRef = null, storageRef: IStorageRef = null, framework: IFramework = null) {
    this._name = name;
    this.storageRef = storageRef;
    this.schemaDef = schema;
    if (framework) {
      this.framework = framework;
      this.mapper = framework.getSchemaMapper(this.storageRef, this.schemaDef);
    }
  }

  // revision support
  readonly storageRef: IStorageRef;

  readonly schemaDef: ISchemaRef;

  readonly mapper: ISchemaMapper;

  readonly _name: string;

  readonly framework: IFramework;

  resolveByEntityDef<T>(objs: T[]) {
    const resolved: { [entityType: string]: T[] } = {};
    for (const obj of objs) {
      // const entityName = EntityRef.resolveName(obj);
      const className = ClassRef.getClassName(obj);
      const classRef: IClassRef = this.getRegistry().find(METATYPE_CLASS_REF, (x: IClassRef) => x.name === className);
      if (classRef) {
        const entityName = classRef.name;
        if (!resolved[entityName]) {
          resolved[entityName] = [];
        }
        resolved[entityName].push(obj);
      } else {
        throw new Error('resolveName not found for instance: ' + JSON.stringify(obj));
      }

    }
    return resolved;
  }

  getRegistry() {
    return this.schemaDef.getRegistry();
  }


  name() {
    return this._name;
  }

  nameResolver(): INameResolver {
    if (this.mapper) {
      return this.mapper.nameResolver;
    }
    throw new NotSupportedError('no framework support');
  }

  schema(): SchemaRef {
    return this.schemaDef as SchemaRef;
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
    if (!this.framework) {
      throw new NotSupportedError('no framework support');
    }
    return this.framework.getSaveOp<T>(this).run(object, options);
  }


  async findOne<T>(fn: Function | string | ClassType<T>, conditions: any = null, options: IFindOptions = {limit: 1}): Promise<T> {
    return this.find<T>(fn, conditions, _.assign(options, {limit: 1})).then(r => r.shift());
  }


  async find<T>(fn: Function | string | ClassType<T>, conditions: any = null, options?: IFindOptions): Promise<T[]> {
    if (!this.framework) {
      throw new NotSupportedError('no framework support');
    }
    return this.framework.getFindOp<T>(this).run(fn, conditions, options);
  }


  async remove<T>(object: T): Promise<T>;
  async remove<T>(object: T[]): Promise<T[]>;
  async remove<T>(object: T | T[]): Promise<T[] | number | T> {
    if (!this.framework) {
      throw new NotSupportedError('no framework support');
    }
    return this.framework.getDeleteOp<T>(this).run(object);
  }

  aggregate<T>(baseClass: CLS_DEF<T>, pipeline: any[], options?: IAggregateOptions): Promise<any[]> {
    throw new NotYetImplementedError();
  }

  forClass<T>(cls: CLS_DEF<T> | IClassRef): IEntityRef {
    throw new NotYetImplementedError();
  }

  update<T>(cls: CLS_DEF<T>, condition: any, update: any, options?: IUpdateOptions): Promise<number> {
    throw new NotYetImplementedError();
  }

}




