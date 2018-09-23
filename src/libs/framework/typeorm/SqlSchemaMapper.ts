import {IStorageOptions, NotYetImplementedError, StorageRef} from 'typexs-base';
import {Column, Entity, Index, PrimaryColumn, PrimaryGeneratedColumn} from 'typeorm';
import {SchemaDef} from '../../SchemaDef';
import {EntityDef} from '../../EntityDef';
import * as _ from "lodash";
import {PropertyDef} from '../../PropertyDef';
import {XS_P_PROPERTY, XS_P_PROPERTY_ID, XS_P_REV_ID, XS_P_SEQ_NR, XS_P_TYPE} from '../../Constants';
import {ClassRef} from '../../ClassRef';
import {SchemaUtils} from "../../SchemaUtils";
import {ISchemaMapper} from "./../ISchemaMapper";
import {IDataExchange} from "../IDataExchange";
import {EntityDefTreeWorker} from "../EntityDefTreeWorker";
import {NameResolver} from "./NameResolver";


interface DBType {
  type: string;
  length?: number;
}

export interface XContext extends IDataExchange<Function> {
  prefix?: string;
}


export class SqlSchemaMapper extends EntityDefTreeWorker implements ISchemaMapper {

  private storageRef: StorageRef;

  private schemaDef: SchemaDef;

  nameResolver: NameResolver = new NameResolver();

  private globalRelationsEnabled: boolean = false;

  constructor(storageRef: StorageRef, schemaDef: SchemaDef) {
    super();
    this.storageRef = storageRef;
    this.schemaDef = schemaDef;
  }


  async initialize() {
    let entities = this.schemaDef.getStoreableEntities();
    for (let entity of entities) {
      let entityClass = await this.walk(entity, null);
      this.addType(entityClass);
    }
    this.clear();
    return this.storageRef.reload();
  }

  addType(fn: Function) {
    console.log(fn);
    if (!this.isDone(fn)) {
      this.storageRef.addEntityType(fn);
      this.done(fn);
    }
  }

  async visitEntity(entityDef: EntityDef): Promise<XContext> {
    // TODO check if entities are registered or not
    // register as entity
    // TODO can use other table name! Define an override attribute
    let tName = entityDef.storingName;
    let entityClass = entityDef.object.getClass();
    Entity(tName)(entityClass);

    // TODO add p_relations

    return {next: entityClass}

  }

