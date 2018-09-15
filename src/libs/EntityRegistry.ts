import {NotYetImplementedError} from 'typexs-base/libs/exceptions/NotYetImplementedError';
import {XS_TYPE, XS_TYPE_CLASS_REF, XS_TYPE_ENTITY, XS_TYPE_PROPERTY, XS_TYPE_SCHEMA} from './Constants';

import {SchemaDef} from './SchemaDef';
import {PropertyDef} from './PropertyDef';
import {LookupRegistry} from './LookupRegistry';
import {AbstractDef} from './AbstractDef';
import {EntityDef} from './EntityDef';
import {IProperty} from './IProperty';
import {IEntity} from './IEntity';
import {ISchema} from './ISchema';
import * as _ from './LoDash'
import {ClassRef} from "./ClassRef";

export class EntityRegistry {


  private static _self: EntityRegistry; // = new Registry();

  private _lookup: LookupRegistry;


  private constructor() {
    this._lookup = LookupRegistry.$();
    let defaultSchema = new SchemaDef({name: 'default'});
    this._lookup.add(XS_TYPE_SCHEMA, defaultSchema);
  }


  static $() {
    if (!this._self) {
      this._self = new EntityRegistry();
    }
    return this._self;
  }


  static getSchema(name: string): SchemaDef {
    return LookupRegistry.$().find(XS_TYPE_SCHEMA, {name: name});
  }

  listProperties() {
    return LookupRegistry.$().list(XS_TYPE_PROPERTY);
  }

  listEntities() {
    return LookupRegistry.$().list(XS_TYPE_ENTITY);
  }

  listClassRefs() {
    return LookupRegistry.$().list(XS_TYPE_CLASS_REF);
  }

  listSchemas() {
    return LookupRegistry.$().list(XS_TYPE_SCHEMA);
  }

  static register(xsdef: AbstractDef | Binding): AbstractDef | Binding {
    if (xsdef instanceof EntityDef) {
      return this.$()._lookup.add(XS_TYPE_ENTITY, xsdef);
    } else if (xsdef instanceof PropertyDef) {
      return this.$()._lookup.add(XS_TYPE_PROPERTY, xsdef);
    } else if (xsdef instanceof SchemaDef) {
      return this.$()._lookup.add(XS_TYPE_SCHEMA, xsdef);
    } else if (xsdef instanceof Binding) {
      return this.$()._lookup.add(xsdef.bindingType, xsdef);
    } else {
      throw new NotYetImplementedError();
    }
  }

  static createSchema(fn: Function, options: ISchema): SchemaDef {
    let schema = <SchemaDef>this.$()._lookup.find(XS_TYPE_SCHEMA, {name: options.name});
    if (!schema) {
      schema = new SchemaDef(options);
      schema = this.$()._lookup.add(XS_TYPE_SCHEMA, schema);
    }
    let binding = Binding.create(XS_TYPE_SCHEMA, schema.name, XS_TYPE_ENTITY, fn);
    this.register(binding);
    let classRef = ClassRef.get(fn);
    classRef.setSchema(schema.name);
    return schema;
  }


  static createEntity(fn: Function, options: IEntity = {}): EntityDef {
    return new EntityDef(fn, options);
  }


  static createProperty(options: IProperty): PropertyDef {
    return new PropertyDef(options);
  }

  getSchemaDefByName(name: string): SchemaDef {
    return this._lookup.find(XS_TYPE_SCHEMA, (e: EntityDef) => {
      return e.machineName == _.snakeCase(name)
    });
  }

  getEntityDefByName(name: string): EntityDef {
    return this._lookup.find(XS_TYPE_ENTITY, (e: EntityDef) => {
      return e.machineName == _.snakeCase(name)
    });
  }

  getPropertyDefsFor(entity: EntityDef): PropertyDef[] {
    return this._lookup.find(XS_TYPE_PROPERTY, {entityName: entity.name});
  }


  static getEntityDefFor(instance: Object | string): EntityDef {
    let cName = null;
    if (_.isString(instance)) {
      cName = instance;
    } else {
      cName = instance.constructor.name;
    }
    return this.$()._lookup.find(XS_TYPE_ENTITY, {name: cName});
  }


  static getPropertyDefsFor(entity: EntityDef) {
    return this.$().getPropertyDefsFor(entity);
  }

  static reset() {
    LookupRegistry.reset();
    this._self = null;

  }
}

export class Binding {

  bindingType: XS_TYPE;

  sourceType: XS_TYPE;
  source: any;

  targetType: XS_TYPE;
  target: any;

  static create(sType: XS_TYPE, sName: any, tType: XS_TYPE, tName: any) {
    let b = new Binding();
    b.bindingType = <XS_TYPE>[sType, tType].join('_');
    b.sourceType = sType;
    b.targetType = tType;
    b.source = sName;
    b.target = tName;
    return b;
  }
}

