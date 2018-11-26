import {NotYetImplementedError} from '@typexs/base/libs/exceptions/NotYetImplementedError';
import {XS_DEFAULT_SCHEMA, XS_TYPE_CLASS_REF, XS_TYPE_ENTITY, XS_TYPE_PROPERTY, XS_TYPE_SCHEMA} from './Constants';

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
import {SchemaUtils} from "./SchemaUtils";
import {IEntityMetadata} from "./registry/IEntityMetadata";
import {IPropertyMetadata} from "./registry/IPropertyMetadata";
import {IClassRefMetadata} from "./registry/IClassRefMetadata";
import {ValidationMetadata} from "class-validator/metadata/ValidationMetadata";
import {getFromContainer} from "class-validator/container";
import {MetadataStorage} from "class-validator/metadata/MetadataStorage";



export class EntityRegistry {

  static NAME : string = 'EntityRegistry';

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


  static fromJson(json: IEntityMetadata): EntityDef {
    let classRef = ClassRef.find(json.name);
    if (!classRef) {
      classRef = ClassRef.get(SchemaUtils.clazz(json.name));
    }
    classRef.setSchema(json.schema);

    let entity = EntityRegistry.$().getEntityDefByName(json.name);
    if (!entity) {
      entity = this.createEntity(classRef, json.options);
      this.register(entity);

      json.properties.forEach(property => {
        this._fromJsonProperty(property, classRef);
      });
    }
    return entity;
  }


  private static _fromJsonProperty(property: IPropertyMetadata, classRef: ClassRef) {
    let options = _.clone(property.options);
    options.sourceClass = classRef;

    if (property.targetRef) {
      let classRef = this._fromJsonClassRef(property.targetRef);
      options.type = classRef.getClass();
    }

    if (property.propertyRef) {
      let classRef = this._fromJsonClassRef(property.propertyRef);
      options.propertyClass = classRef.getClass();
    }

    if (property.validator) {
      property.validator.forEach(m => {
        let _m = _.clone(m);
        _m.target = classRef.getClass();
        let vma = new ValidationMetadata(_m);
        getFromContainer(MetadataStorage).addValidationMetadata(vma);
      })
    }

    let prop = this.createProperty(options);
    this.register(prop);
  }


  private static _fromJsonClassRef(classRefMetadata: IClassRefMetadata) {
    let classRef = ClassRef.get(classRefMetadata.className);
    classRef.setSchemas(_.isArray(classRefMetadata.schema) ? classRefMetadata.schema : [classRefMetadata.schema]);

    if (classRefMetadata.properties) {
      classRefMetadata.properties.forEach(property => {
        this._fromJsonProperty(property, classRef);
      });
    }

    return classRef;
  }


  static createEntity(fn: Function | ClassRef, options: IEntity = {}): EntityDef {
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

