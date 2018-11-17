import {IStorageOptions, NotYetImplementedError, StorageRef} from '@typexs/base';
import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  getMetadataArgsStorage,
  UpdateDateColumn,
  CreateDateColumn

} from 'typeorm';
import {SchemaDef} from '../../registry/SchemaDef';
import {EntityDef} from '../../registry/EntityDef';
import * as _ from "../../LoDash";
import {PropertyDef} from '../../registry/PropertyDef';
import {XS_P_PROPERTY, XS_P_PROPERTY_ID, XS_P_SEQ_NR, XS_P_TYPE} from '../../Constants';
import {ClassRef} from '../../registry/ClassRef';
import {SchemaUtils} from "../../SchemaUtils";
import {ISchemaMapper} from "./../ISchemaMapper";
import {IDataExchange} from "../IDataExchange";
import {EntityDefTreeWorker} from "../EntityDefTreeWorker";
import {NameResolver} from "./NameResolver";
import {JoinDesc} from "../../descriptors/Join";
import {IDBType} from "./IDBType";


export interface XContext extends IDataExchange<Function> {
  prefix?: string;
}


export class SqlSchemaMapper extends EntityDefTreeWorker implements ISchemaMapper {

  private storageRef: StorageRef;

  private schemaDef: SchemaDef;

