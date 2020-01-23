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


export class EntityRegistry implements ILookupRegistry {


  private constructor() {
    this._lookup = LookupRegistry.$();
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


  static getSchema(name: string): SchemaRef {
    return LookupRegistry.$().find(XS_TYPE_SCHEMA, {name: name});
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
    const classRef = ClassRef.get(fn);
    const binding = Binding.create(XS_TYPE_SCHEMA, schema.name, XS_TYPE_CLASS_REF, classRef);
    this.$()._lookup.remove(binding.bindingType, (b: Binding) => b.source === XS_DEFAULT_SCHEMA && b.target.id() === classRef.id());
    this.register(binding);
    classRef.setSchema(schema.name);
    return schema;
  }


  static fromJson(json: IEntityRefMetadata): EntityRef {
    return this.$().fromJson(json);
  }


  private static _fromJsonProperty(property: IPropertyRefMetadata, classRef: ClassRef) {
    const options = _.clone(property.options);
    options.sourceClass = classRef;

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
        _m.target = classRef.getClass(true);
        const vma = new ValidationMetadata(_m);
        getFromContainer(MetadataStorage).addValidationMetadata(vma);
      });
    }

    const prop = this.createProperty(options);
    this.register(prop);
  }


  private static _fromJsonClassRef(classRefMetadata: IClassRefMetadata) {
    const classRef = ClassRef.get(classRefMetadata.className);
    classRef.setSchemas(_.isArray(classRefMetadata.schema) ? classRefMetadata.schema : [classRefMetadata.schema]);

    if (classRefMetadata.properties) {
      classRefMetadata.properties.forEach(property => {
        this._fromJsonProperty(property, classRef);
      });
    }

    return classRef;
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


  fromJson(json: IEntityRefMetadata): EntityRef {
    let classRef = ClassRef.find(json.name);
    if (!classRef) {
      classRef = ClassRef.get(SchemaUtils.clazz(json.name));
    }
    classRef.setSchema(json.schema);

    let entity = EntityRegistry.$().getEntityRefByName(json.name);
    if (!entity) {
      entity = EntityRegistry.createEntity(classRef, json.options);
      EntityRegistry.register(entity);

      json.properties.forEach(property => {
        EntityRegistry._fromJsonProperty(property, classRef);
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

