import {SchemaRef} from './registry/SchemaRef';
import {PropertyRef} from './registry/PropertyRef';
import {EntityRef} from './registry/EntityRef';
import {IProperty} from './registry/IProperty';
import {IEntity} from './registry/IEntity';
import {ISchema} from './registry/ISchema';
import * as _ from './LoDash';
import {ValidationMetadata} from 'class-validator/metadata/ValidationMetadata';
import {getFromContainer} from 'class-validator/container';
import {MetadataStorage} from 'class-validator/metadata/MetadataStorage';
import {
  AbstractRef,
  Binding,
  ClassRef,
  IClassRefMetadata,
  IEntityRefMetadata,
  ILookupRegistry,
  IPropertyRefMetadata,
  LookupRegistry,
  SchemaUtils,
  XS_DEFAULT_SCHEMA,
  XS_TYPE_CLASS_REF,
  XS_TYPE_ENTITY,
  XS_TYPE_PROPERTY,
  XS_TYPE_SCHEMA
} from 'commons-schema-api/browser';
import {NotYetImplementedError} from '@typexs/base/browser';
import {ClassUtils} from 'commons-base/browser';
import {REGISTRY_TXS_SCHEMA} from './Constants';
import {classRefGet} from './Helper';


export class EntityRegistry implements ILookupRegistry {


  private constructor() {
    this._lookup = LookupRegistry.$(REGISTRY_TXS_SCHEMA);
    const defaultSchema = new SchemaRef({name: 'default'});
    this._lookup.add(XS_TYPE_SCHEMA, defaultSchema);
  }

  static NAME = 'EntityRegistry';

  private static _self: EntityRegistry; // = new Registry();

  private _lookup: LookupRegistry;


  static $() {
    if (!this._self) {
      this._self = new EntityRegistry();
    }
    return this._self;
  }


  static getLookupRegistry() {
    return LookupRegistry.$(REGISTRY_TXS_SCHEMA);
  }


  static getSchema(name: string): SchemaRef {
    return this.getLookupRegistry().find(XS_TYPE_SCHEMA, {name: name});
  }


  static register(xsdef: AbstractRef | Binding): AbstractRef | Binding {
    if (xsdef instanceof EntityRef) {
      return this.$()._lookup.add(XS_TYPE_ENTITY, xsdef);
    } else if (xsdef instanceof PropertyRef) {
      return this.$()._lookup.add(XS_TYPE_PROPERTY, xsdef);
    } else if (xsdef instanceof SchemaRef) {
      return this.$()._lookup.add(XS_TYPE_SCHEMA, xsdef);
    } else if (xsdef instanceof Binding) {
      return this.$()._lookup.add(xsdef.bindingType, xsdef);
    } else {
      throw new NotYetImplementedError();
    }
  }


  static createSchema(fn: Function, options: ISchema): SchemaRef {
    let schema = <SchemaRef>this.$()._lookup.find(XS_TYPE_SCHEMA, {name: options.name});
    if (!schema) {
      schema = new SchemaRef(options);
      schema = this.$()._lookup.add(XS_TYPE_SCHEMA, schema);
    }
    const cRef = classRefGet(fn);
    const binding = Binding.create(XS_TYPE_SCHEMA, schema.name, XS_TYPE_CLASS_REF, cRef);
    this.$()._lookup.remove(binding.bindingType,
      (b: Binding) => b.source === XS_DEFAULT_SCHEMA && b.target.id() === cRef.id());
    this.register(binding);
    cRef.setSchema(schema.name);
    return schema;
  }


  static fromJson(json: IEntityRefMetadata): EntityRef {
    return this.$().fromJson(json);
  }


  private static _fromJsonProperty(property: IPropertyRefMetadata, clsRef: ClassRef) {
    const options = _.clone(property.options);
    options.sourceClass = clsRef;

    if (property.targetRef) {
      const _classRef = this._fromJsonClassRef(property.targetRef);
      options.type = _classRef.getClass(true);
    }

    if (property.propertyRef) {
      const _classRef = this._fromJsonClassRef(property.propertyRef);
      options.propertyClass = _classRef.getClass(true);
    }

    if (property.validator) {
      property.validator.forEach(m => {
        const _m = _.clone(m);
        _m.target = clsRef.getClass(true);
        const vma = new ValidationMetadata(_m);
        getFromContainer(MetadataStorage).addValidationMetadata(vma);
      });
    }

    const prop = this.createProperty(options);
    this.register(prop);
  }


