import * as _ from 'lodash';
import {NotYetImplementedError} from './NotYetImplementedError';
import {XS_TYPE, XS_TYPE_CLASS_REF, XS_TYPE_ENTITY, XS_TYPE_PROPERTY, XS_TYPE_SCHEMA} from './Constants';

import {XsSchemaDef} from './XsSchemaDef';
import {XsPropertyDef} from './XsPropertyDef';
import {XsLookupRegistry} from './XsLookupRegistry';
import {XsDef} from './XsDef';
import {XsEntityDef} from './XsEntityDef';
import {IXsProperty} from './IXsProperty';
import {IXsEntity} from './IXsEntity';
import {IXsSchema} from './IXsSchema';


export class XsRegistry {


  private static _self: XsRegistry; // = new XsRegistry();

  private _lookup: XsLookupRegistry;


  private constructor() {
    this._lookup = XsLookupRegistry.$();
    let defaultSchema = new XsSchemaDef({name: 'default'});
    this._lookup.add(XS_TYPE_SCHEMA, defaultSchema);
  }


  static $() {
    if (!this._self) {
      this._self = new XsRegistry();
    }
    return this._self;
  }


  static getSchema(name: string): XsSchemaDef {
    return XsLookupRegistry.$().find(XS_TYPE_SCHEMA, {name: name});
  }

  listProperties() {
    return XsLookupRegistry.$().list(XS_TYPE_PROPERTY);
  }

  listEntities() {
    return XsLookupRegistry.$().list(XS_TYPE_ENTITY);
  }

  listClassRefs() {
    return XsLookupRegistry.$().list(XS_TYPE_CLASS_REF);
  }

  listSchemas() {
    return XsLookupRegistry.$().list(XS_TYPE_SCHEMA);
  }

  static register(xsdef: XsDef | Binding): XsDef | Binding {
    if (xsdef instanceof XsEntityDef) {
      return this.$()._lookup.add(XS_TYPE_ENTITY, xsdef);
    } else if (xsdef instanceof XsPropertyDef) {
      return this.$()._lookup.add(XS_TYPE_PROPERTY, xsdef);
    } else if (xsdef instanceof XsSchemaDef) {
      return this.$()._lookup.add(XS_TYPE_SCHEMA, xsdef);
    } else if (xsdef instanceof Binding) {
      return this.$()._lookup.add(xsdef.bindingType, xsdef);
    } else {
      throw new NotYetImplementedError();
    }
  }

  static createSchema(fn: Function, options: IXsSchema): XsSchemaDef {
    let schema = <XsSchemaDef>this.$()._lookup.find(XS_TYPE_SCHEMA, {name: options.name});
    if (!schema) {
      schema = new XsSchemaDef(options);
      schema = this.$()._lookup.add(XS_TYPE_SCHEMA, schema);
    }
    let binding = Binding.create(XS_TYPE_SCHEMA, schema.name, XS_TYPE_ENTITY, fn.name);
    this.register(binding);
    let entity = <XsEntityDef>this.$()._lookup.find(XS_TYPE_ENTITY, {name: fn.name});
    entity.schemaName = schema.name;
    return schema;
  }


  static createEntity(fn: Function, options: IXsEntity = {}): XsEntityDef {
    return new XsEntityDef(fn, options);
  }


  static createProperty(options: IXsProperty): XsPropertyDef {
    return new XsPropertyDef(options);
  }


  static getEntityDefFor(instance: Object | string): XsEntityDef {
    let cName = null;
    if (_.isString(instance)) {
      cName = instance;
    } else {
      cName = instance.constructor.name;
    }
    return this.$()._lookup.find(XS_TYPE_ENTITY, {name: cName});
  }


  static getPropertyDefsFor(entity: XsEntityDef) {
    return this.$()._lookup.filter(XS_TYPE_PROPERTY, {entityName: entity.name});
  }

  static reset() {
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

