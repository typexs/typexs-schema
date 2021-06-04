import {defaults, isArray, isEmpty, keys, snakeCase} from 'lodash';
import {SchemaRef} from './registry/SchemaRef';
import {PropertyRef} from './registry/PropertyRef';
import {EntityRef} from './registry/EntityRef';
import {IProperty} from './registry/IProperty';
import {IEntity} from './registry/IEntity';
import {ISchema} from './registry/ISchema';
import {
  ClassRef,
  DefaultNamespacedRegistry,
  IClassRef,
  IEntityRef,
  IJsonSchema,
  IJsonSchemaSerializeOptions,
  IJsonSchemaUnserializeOptions,
  IParseOptions,
  ISchemaRef,
  JsonSchema,
  METADATA_TYPE,
  MetadataRegistry,
  METATYPE_CLASS_REF,
  METATYPE_EMBEDDABLE,
  METATYPE_ENTITY,
  METATYPE_PROPERTY,
  METATYPE_SCHEMA,
  RegistryFactory,
  XS_DEFAULT_SCHEMA
} from '@allgemein/schema-api';
import {NAMESPACE_BUILT_ENTITY} from './Constants';
import {IObject} from './registry/IObject';
import {getJsObjectType} from './Helper';


export class EntityRegistry extends DefaultNamespacedRegistry /*AbstractRegistry*/ implements IJsonSchema {


  constructor(namespace: string) {
    super(namespace);
    // this = LookupRegistry.$(NAMESPACE_BUILT_ENTITY);
    // const defaultSchema = new SchemaRef({name: 'default'});
    // this.add(METATYPE_SCHEMA, defaultSchema);
  }

  static NAME = 'EntityRegistry';

  private static _self: EntityRegistry; // = new Registry();


  static $() {
    if (!this._self) {
      this._self = RegistryFactory.get(NAMESPACE_BUILT_ENTITY) as EntityRegistry;
    }
    return this._self;
  }


  prepare() {
    const schema = this.find(METATYPE_SCHEMA, (x: ISchemaRef) => x.name === XS_DEFAULT_SCHEMA);
    if (!schema) {
      const defaultSchema = this.create(METATYPE_SCHEMA, {name: XS_DEFAULT_SCHEMA});
      this.add(METATYPE_SCHEMA, defaultSchema);
    }
    super.prepare();
  }

  reload(entries?: Function[]) {
    this.clear();
    if (isEmpty(entries)) {
      MetadataRegistry.$().getMetadata().filter(x => x.namespace === this.namespace &&
        [METATYPE_ENTITY, METATYPE_EMBEDDABLE, METATYPE_CLASS_REF, METATYPE_SCHEMA].includes(x.metaType)).forEach(x => {
        this.onAdd(x.metaType as METADATA_TYPE, x);
      });
    } else {
      MetadataRegistry.$().getMetadata().filter(x => x.namespace === this.namespace &&
        [METATYPE_ENTITY, METATYPE_EMBEDDABLE, METATYPE_CLASS_REF, METATYPE_SCHEMA].includes(x.metaType) &&
        entries.includes(x.target as Function)).forEach(x => {
        this.onAdd(x.metaType as METADATA_TYPE, x);
      });
    }
  }

  /**
   * React when schema, entity, property or propertyof are annontated on classes.
   *
   * Act on following cases:
   * 1. An annotated entity loaded by import, only process when namespace is present.
   *    Properties should already be loaded in MetadataRegistry and are accessible.
   * 2. A property which is added after an entity is present.
   * 3. schema
   *
   * @param context
   * @param options
   */
  onAdd(context: METADATA_TYPE, options: IEntity | IProperty | ISchema | IObject) {
    if (options.namespace) {
      if (options.namespace !== this.namespace) {
        // skip not my namespace
        return;
      }
    } else {
      // if namespace not present skipping
      if (context !== METATYPE_PROPERTY) {
        // only properties should be pass and check if entity already exists
        return;
      }
    }

    const entityRef = options.target ? this.find(METATYPE_ENTITY, (x: EntityRef) => x.getClass() === options.target) as IEntityRef : null;
    if (context === METATYPE_ENTITY) {
      if (!entityRef) {
        this.create(METATYPE_ENTITY, options as IEntity);
        const properties = MetadataRegistry.$()
          .getByContextAndTarget(METATYPE_PROPERTY,
            options.target, 'merge') as IProperty[];
        for (const property of properties) {
          this.onAdd(METATYPE_PROPERTY, property);
        }
      }
    } else if (context === METATYPE_SCHEMA) {
      let find: ISchemaRef = this.find(context,
        (c: ISchemaRef) => c.name === (<ISchema>options).name
      );
      if (!find) {
        find = this.create(context, options);
      }
      if (entityRef && find) {
        this.addSchemaToEntityRef(find, entityRef, {override: true, onlyDefault: true});
      }
    } else if (context === METATYPE_PROPERTY) {
      // check if already processed and
      if (entityRef) {
        const propertyRef = this.find(context, (x: EntityRef) => x.getClass() === options.target && x.name === options.propertyName);
        if (!propertyRef) {
          const properties = MetadataRegistry.$()
            .getByContextAndTarget(METATYPE_PROPERTY,
              options.target, 'merge', options.propertyName) as IProperty[];
          for (const property of properties) {
            this.create(METATYPE_PROPERTY, property);

          }
        }
      }
    } else if (context === METATYPE_EMBEDDABLE) {
      const find = this.find(METATYPE_CLASS_REF, (c: IClassRef) =>
        c.getClass() === options.target
      ) as IClassRef;
      if (!find) {
        this.create(context, options);
      } else {
        const refOptions = find.getOptions();
        defaults(refOptions, options);
      }
    }
  }


