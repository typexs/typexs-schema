import {NotYetImplementedError} from 'typexs-base/libs/exceptions/NotYetImplementedError';
import {
  XS_DEFAULT_SCHEMA,
  XS_TYPE,
  XS_TYPE_CLASS_REF,
  XS_TYPE_ENTITY,
  XS_TYPE_PROPERTY,
  XS_TYPE_SCHEMA
} from './Constants';

import {SchemaDef} from './registry/SchemaDef';
import {PropertyDef} from './registry/PropertyDef';
import {LookupRegistry} from './LookupRegistry';
import {AbstractDef} from './registry/AbstractDef';
import {EntityDef} from './registry/EntityDef';
import {IProperty} from './registry/IProperty';
import {IEntity} from './registry/IEntity';
import {ISchema} from './registry/ISchema';
import * as _ from './LoDash'
import {ClassRef} from "./registry/ClassRef";
import {Binding} from "./registry/Binding";

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
    let classRef = ClassRef.get(fn);
    let binding = Binding.create(XS_TYPE_SCHEMA, schema.name, XS_TYPE_CLASS_REF, classRef);
    this.$()._lookup.remove(binding.bindingType, (b: Binding) => b.source == XS_DEFAULT_SCHEMA && b.target.id() == classRef.id());
    this.register(binding);
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

  getPropertyDefsFor(entity: EntityDef | ClassRef): PropertyDef[] {
    if (entity instanceof EntityDef) {
      return this._lookup.filter(XS_TYPE_PROPERTY, (x: PropertyDef) => x.object.id() === entity.getClassRef().id());
    } else {
      return this._lookup.filter(XS_TYPE_PROPERTY, (x: PropertyDef) => {
        return x.object.id() === entity.id()
      });
    }
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


  static getPropertyDefsFor(entity: EntityDef | ClassRef) {
    return this.$().getPropertyDefsFor(entity);
  }

  static reset() {
    LookupRegistry.reset();
    this._self = null;

  }
}

