import * as _ from 'lodash';
import {NotYetImplementedError} from 'typexs-base';
import {XS_TYPE, XS_TYPE_CLASS_REF, XS_TYPE_ENTITY, XS_TYPE_PROPERTY, XS_TYPE_SCHEMA} from './Constants';

import {SchemaDef} from './SchemaDef';
import {PropertyDef} from './PropertyDef';
import {LookupRegistry} from './LookupRegistry';
import {AbstractDef} from './AbstractDef';
import {EntityDef} from './EntityDef';
import {IProperty} from './IProperty';
import {IEntity} from './IEntity';
import {ISchema} from './ISchema';


export class Registry {


  private static _self: Registry; // = new Registry();

  private _lookup: LookupRegistry;


  private constructor() {
    this._lookup = LookupRegistry.$();
    let defaultSchema = new SchemaDef({name: 'default'});
    this._lookup.add(XS_TYPE_SCHEMA, defaultSchema);
  }


  static $() {
    if (!this._self) {
      this._self = new Registry();
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
    let binding = Binding.create(XS_TYPE_SCHEMA, schema.name, XS_TYPE_ENTITY, fn.name);
    this.register(binding);
    let entity = <EntityDef>this.$()._lookup.find(XS_TYPE_ENTITY, {name: fn.name});
    entity.schemaName = schema.name;
    return schema;
  }


  static createEntity(fn: Function, options: IEntity = {}): EntityDef {
    return new EntityDef(fn, options);
  }


  static createProperty(options: IProperty): PropertyDef {
    return new PropertyDef(options);
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
    return this.$()._lookup.filter(XS_TYPE_PROPERTY, {entityName: entity.name});
  }

  static reset() {
    LookupRegistry.reset();
    this._self = null;

  }
}

export class Binding {

  bindingType: XS_TYPE;

  sourceType: XS_TYPE;
  sourceName: string;

  targetType: XS_TYPE;
  targetName: string;

  static create(sType: XS_TYPE, sName: string, tType: XS_TYPE, tName: string) {
    let b = new Binding();
    b.bindingType = <XS_TYPE>[sType, tType].join('_');
    b.sourceType = sType;
    b.targetType = tType;
    b.sourceName = sName;
    b.targetName = tName;
    return b;
  }
}