  onUpdate() {
    super.onUpdate();
  }


  onRemove(context: METADATA_TYPE, entries: (IEntity | IProperty | ISchema | IObject)[]) {
    super.onRemove(context, entries);
  }


  /**
   * Create default property reference
   *
   * @param options
   */
  createPropertyForOptions(options: IProperty): PropertyRef {
    if (keys(options).length === 0) {
      throw new Error('can\'t create property for empty options');
    }
    options.namespace = this.namespace;
    const prop = new PropertyRef(options);
    return this.add(prop.metaType, prop);
  }


  /**
   * Create default entity reference
   *
   * @param options
   */
  createEntityForOptions(options: IEntity): EntityRef {
    options.namespace = this.namespace;
    if (!options.name) {
      options.name = ClassRef.getClassName(options.target);
    }
    const entityRef = new EntityRef(options);
    const retRef = this.add(entityRef.metaType, entityRef);
    const refs = entityRef.getOptions('schema', []);
    if ((isArray(refs) && refs.length === 0) || (!isArray(refs) && !refs)) {
      const metaSchemaOptionsForEntity = MetadataRegistry.$()
        .getByContextAndTarget(METATYPE_SCHEMA, entityRef.getClass()) as ISchema[];
      if (metaSchemaOptionsForEntity.length > 0) {
        for (const schemaOptions of metaSchemaOptionsForEntity) {
          this.addSchemaToEntityRef(schemaOptions.name, entityRef as IEntityRef, {override: true, onlyDefault: true});
        }
      } else {
        // no schema options add to 'default'
        this.addSchemaToEntityRef(XS_DEFAULT_SCHEMA, entityRef as IEntityRef);
      }
    }
    return retRef;
  }

  /**
   * Create default schema reference
   *
   * @param options
   */
  createSchemaForOptions(options: ISchema): SchemaRef {
    options.namespace = this.namespace;
    const schemaRef = new SchemaRef(options);
    return this.add(schemaRef.metaType, schemaRef);
  }

  listClassRefs() {
    return this.list(METATYPE_CLASS_REF);
  }


  listSchemas() {
    return this.list(METATYPE_SCHEMA);
  }

  getSchemaRefByName(name: string): SchemaRef {
    return this.find(METATYPE_SCHEMA, (e: SchemaRef) => {
      return e.machineName === snakeCase(name);
    });
  }

  getEntityRefFor(fn: string | object | Function, skipNsCheck?: boolean): EntityRef {
    return super.getEntityRefFor(fn, skipNsCheck) as EntityRef;
  }

  getEntityRefByName(name: string): EntityRef {
    return this.find(METATYPE_ENTITY, (e: EntityRef) => {
      return e.machineName === snakeCase(name);
    });
  }

  getPropertyRefsFor(entity: EntityRef | IClassRef): PropertyRef[] {
    if (entity instanceof EntityRef) {
      return this.filter(METATYPE_PROPERTY, (x: PropertyRef) => x.object.id() === entity.getClassRef().id());
    } else {
      return this.filter(METATYPE_PROPERTY, (x: PropertyRef) => {
        return x.object.id() === entity.id();
      });
    }
  }

  fromJsonSchema(json: any, options?: IJsonSchemaUnserializeOptions) {
    return JsonSchema.unserialize(json, defaults(options || {}, {
        namespace: this.namespace,
        collector: [
          {
            type: METATYPE_PROPERTY,
            key: 'type',
            fn: (key: string, data: any, options: IParseOptions) => {
              const type = ['string', 'number', 'boolean', 'date', 'float', 'array', 'object'];
              const value = data[key];
              if (value && type.includes(value)) {
                const cls = getJsObjectType(value);
                if (cls === String) {
                  if (data['format'] === 'date' || data['format'] === 'date-time') {
                    return Date;
                  }
                }
                return cls;
              } else if (data['$ref']) {
                const className = data['$ref'].split('/').pop();
                return ClassRef.get(className, this.namespace).getClass(true);
              }
              return ClassRef.get(data[key], this.namespace).getClass(true);
            }
          }
        ]
      })
    );
  }

  toJsonSchema(options?: IJsonSchemaSerializeOptions): any {
    const serializer = JsonSchema.getSerializer(options);
    for (const entityRef of this.getEntityRefs()) {
      serializer.serialize(entityRef);
    }
    return serializer.getJsonSchema();
  }
}