  nameResolver: NameResolver = new NameResolver();


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
    return {next: entityClass}
  }


  async leaveEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: XContext): Promise<XContext> {
    return sources;
  }


  visitDataProperty(propertyDef: PropertyDef, sourceDef: EntityDef | ClassRef, sources?: XContext, results?: XContext): void {
    if (propertyDef.isStoreable()) {
      let entityClass = results.next;
      let propClass = {constructor: entityClass};

      // TODO prefix support?
      const hasPrefix = _.has(results, 'prefix');
      let propName = propertyDef.name;
      let propStoreName = propertyDef.storingName;
      if (hasPrefix) {
        [propName, propStoreName] = this.nameResolver.for(results.prefix, propertyDef);
      }
      let colDef = this.ColumnDef(propertyDef, propStoreName);
      if (colDef) {
        colDef(propClass, propName);
      }
    }
  }


  private handleCheckConditionsIfGiven(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef | ClassRef) {
    let condition = propertyDef.getOptions('cond', false);
    if (condition !== false) {
      let referred = entityDef instanceof EntityDef ? entityDef.getClassRef() : entityDef;
      let referrer = sourceDef instanceof EntityDef ? sourceDef.getClassRef() : sourceDef;
      return condition.validate(referred, referrer);
    } else {
      return false;
    }
  }


  private handleJoinDefinitionIfGiven(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, targetRef: EntityDef | ClassRef, sources: XContext) {
    let join: JoinDesc = propertyDef.getJoin();

    // create join entity class
    let joinProps = this.schemaDef.getPropertiesFor(join.joinRef.getClass());
    let joinClass = this.handleCreateObjectClass(join.joinRef, 'p', targetRef);
    let joinPropClass = {constructor: joinClass};
    let hasId = joinProps.filter(j => j.identifier).length > 0;
    if (!hasId) {
      PrimaryGeneratedColumn({name: 'id', type: 'int'})(joinPropClass, 'id');
    }

    joinProps.forEach(prop => {
      let propName = prop.name;
      let propStoreName = prop.storingName;
      this.ColumnDef(prop, propStoreName)(joinPropClass, propName);
    });

    join.validate(
      sourceDef instanceof EntityDef ? sourceDef.getClassRef() : sourceDef,
      propertyDef,
      targetRef instanceof EntityDef ? targetRef.getClassRef() : targetRef);

    if (targetRef instanceof EntityDef) {
      return {next: joinClass};
    }
    return {next: this.handleCreateObjectClass(targetRef)};
  }


  async visitEntityReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources: XContext): Promise<XContext> {
    if (this.handleCheckConditionsIfGiven(sourceDef, propertyDef, entityDef)) {
      // if condition is given then no new join table is needed
      return sources;
    } else if (propertyDef.hasJoin()) {
      return this.handleJoinDefinitionIfGiven(sourceDef, propertyDef, entityDef, sources)
    } else if (sourceDef instanceof EntityDef) {

      if (propertyDef.isEmbedded()) {
        return this.handleEmbeddedPropertyReference(sourceDef, propertyDef, entityDef, sources);
      } else {
        /**
         * Default variant if nothing else given generate or use p_{propertyName}_{entityName}
         */
        let pName = propertyDef.storingName;
        const clazz = this.handleCreatePropertyClass(propertyDef, pName);
        this.attachPrimaryKeys(sourceDef, propertyDef, clazz);
        this.attachTargetKeys(propertyDef, entityDef, clazz);
        return {next: clazz}
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


  async leaveEntityReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources: XContext, visitResult: XContext): Promise<XContext> {
    return sources;
  }


  async visitObjectReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources?: XContext): Promise<XContext> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveObjectReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }


  async visitExternalReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveExternalReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }


  async _visitReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    if (this.handleCheckConditionsIfGiven(sourceDef, propertyDef, classRef)) {
      // if condition is given then no new join table is needed
      return {next: this.handleCreateObjectClass(classRef)};
    } else if (propertyDef.hasJoin()) {
      return this.handleJoinDefinitionIfGiven(sourceDef, propertyDef, classRef, sources)
    } else if (propertyDef.isEmbedded()) {
      if (!propertyDef.isCollection()) {
        if (sourceDef instanceof EntityDef) {
          await this.handleEmbeddedPropertyReference(sourceDef, propertyDef, classRef, sources);
          return {next: this.handleCreateObjectClass(classRef)};
        } else if (sourceDef instanceof ClassRef) {
          await this.handleEmbeddedPropertyReference(sourceDef, propertyDef, classRef, sources);
          return {next: this.handleCreateObjectClass(classRef)};
        }
      }
    } else if (sourceDef instanceof EntityDef) {
      const storeClass = this.handleCreatePropertyClass(propertyDef, [sourceDef.name, _.capitalize(propertyDef.name)].filter(x => !_.isEmpty(x)).join(''));
      this.attachPrimaryKeys(sourceDef, propertyDef, storeClass);

      /*
      a classref can be generated if no name or id property is given
       */
      let targetIdProps = this.schemaDef.getPropertiesFor(classRef.getClass()).filter(p => p.identifier);
      if (targetIdProps.length > 0) {
        this.attachTargetKeys(propertyDef, classRef, storeClass);
        return {next: this.handleCreateObjectClass(classRef)};
      } else {
        return {next: storeClass};
      }
    } else if (sourceDef instanceof ClassRef) {
      if (!propertyDef.isCollection()) {
        return {next: sources.next, prefix: propertyDef.name};
      } else {
        const storeClass = this.handleCreatePropertyClass(propertyDef, _.capitalize(propertyDef.name) + classRef.className);
        this.attachPropertyPrimaryKeys(storeClass);
        return {next: storeClass};
      }
    }
    throw new NotYetImplementedError('object reference for ' + sourceDef)
  }


  async _leaveReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    return sources;
  }


  private handleCreateObjectClass(classRef: ClassRef, prefix: string = 'o', targetRef?: EntityDef | ClassRef) {
    let tName = classRef.storingName;
    if (!classRef.hasName()) {
      tName = [prefix, tName].join('_');
    }
    let entityClass = classRef.getClass();
    Entity(tName)(entityClass);
    // check if an ID exists in class else add one
    this.addType(entityClass);
    if (targetRef) {
      const sourceClass = targetRef.getClass();
      getMetadataArgsStorage().entitySubscribers.filter(s => s.target == sourceClass).map(s => { (<any>s['target']) = entityClass;});
      getMetadataArgsStorage().entityListeners.filter(s => s.target == sourceClass).map(s => { (<any>s['target']) = entityClass;});
    }
    return entityClass;
  }

  private handleCreatePropertyClass(propertyDef: PropertyDef, className: string) {
    propertyDef.joinRef = ClassRef.get(SchemaUtils.clazz(className));
    let storeClass = propertyDef.joinRef.getClass();
    let storingName = propertyDef.storingName;
    Entity(storingName)(storeClass);
    this.addType(storeClass);
    return storeClass;
  }


  private async handleEmbeddedPropertyReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, targetDef: EntityDef | ClassRef, sources: XContext): Promise<XContext> {
    const refTargetClass = {constructor: sources.next};
    let propertyNames: string[] = [];
    if (propertyDef.hasIdKeys()) {
      propertyNames = propertyDef.getIdKeys();
    } else {
      propertyNames = [propertyDef.storingName];
    }
    let indexNames: string[] = [];
    let idProps: PropertyDef[] = [];
    if (targetDef instanceof EntityDef) {
      idProps = targetDef.getPropertyDefIdentifier();
    } else {
      idProps = this.schemaDef.getPropertiesFor(targetDef.getClass()).filter(p => p.identifier);
    }
    if (_.isEmpty(idProps)) throw new NotYetImplementedError('no primary key is defined on ' + targetDef.machineName);
    idProps.forEach(p => {
      let name = propertyNames.shift();
      indexNames.push(name);
      let targetId, targetName;
      if (propertyDef.hasIdKeys()) {
        [targetId, targetName] = this.nameResolver.for(name);
      } else {
        [targetId, targetName] = this.nameResolver.for(name, p);
      }

      let dataType = this.detectDataTypeFromProperty(p);
      const propDef = _.merge({name: targetName}, dataType);
      Column(propDef)(refTargetClass, targetId);
    });

    if (!_.isEmpty(propertyNames)) {
      throw new Error('amount of given reference keys is not equal with primary keys of referred entity')
    }

    if (!_.isEmpty(indexNames)) {
      Index(indexNames)(refTargetClass)
    }
    return sources;
  }


  private ColumnDef(property: PropertyDef, name: string, skipIdentifier: boolean = false) {
    if (property.isStoreable()) {
      let def = _.clone(property.getOptions('typeorm', {}));
      let dbType = this.detectDataTypeFromProperty(property);
      def = _.merge(def, {name: name}, dbType);
      if (property.isNullable()) {
        def.nullable = true;
      }

      if (property.identifier && !skipIdentifier) {
        if (property.generated) {
          // TODO resolve strategy for generation
          return PrimaryGeneratedColumn(def);
        } else {
          return PrimaryColumn(def);
        }
      } else if (dbType.type === 'date' && dbType.variant == 'updated') {
        return UpdateDateColumn(def)
      } else if (dbType.type === 'date' && dbType.variant == 'created') {
        return CreateDateColumn(def)
      }
      return Column(def);
    }
    return null;
  }


  private attachTargetPrefixedKeys(prefix: string, entityDef: EntityDef, refTargetClass: Function) {
    let refTargetClassDescr = {constructor: refTargetClass};

    entityDef.getPropertyDefIdentifier().forEach(property => {
      let [targetId, targetName] = this.nameResolver.for(prefix, property);
      this.ColumnDef(property, targetName, true)(refTargetClassDescr, targetId);
    });

    if (entityDef.areRevisionsEnabled()) {
      let [targetId, targetName] = this.nameResolver.for(prefix, 'revId');
      Column({name: targetName, type: 'int'})(refTargetClassDescr, targetId);
    }

    // TODO if revision support is enabled for entity then it must be handled also be the property
  }


  private attachTargetKeys(propDef: PropertyDef, entityDef: EntityDef | ClassRef, refTargetClass: Function) {
    let uniqueIndex: string[] = [];
    let refTargetClassDescr = {constructor: refTargetClass};
    // let propPrefix = propDef.machineName();

    let idProps = []
    if (entityDef instanceof EntityDef) {
      idProps = entityDef.getPropertyDefIdentifier();
    } else {
      idProps = this.schemaDef.getPropertiesFor(entityDef.getClass()).filter(p => p.identifier)
    }

    idProps.forEach(property => {
      let [targetId, targetName] = this.nameResolver.forTarget(property);
      this.ColumnDef(property, targetName, true)(refTargetClassDescr, targetId);
      uniqueIndex.push(targetId);
    });


    if (entityDef instanceof EntityDef) {

      // TODO if revision support is enabled for entity then it must be handled also be the property
      if (entityDef.areRevisionsEnabled()) {
        let [targetId, targetName] = this.nameResolver.forTarget('revId');
        Column({name: targetName, type: 'int'})(refTargetClassDescr, targetId);
        uniqueIndex.push(targetId);
      }
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

  private detectDataTypeFromProperty(prop: PropertyDef): IDBType {
    let type: IDBType = {type: 'text'};
    if (prop.getOptions('typeorm')) {
      let typeorm = prop.getOptions('typeorm');
      if (_.has(typeorm, 'type')) {
        type.type = typeorm.type;
      }
      if (_.has(typeorm, 'length')) {
        type.length = typeorm.length;
      }
    } else {
      // TODO !this.storageRef.getSchemaHandler().translateToStoreType(prop.dataType);
      let split = prop.dataType.split(':');
      const _type = split.shift();
      if (split.length > 0) {
        type.variant = split.shift();
      }

      switch (_type) {
        case 'string':
          type.type = 'text';
          break;
        case 'number':
          type.type = 'int';
          break;
        case 'date':
          type.type = 'datetime';
          break;
        case 'json':
          type.type = 'text';
          break;
      }
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
}