  private static _fromJsonClassRef(classRefMetadata: IClassRefMetadata) {
    const clsRef = classRefGet(classRefMetadata.className);
    clsRef.setSchemas(_.isArray(classRefMetadata.schema) ?
      classRefMetadata.schema : [classRefMetadata.schema]);

    if (classRefMetadata.properties) {
      classRefMetadata.properties.forEach(property => {
        this._fromJsonProperty(property, clsRef);
      });
    }

    return clsRef;
  }


  static createEntity(fn: Function | ClassRef, options: IEntity = {}): EntityRef {
    return new EntityRef(fn, options);
  }


  static createProperty(options: IProperty): PropertyRef {
    return new PropertyRef(options);
  }

  static getEntityRefFor(instance: Object | string): EntityRef {
    let cName = null;
    if (_.isString(instance)) {
      cName = instance;
    } else {
      cName = instance.constructor.name;
    }
    return this.$()._lookup.find(XS_TYPE_ENTITY, {name: cName});
  }


  static getPropertyRefsFor(entity: EntityRef | ClassRef) {
    return this.$().getPropertyRefsFor(entity);
  }

  static reset() {
    LookupRegistry.reset();
    this._self = null;

  }


  listProperties() {
    return this._lookup.list(XS_TYPE_PROPERTY);
  }


  listEntities() {
    return this._lookup.list(XS_TYPE_ENTITY);
  }


  listClassRefs() {
    return this._lookup.list(XS_TYPE_CLASS_REF);
  }


  listSchemas() {
    return this._lookup.list(XS_TYPE_SCHEMA);
  }


  fromJson(json: IEntityRefMetadata): EntityRef {
    let clsRef = ClassRef.find(json.name, REGISTRY_TXS_SCHEMA);
    if (!clsRef) {
      clsRef = classRefGet(SchemaUtils.clazz(json.name));
    }
    clsRef.setSchema(json.schema);

    let entity = EntityRegistry.$().getEntityRefByName(json.name);
    if (!entity) {
      entity = EntityRegistry.createEntity(clsRef, json.options);
      EntityRegistry.register(entity);

      json.properties.forEach(property => {
        EntityRegistry._fromJsonProperty(property, clsRef);
      });
    }
    return entity;
  }


  getSchemaRefByName(name: string): SchemaRef {
    return this._lookup.find(XS_TYPE_SCHEMA, (e: EntityRef) => {
      return e.machineName === _.snakeCase(name);
    });
  }


  getEntityRefByName(name: string): EntityRef {
    return this._lookup.find(XS_TYPE_ENTITY, (e: EntityRef) => {
      return e.machineName === _.snakeCase(name);
    });
  }

  /*

    getPropertyDefsFor(entity: EntityRef | ClassRef): PropertyRef[] {
      if (entity instanceof EntityRef) {
        return this._lookup.filter(XS_TYPE_PROPERTY, (x: PropertyRef) => x.object.id() === entity.getClassRef().id());
      } else {
        return this._lookup.filter(XS_TYPE_PROPERTY, (x: PropertyRef) => {
          return x.object.id() === entity.id()
        });
      }
    }
  */
  private find(instance: any): EntityRef {
    const cName = ClassUtils.getClassName(instance);
    return this._lookup.find(XS_TYPE_ENTITY, {name: cName});
  }

  getEntityRefFor(instance: Object | string): EntityRef {
    return this.find(instance);
  }

  getPropertyRefsFor(entity: EntityRef | ClassRef): PropertyRef[] {
    if (entity instanceof EntityRef) {
      return this._lookup.filter(XS_TYPE_PROPERTY, (x: PropertyRef) => x.object.id() === entity.getClassRef().id());
    } else {
      return this._lookup.filter(XS_TYPE_PROPERTY, (x: PropertyRef) => {
        return x.object.id() === entity.id();
      });
    }
  }


}

