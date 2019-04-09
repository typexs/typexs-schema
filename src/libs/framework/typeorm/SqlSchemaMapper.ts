import {IStorageOptions, NotYetImplementedError, StorageRef, NotSupportedError} from '@typexs/base';
import {
  Column,
  CreateDateColumn,
  Entity,
  getMetadataArgsStorage,
  Index,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';


import {SchemaRef} from '../../registry/SchemaRef';
import {EntityRef} from '../../registry/EntityRef';
import * as _ from "lodash";
import {PropertyRef} from '../../registry/PropertyRef';
import {XS_P_PROPERTY, XS_P_PROPERTY_ID, XS_P_SEQ_NR, XS_P_TYPE} from '../../Constants';

import {SchemaUtils} from "../../SchemaUtils";
import {ISchemaMapper} from "./../ISchemaMapper";
import {IDataExchange} from "../IDataExchange";
import {EntityDefTreeWorker} from "../EntityDefTreeWorker";
import {NameResolver} from "./NameResolver";
import {JoinDesc} from "../../descriptors/JoinDesc";
import {IDBType} from "@typexs/base/libs/storage/IDBType";
import {ClassRef} from "commons-schema-api";
import {ExprDesc} from "commons-expressions";
import {EntityRegistry} from "../../EntityRegistry";


export interface XContext extends IDataExchange<Function> {
  prefix?: string;
}


export class SqlSchemaMapper extends EntityDefTreeWorker implements ISchemaMapper {


  private storageRef: StorageRef;

  private schemaDef: SchemaRef;

  nameResolver: NameResolver = new NameResolver();

  private classCache: any = [];


  constructor(storageRef: StorageRef, schemaDef: SchemaRef) {
    super();
    this.storageRef = storageRef;
    this.schemaDef = schemaDef;
  }

  getMetadata() {
    return getMetadataArgsStorage();
  }

  hasColumn(fn: Function, propertyName: string) {
    return !!this.getMetadata().columns.find(c => c.target == fn && c.propertyName == propertyName)
  }

  hasEntity(fn: Function, name: string = null) {
    if (name) {
      return !!this.getMetadata().tables.find(c => c.target == fn && c.name == name)
    }
    return !!this.getMetadata().tables.find(c => c.target == fn);
  }

  async initialize() {
    let entities = this.schemaDef.getStoreableEntities();
    for (let entity of entities) {
      let entityClass = await this.walk(entity, null);
      this.addType(entityClass);
    }
    this.clear();
    //let data = getMetadataArgsStorage();
    if (this.storageRef.getOptions().connectOnStartup) {
      await this.storageRef.reload();
    }
  }


  inClassCache(cls: Function) {
    return this.classCache.indexOf(cls) > -1;
  }


  addType(fn: Function) {
    if (!this.isDone(fn)) {
      this.storageRef.addEntityType(fn);
      this.done(fn);
    }
  }


  protected async onEntity(entityDef: EntityRef, referPropertyDef?: PropertyRef, sources?: IDataExchange<any>): Promise<IDataExchange<any>> {
    const cls = entityDef.object.getClass();
    if (!this.isDone(cls) && !this.inClassCache(cls)) {
      this.classCache.push(cls);
      return super.onEntity(entityDef, referPropertyDef, sources);
    }
    return {next: cls, abort: true}
  }


  async visitEntity(entityDef: EntityRef): Promise<XContext> {
    // TODO check if entities are registered or not
    // register as entity
    // TODO can use other table name! Define an override attribute
    let tName = entityDef.storingName;
    let entityClass = entityDef.object.getClass();
    this.createEntityIfNotExists(entityClass, tName);
//Entity(tName)(entityClass);
    return {next: entityClass}
  }


  async leaveEntity(entityDef: EntityRef, propertyDef: PropertyRef, sources: XContext): Promise<XContext> {
    return sources;
  }


  visitDataProperty(propertyDef: PropertyRef, sourceDef: EntityRef | ClassRef, sources?: XContext, results?: XContext): void {
    if (propertyDef.isStoreable()) {
      let entityClass = results.next;
      //let propClass = {constructor: entityClass};

      // TODO prefix support?
      const hasPrefix = _.has(results, 'prefix');
      let propName = propertyDef.name;
      let propStoreName = propertyDef.storingName;
      if (hasPrefix) {
        [propName, propStoreName] = this.nameResolver.for(results.prefix, propertyDef);
      }

      this.createColumnIfNotExists('regular', entityClass, propName, propertyDef, propStoreName);
      //let colDef = this.ColumnDef(propertyDef, propStoreName);
      //if (colDef) {
      //colDef(propClass, propName);
      //}
    }
  }


  private handleCheckConditionsIfGiven(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, entityDef: EntityRef | ClassRef) {
    let condition: ExprDesc = propertyDef.getOptions('cond', null);
    if (condition) {
      let referred = entityDef instanceof EntityRef ? entityDef.getClassRef() : entityDef;
      let referrer = sourceDef instanceof EntityRef ? sourceDef.getClassRef() : sourceDef;
      return condition.validate(EntityRegistry.$(), referred, referrer);
    } else {
      return false;
    }
  }


  private handleJoinDefinitionIfGiven(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, targetRef: EntityRef | ClassRef, sources: XContext) {
    let join: JoinDesc = propertyDef.getJoin();

    // create join entity class
    let joinProps = this.schemaDef.getPropertiesFor(join.joinRef.getClass());
    let joinClass = this.handleCreateObjectClass(join.joinRef, 'p', targetRef);
    //let joinPropClass = {constructor: joinClass};
    let hasId = joinProps.filter(j => j.identifier).length > 0;
    if (!hasId) {
      this.createColumnIfNotExists('primary-generated', joinClass, 'id', {name: 'id', type: 'int'});
      //PrimaryGeneratedColumn({name: 'id', type: 'int'})(joinPropClass, 'id');
    }

    joinProps.forEach(prop => {
      let propName = prop.name;
      let propStoreName = prop.storingName;
      this.createColumnIfNotExists('regular', joinClass, propName, prop, propStoreName)
      //this.ColumnDef(prop, propStoreName)(joinPropClass, propName);
    });

    join.validate(
      sourceDef instanceof EntityRef ? sourceDef.getClassRef() : sourceDef,
      propertyDef,
      targetRef instanceof EntityRef ? targetRef.getClassRef() : targetRef);


    if (targetRef instanceof EntityRef) {
      return {next: joinClass};
    }
    //propertyDef.joinRef = join.joinRef;
    return {next: this.handleCreateObjectClass(targetRef)};
  }


  async visitEntityReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, entityDef: EntityRef, sources: XContext): Promise<XContext> {
    if (this.handleCheckConditionsIfGiven(sourceDef, propertyDef, entityDef)) {
      // if condition is given then no new join table is needed
      return sources;
    } else if (propertyDef.hasJoin()) {
      return this.handleJoinDefinitionIfGiven(sourceDef, propertyDef, entityDef, sources)
    } else if (sourceDef instanceof EntityRef) {

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


  async leaveEntityReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, entityDef: EntityRef, sources: XContext, visitResult: XContext): Promise<XContext> {
    return sources;
  }


  async visitObjectReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources?: XContext): Promise<XContext> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveObjectReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }


  async visitExternalReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveExternalReference(sourceDef: PropertyRef | EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }


  async _visitReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    if (this.handleCheckConditionsIfGiven(sourceDef, propertyDef, classRef)) {
      // if condition is given then no new join table is needed
      return {next: this.handleCreateObjectClass(classRef)};
    } else if (propertyDef.hasJoin()) {
      return this.handleJoinDefinitionIfGiven(sourceDef, propertyDef, classRef, sources)
    } else if (propertyDef.isEmbedded()) {
      if (!propertyDef.isCollection()) {
        if (sourceDef instanceof EntityRef) {
          await this.handleEmbeddedPropertyReference(sourceDef, propertyDef, classRef, sources);
          return {next: this.handleCreateObjectClass(classRef)};
        } else if (sourceDef instanceof ClassRef) {
          await this.handleEmbeddedPropertyReference(sourceDef, propertyDef, classRef, sources);
          return {next: this.handleCreateObjectClass(classRef)};
        }
      }
    } else if (sourceDef instanceof EntityRef) {
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
    throw new NotYetImplementedError('object reference for ' + sourceDef);
  }


  async _leaveReference(sourceDef: PropertyRef | EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    return sources;
  }


  private handleCreateObjectClass(classRef: ClassRef, prefix: string = 'o', targetRef?: EntityRef | ClassRef) {
    let tName = classRef.storingName;
    if (!classRef.hasName()) {
      tName = [prefix, tName].join('_');
    }
    classRef.storingName = tName;
    let entityClass = classRef.getClass();
    this.createEntityIfNotExists(entityClass, tName);
    //Entity(tName)(entityClass);
    // check if an ID exists in class else add one
    this.addType(entityClass);
    if (targetRef) {
      const sourceClass = targetRef.getClass();
      getMetadataArgsStorage().entitySubscribers.filter(s => s.target == sourceClass).map(s => {
        (<any>s['target']) = entityClass;
      });
      getMetadataArgsStorage().entityListeners.filter(s => s.target == sourceClass).map(s => {
        (<any>s['target']) = entityClass;
      });
    }
    return entityClass;
  }

  private handleCreatePropertyClass(propertyDef: PropertyRef, className: string) {
    propertyDef.joinRef = ClassRef.get(SchemaUtils.clazz(className));
    let storeClass = propertyDef.joinRef.getClass();
    let storingName = propertyDef.storingName;
    this.createEntityIfNotExists(storeClass, storingName);
    //Entity(storingName)(storeClass);
    this.addType(storeClass);
    return storeClass;
  }


  private async handleEmbeddedPropertyReference(sourceDef: PropertyRef | EntityRef | ClassRef, propertyDef: PropertyRef, targetDef: EntityRef | ClassRef, sources: XContext): Promise<XContext> {
    //const refTargetClass = {constructor: sources.next};
    const targetClass = sources.next;
    let propertyNames: string[] = [];
    if (propertyDef.hasIdKeys()) {
      propertyNames = propertyDef.getIdKeys();
    } else {
      propertyNames = [propertyDef.storingName];
    }
    let indexNames: string[] = [];
    let idProps: PropertyRef[] = [];
    if (targetDef instanceof EntityRef) {
      idProps = targetDef.getPropertyRefIdentifier();
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
      this.createColumnIfNotExists("regular", targetClass, targetId, propDef)
      //Column(propDef)(refTargetClass, targetId);
    });

    if (!_.isEmpty(propertyNames)) {
      throw new Error('amount of given reference keys is not equal with primary keys of referred entity')
    }

    if (!_.isEmpty(indexNames)) {
      Index(indexNames)({constructor: targetClass})
    }
    return sources;
  }


  private ColumnDef(property: PropertyRef, name: string, skipIdentifier: boolean = false) {
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
      } else if (dbType.sourceType == 'date' && dbType.variant == 'updated') {
        return UpdateDateColumn(def)
      } else if (dbType.sourceType == 'date' && dbType.variant == 'created') {
        return CreateDateColumn(def)
      }
      return Column(def);
    }
    return null;
  }

  private createEntityIfNotExists(entityClass: Function, name: string) {
    if (this.hasEntity(entityClass, name)) {
      return;
    }
    Entity(name)(entityClass);
  }

  private createColumnIfNotExists(type: 'regular' | 'primary' | 'primary-generated' | 'updated' | 'created',
                                  targetClass: Function,
                                  propertyName: string,
                                  propertyRef?: PropertyRef | any,
                                  altPropertyName?: string,
                                  skipIdentifier: boolean = false
  ) {

    if (this.hasColumn(targetClass, propertyName)) {
      return;
    }

    let annotation: Function = null;
    let container = {constructor: targetClass};
    if (propertyRef instanceof PropertyRef) {
      annotation = this.ColumnDef(propertyRef, altPropertyName, skipIdentifier)
    } else if (_.isPlainObject(propertyRef)) {
      switch (type) {
        case "primary-generated":
          annotation = PrimaryGeneratedColumn(propertyRef);
          break;
        case "primary":
          annotation = PrimaryColumn(propertyRef);
          break;
        case "regular":
          annotation = Column(propertyRef);
          break;
        case "created":
          annotation = CreateDateColumn(propertyRef);
          break;
        case "updated":
          annotation = UpdateDateColumn(propertyRef);
          break;
      }

    } else {
      throw new NotYetImplementedError()
    }

    if (!annotation) {
      throw new NotSupportedError('annotation can not be empty')
    }

    return annotation(container, propertyName);

  }


  private attachTargetPrefixedKeys(prefix: string, entityDef: EntityRef, refTargetClass: Function) {
    //let refTargetClassDescr = {constructor: refTargetClass};

    entityDef.getPropertyRefIdentifier().forEach(property => {
      let [targetId, targetName] = this.nameResolver.for(prefix, property);
      this.createColumnIfNotExists("regular", refTargetClass, targetId, property, targetName, true)
      //this.ColumnDef(property, targetName, true)(refTargetClassDescr, targetId);
    });

    if (entityDef.areRevisionsEnabled()) {
      let [targetId, targetName] = this.nameResolver.for(prefix, 'revId');
      this.createColumnIfNotExists("regular", refTargetClass, targetId, {name: targetName, type: 'int'})
      //Column({name: targetName, type: 'int'})(refTargetClassDescr, targetId);
    }

    // TODO if revision support is enabled for entity then it must be handled also be the property
  }


  private attachTargetKeys(propDef: PropertyRef, entityDef: EntityRef | ClassRef, refTargetClass: Function) {
    let uniqueIndex: string[] = [];
    //let refTargetClassDescr = {constructor: refTargetClass};
    // let propPrefix = propDef.machineName();

    let idProps = [];
    if (entityDef instanceof EntityRef) {
      idProps = entityDef.getPropertyRefIdentifier();
    } else {
      idProps = this.schemaDef.getPropertiesFor(entityDef.getClass()).filter(p => p.identifier)
    }

    idProps.forEach(property => {
      let [targetId, targetName] = this.nameResolver.forTarget(property);
      this.createColumnIfNotExists("regular", refTargetClass, targetId, property, targetName, true);
      //this.ColumnDef(property, targetName, true)(refTargetClassDescr, targetId);
      uniqueIndex.push(targetId);
    });

    if (entityDef instanceof EntityRef) {

      // TODO if revision support is enabled for entity then it must be handled also be the property
      if (entityDef.areRevisionsEnabled()) {
        let [targetId, targetName] = this.nameResolver.forTarget('revId');
        this.createColumnIfNotExists("regular", refTargetClass, targetId, {name: targetName, type: 'int'});
        //Column({name: targetName, type: 'int'})(refTargetClassDescr, targetId);
        uniqueIndex.push(targetId);
      }
    }
    Index(uniqueIndex)(refTargetClass)
  }


  private attachPrimaryKeys(entityDef: EntityRef, propDef: PropertyRef, refTargetClass: Function) {
    //let refTargetClassDescr = {constructor: refTargetClass};

    // this is the default variant!
    // create an generic id
    this.createColumnIfNotExists("primary-generated", refTargetClass, 'id', {name: 'id', type: 'int'});
    //PrimaryGeneratedColumn({name: 'id', type: 'int'})(refTargetClassDescr, 'id');

    let [sourceId, sourceName] = this.nameResolver.forSource(XS_P_TYPE);
    this.createColumnIfNotExists("regular", refTargetClass, sourceId, {name: sourceName, type: 'varchar', length: 64});
    //Column({name: sourceName, type: 'varchar', length: 64})(refTargetClassDescr, sourceId);
    let uniqueIndex = [sourceId];

    if (propDef.propertyRef && propDef.propertyRef.getClass() == refTargetClass) {
      [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY);
      this.createColumnIfNotExists("regular", refTargetClass, sourceId, {
        name: sourceName,
        type: 'varchar',
        length: 64
      });
      //Column({name: sourceName, type: 'varchar', length: 64})(refTargetClassDescr, sourceId);
      uniqueIndex.push(sourceId);
    }

    // TODO if revision support is enabled for entity then it must be handled also be the property
    entityDef.getPropertyRefIdentifier().forEach(property => {
      let [sourceId, sourceName] = this.nameResolver.forSource(property);
      let dbType = this.detectDataTypeFromProperty(property);
      let def = _.merge({name: sourceName}, dbType);
      this.createColumnIfNotExists("regular", refTargetClass, sourceId, def);
      //Column(def)(refTargetClassDescr, sourceId);
      uniqueIndex.push(sourceId);
    });

    if (entityDef.areRevisionsEnabled()) {
      [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY);
      this.createColumnIfNotExists("regular", refTargetClass, sourceId, {name: sourceName, type: 'int'});
      //Column({name: sourceName, type: 'int'})(refTargetClassDescr, sourceId);
      uniqueIndex.push(sourceId);
    }
    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_SEQ_NR);
    this.createColumnIfNotExists("regular", refTargetClass, sourceId, {name: sourceName, type: 'int'});
    //Column({name: sourceName, type: 'int'})(refTargetClassDescr, sourceId);
    uniqueIndex.push(sourceId);
    Index(uniqueIndex, {unique: true})(refTargetClass)
  }


  private attachPropertyPrimaryKeys(refTargetClass: Function) {
    //let refTargetClassDescr = {constructor: refTargetClass};

    // this is the default variant!
    // create an generic id
    this.createColumnIfNotExists("primary-generated", refTargetClass, 'id', {name: 'id', type: 'int'});
    //PrimaryGeneratedColumn({name: 'id', type: 'int'})(refTargetClassDescr, 'id');

    let [sourceId, sourceName] = this.nameResolver.forSource(XS_P_TYPE);
    this.createColumnIfNotExists("regular", refTargetClass, sourceId, {name: sourceName, type: 'varchar', length: 64});
    //Column({name: sourceName, type: 'varchar', length: 64})(refTargetClassDescr, sourceId);
    let uniqueIndex = [sourceId];

    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY);
    this.createColumnIfNotExists("regular", refTargetClass, sourceId, {name: sourceName, type: 'varchar', length: 64});
    //Column({name: sourceName, type: 'varchar', length: 64})(refTargetClassDescr, sourceId);
    uniqueIndex.push(sourceId);

    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY_ID);
    this.createColumnIfNotExists("regular", refTargetClass, sourceId, {name: sourceName, type: 'int'});
    //Column({name: sourceName, type: 'int'})(refTargetClassDescr, sourceId);
    uniqueIndex.push(sourceId);

    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_SEQ_NR);
    this.createColumnIfNotExists("regular", refTargetClass, sourceId, {name: sourceName, type: 'int'});
    //Column({name: sourceName, type: 'int'})(refTargetClassDescr, sourceId);
    uniqueIndex.push(sourceId);

    Index(uniqueIndex, {unique: true})(refTargetClass)
  }


  // fixme workaround
  private getStorageOptions(): IStorageOptions {
    return this.storageRef['options'];
  }


  private detectDataTypeFromProperty(prop: PropertyRef): IDBType {
    const schemaHandler = this.storageRef.getSchemaHandler();

    let type: IDBType = schemaHandler.translateToStorageType(prop.dataType); //{type: 'text', sourceType: <JS_DATA_TYPES>prop.dataType};
    if (prop.getOptions('typeorm')) {
      let typeorm = prop.getOptions('typeorm');
      if (_.has(typeorm, 'type')) {
        type.type = typeorm.type;
      }
      if (_.has(typeorm, 'length')) {
        type.length = typeorm.length;
      }
    }
    return type;
  }


  /*
    isClassDefinedInStorage(fn: Function) {
      for (let definedEntity of this.getStorageOptions().entities) {
        if (_.isString(definedEntity) && fn.name == definedEntity) return true;
        if (_.isFunction(definedEntity) && fn == definedEntity) return true;

      }
      return false;
    }
    */
}