  async leaveEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: XContext): Promise<XContext> {
    return sources;
  }


  visitDataProperty(propertyDef: PropertyDef, sourceDef: PropertyDef | EntityDef | ClassRef, sources?: XContext, results?: XContext): void {
    let entityClass = results.next;
    let propClass = {constructor: entityClass};

    // TODO prefix support?
    const hasPrefix = _.has(results, 'prefix');
    let propName = propertyDef.name;
    let propStoreName = propertyDef.storingName;
    if (hasPrefix) {
      [propName, propStoreName] = this.nameResolver.for(results.prefix, propertyDef);

      //propName = [prefixClass.machineName(), propertyDef.name].join('__');
      //propStoreName = [prefixClass.machineName(), propertyDef.storingName].join('__');
    }

    if (propertyDef.identifier) {
      let orm = propertyDef.getOptions('typeorm', {});
      orm = _.merge(orm, this.detectDataTypeFromProperty(propertyDef));
      orm.name = propStoreName;

      if (propertyDef.generated) {
        // TODO resolve strategy for generation
        PrimaryGeneratedColumn(orm)(propClass, propName);
      } else {
        PrimaryColumn(orm)(propClass, propName);
      }
    } else {
      this.ColumnDef(propertyDef, propStoreName)(propClass, propName);
    }

  }


  async visitEntityReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources: XContext): Promise<XContext> {
    /**
     * different variants to use the relation between 2 entities
     * - use a global p_relations table which can connect multiple elements with each other
     * - use a entity related relations p_{entity_from}_{entity_to}
     * - use a property related relations p_{property_name}_{entity_to}
     * - use a custom configuation with name of join table and mapping keys
     * - if notthing is defined the global variant is prefered
     */

      // TODO e->p => e.p_id => p.id
    const allowDirectReference = propertyDef.getOptions('direct', false);

    /**
     * Default variant if nothing else given generate or use p_{propertyName}_{entityName}
     */
    if (sourceDef instanceof EntityDef) {
      // TODO check property configuration, if exists!
      let pName = propertyDef.storingName;

      propertyDef.joinRef = ClassRef.get(SchemaUtils.clazz(pName));
      let clazz = propertyDef.joinRef.getClass();

      Entity(pName)(clazz);
      this.attachPrimaryKeys(sourceDef, propertyDef, clazz);
      this.attachTargetKeys(propertyDef, entityDef, clazz);

      this.addType(clazz);
      return {next: clazz}
    } else if (sourceDef instanceof PropertyDef) {
      if (!propertyDef.isCollection()) {
        this.attachTargetPrefixedKeys(propertyDef.machineName, entityDef, sources.next);
        return sources;
      } else {
        throw new NotYetImplementedError('not supported; entity reference collection ');
      }

    } else if (sourceDef instanceof ClassRef) {

      if (!propertyDef.isCollection()) {
        this.attachTargetPrefixedKeys(propertyDef.machineName, entityDef, sources.next);
        return sources;
      } else {
        throw new NotYetImplementedError('not supported; entity reference collection in object');
      }

    }

    throw new NotYetImplementedError('entity reference for ' + sourceDef)

  }

  async leaveEntityReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources: XContext, visitResult: XContext): Promise<XContext> {
    return sources;
  }

  async visitObjectReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources?: XContext): Promise<XContext> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }

  async leaveObjectReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }

  async visitExternalReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }

  async leaveExternalReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }

  async _visitReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: XContext): Promise<XContext> {

    if (sourceDef instanceof EntityDef) {
      const className = sourceDef.name + _.capitalize(propertyDef.name);
      propertyDef.joinRef = ClassRef.get(SchemaUtils.clazz(className));
      let storeClass = propertyDef.joinRef.getClass();

      let storingName = propertyDef.storingName;
      Entity(storingName)(storeClass);
      this.attachPrimaryKeys(sourceDef, propertyDef, storeClass);
      this.addType(storeClass);
      return {next: storeClass};
    } else if (sourceDef instanceof ClassRef) {
      if (!propertyDef.isCollection()) {
        // TODO if marked as 'indirect' then change to collection mode
        // first variant deep embedded class
        return {next: sources.next, prefix: propertyDef.name};
      } else {
        const className = _.capitalize(propertyDef.name) + classRef.className;
        propertyDef.joinRef = ClassRef.get(SchemaUtils.clazz(className));
        let storeClass = propertyDef.joinRef.getClass();

        let storingName = propertyDef.storingName;
        Entity(storingName)(storeClass);
        this.attachPropertyPrimaryKeys(storeClass);
        this.addType(storeClass);
        return {next: storeClass};
      }

    }
    throw new NotYetImplementedError('object reference for ' + sourceDef)
  }

  async _leaveReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    return sources;
  }


  /**
   * PropertyOf integration
   *
   * @param {PropertyDef} propertyDef
   * /
   private ___onExternalProperty(propertyDef: PropertyDef, entityDef: EntityDef) {
    // TODO generated id field
    // TODO resolve names and resolve types
    // TODO  it is an extending Property, adding new fields to entity class; or a property which holding data in a seperate table/collection
    let propClass = propertyDef.propertyRef.getClass();


    this._attachSubProperty(entityDef, propertyDef, propClass);

  }*/


  private ColumnDef(property: PropertyDef, name: string) {
    let def = _.clone(property.getOptions('typeorm', {}));
    let dbType = this.detectDataTypeFromProperty(property);

    def = _.merge(def, {name: name}, dbType);
    if (property.isNullable()) {
      def.nullable = true;
    }
    return Column(def);
  }


  private attachTargetPrefixedKeys(prefix: string, entityDef: EntityDef, refTargetClass: Function) {
    let refTargetClassDescr = {constructor: refTargetClass};

    entityDef.getPropertyDefIdentifier().forEach(property => {
      let [targetId, targetName] = this.nameResolver.for(prefix, property);
      this.ColumnDef(property, targetName)(refTargetClassDescr, targetId);
    });

    if (entityDef.areRevisionsEnabled()) {
      let [targetId, targetName] = this.nameResolver.for(prefix, 'revId');
      Column({name: targetName, type: 'int'})(refTargetClassDescr, targetId);
    }

    // TODO if revision support is enabled for entity then it must be handled also be the property
  }


  private attachTargetKeys(propDef: PropertyDef, entityDef: EntityDef, refTargetClass: Function) {
    let uniqueIndex: string[] = [];
    let refTargetClassDescr = {constructor: refTargetClass};
    // let propPrefix = propDef.machineName();

    entityDef.getPropertyDefIdentifier().forEach(property => {
      let [targetId, targetName] = this.nameResolver.forTarget(property);
      this.ColumnDef(property, targetName)(refTargetClassDescr, targetId);
      uniqueIndex.push(targetId);
    });


    // TODO if revision support is enabled for entity then it must be handled also be the property
    if (entityDef.areRevisionsEnabled()) {
      let [targetId, targetName] = this.nameResolver.forTarget('revId');
      Column({name: targetName, type: 'int'})(refTargetClassDescr, targetId);
      uniqueIndex.push(targetId);
    }
    Index(uniqueIndex)(refTargetClass)

  }


  private attachPrimaryKeys(entityDef: EntityDef, propDef: PropertyDef, refTargetClass: Function) {
    let refTargetClassDescr = {constructor: refTargetClass};

    // this is the default variant!
    // create an generic id
    PrimaryGeneratedColumn({name: 'id', type: 'int'})(refTargetClassDescr, 'id');


    let [sourceId, sourceName] = this.nameResolver.forSource(XS_P_TYPE);
    Column({name: sourceName, type: 'varchar', length: 64})(refTargetClassDescr, sourceId);
    let uniqueIndex = [sourceId];

    if (propDef.propertyRef && propDef.propertyRef.getClass() == refTargetClass) {
      [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY);
      Column({name: sourceName, type: 'varchar', length: 64})(refTargetClassDescr, sourceId);
      uniqueIndex.push(sourceId);
    }

    // TODO if revision support is enabled for entity then it must be handled also be the property
    entityDef.getPropertyDefIdentifier().forEach(property => {
      let [sourceId, sourceName] = this.nameResolver.forSource(property);
      let dbType = this.detectDataTypeFromProperty(property);
      let def = _.merge({name: sourceName}, dbType);
      Column(def)(refTargetClassDescr, sourceId);
      uniqueIndex.push(sourceId);
    });

    if (entityDef.areRevisionsEnabled()) {
      [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY);
      Column({name: sourceName, type: 'int'})(refTargetClassDescr, sourceId);
      uniqueIndex.push(sourceId);
    }
    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_SEQ_NR);
    Column({name: sourceName, type: 'int'})(refTargetClassDescr, sourceId);
    uniqueIndex.push(sourceId);
    Index(uniqueIndex, {unique: true})(refTargetClass)
  }

  private attachPropertyPrimaryKeys(refTargetClass: Function) {
    let refTargetClassDescr = {constructor: refTargetClass};

    // this is the default variant!
    // create an generic id
    PrimaryGeneratedColumn({name: 'id', type: 'int'})(refTargetClassDescr, 'id');

    let [sourceId, sourceName] = this.nameResolver.forSource(XS_P_TYPE);
    Column({name: sourceName, type: 'varchar', length: 64})(refTargetClassDescr, sourceId);
    let uniqueIndex = [sourceId];

    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY);
    Column({name: sourceName, type: 'varchar', length: 64})(refTargetClassDescr, sourceId);
    uniqueIndex.push(sourceId);

    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY_ID);
    Column({name: sourceName, type: 'int'})(refTargetClassDescr, sourceId);
    uniqueIndex.push(sourceId);

    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_SEQ_NR);
    Column({name: sourceName, type: 'int'})(refTargetClassDescr, sourceId);
    uniqueIndex.push(sourceId);

    Index(uniqueIndex, {unique: true})(refTargetClass)
  }

  // fixme workaround
  private getStorageOptions(): IStorageOptions {
    return this.storageRef['options'];
  }

  private detectDataTypeFromProperty(prop: PropertyDef): DBType {
    // TODO type map for default table types
    let type = {type: 'text'};
    switch (prop.dataType) {
      case 'string':
        type.type = 'text';
        break;
      case 'number':
        type.type = 'int';
        break;
    }
    return type;
  }


  isClassDefinedInStorage(fn: Function) {
    for (let definedEntity of this.getStorageOptions().entities) {
      if (_.isString(definedEntity) && fn.name == definedEntity) return true;
      if (_.isFunction(definedEntity) && fn == definedEntity) return true;

    }
    return false;
  }


  /*
    private onProperty(propertyDef: PropertyDef, entityClass: Function, entityDef: EntityDef) {
      if (propertyDef.isInternal()) {
        // todo set multiple primary keys
        if (propertyDef.isReference()) {
          let typeorm = propertyDef.getOptions('typeorm');
          if (propertyDef.isEntityReference()) {
            this.onPropertyReferencingEntity(entityDef, propertyDef);
          } else {
            this.onPropertyReferencingProperty(entityDef, propertyDef);
          }
        } else {
          this.onLocalProperty(propertyDef, entityClass);
        }
      } else {
        this.onExternalProperty(propertyDef, entityDef);
      }
    }
  */
}
