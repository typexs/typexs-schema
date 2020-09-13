import {IStorageOptions, NotSupportedError, NotYetImplementedError, REGISTRY_TYPEORM, TypeOrmStorageRef} from '@typexs/base';
import {
  Column,
  CreateDateColumn,
  Entity,
  getMetadataArgsStorage,
  Index,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';


import {SchemaRef} from '../../registry/SchemaRef';
import {EntityRef} from '../../registry/EntityRef';
import * as _ from 'lodash';
import {PropertyRef} from '../../registry/PropertyRef';
import {XS_P_PROPERTY, XS_P_PROPERTY_ID, XS_P_SEQ_NR, XS_P_TYPE} from '../../Constants';

import {SchemaUtils} from '../../SchemaUtils';
import {ISchemaMapper} from './../ISchemaMapper';
import {IDataExchange} from '../IDataExchange';
import {EntityDefTreeWorker} from '../EntityDefTreeWorker';
import {NameResolver} from './NameResolver';
import {JoinDesc} from '../../descriptors/JoinDesc';
import {IDBType} from '@typexs/base/libs/storage/IDBType';
import {ClassRef} from 'commons-schema-api';
import {ExprDesc} from 'commons-expressions';
import {EntityRegistry} from '../../EntityRegistry';
import {classRefGet} from '../../Helper';
import {ILookupRegistry} from 'commons-schema-api/browser';
import {TypeOrmEntityRegistry} from '@typexs/base/browser';


export interface XContext extends IDataExchange<Function> {
  prefix?: string;
}


export class SqlSchemaMapper extends EntityDefTreeWorker implements ISchemaMapper {


  private storageRef: TypeOrmStorageRef;

  private schemaDef: SchemaRef;

  nameResolver: NameResolver = new NameResolver();

  private classCache: any = [];

  private registry: ILookupRegistry;


  constructor(storageRef: TypeOrmStorageRef, schemaDef: SchemaRef) {
    super();
    this.storageRef = storageRef;
    this.schemaDef = schemaDef;
    this.registry = TypeOrmEntityRegistry.$();
  }

  getMetadata() {
    return getMetadataArgsStorage();
  }

  hasColumn(fn: Function, propertyName: string) {
    return !!this.getMetadata().columns.find(c => c.target === fn && c.propertyName === propertyName);
  }

  isAlreadyColumn(fn: Function, propertyName: string) {
    return !!this.registry.getEntityRefFor(fn).getPropertyRef(propertyName);
  }

  hasEntity(fn: Function, name: string = null) {
    if (name) {
      return !!this.getMetadata().tables.find(c => c.target === fn && c.name === name);
    }
    return !!this.getMetadata().tables.find(c => c.target === fn);
  }


  async initialize() {
    const entities = this.schemaDef.getStoreableEntities();
    for (const entity of entities) {
      const entityClass = await this.walk(entity, null);
      this.addType(entityClass);
    }
    this.clear();
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


  protected async onEntity(entityDef: EntityRef,
                           referPropertyDef?: PropertyRef,
                           sources?: IDataExchange<any>): Promise<IDataExchange<any>> {
    const cls = entityDef.object.getClass();
    if (!this.isDone(cls) && !this.inClassCache(cls)) {
      this.classCache.push(cls);
      return super.onEntity(entityDef, referPropertyDef, sources);
    }
    return {next: cls, abort: true};
  }


  async visitEntity(entityDef: EntityRef): Promise<XContext> {
    // TODO check if entities are registered or not
    // register as entity
    // TODO can use other table name! Define an override attribute
    const tName = entityDef.storingName;
    const entityClass = entityDef.object.getClass();
    this.createEntityIfNotExists(entityClass, tName);
    return {next: entityClass};
  }


  async leaveEntity(entityDef: EntityRef, propertyDef: PropertyRef, sources: XContext): Promise<XContext> {
    return sources;
  }


  visitDataProperty(propertyDef: PropertyRef, sourceDef: EntityRef | ClassRef, sources?: XContext, results?: XContext): void {
    if (propertyDef.isStoreable()) {
      const entityClass = results.next;

      // TODO prefix support?
      const hasPrefix = _.has(results, 'prefix');
      let propName = propertyDef.name;
      let propStoreName = propertyDef.storingName;
      if (hasPrefix) {
        [propName, propStoreName] = this.nameResolver.for(results.prefix, propertyDef);
      }

      this.createColumnIfNotExists('regular', entityClass, propName, propertyDef, propStoreName);
    }
  }


  private handleCheckConditionsIfGiven(sourceRef: EntityRef | ClassRef, propertyDef: PropertyRef, targetRef: EntityRef | ClassRef) {
    const condition: ExprDesc = propertyDef.getOptions('cond', null);
    if (condition) {
      const referred = targetRef instanceof EntityRef ? targetRef.getClassRef() : targetRef;
      const referrer = sourceRef instanceof EntityRef ? sourceRef.getClassRef() : sourceRef;
      return condition.validate(EntityRegistry.$(), referred, referrer);
    } else {
      return false;
    }
  }


  private handleJoinDefinitionIfGiven(sourceDef: EntityRef | ClassRef,
                                      propertyDef: PropertyRef,
                                      targetRef: EntityRef | ClassRef,
                                      sources: XContext) {
    const join: JoinDesc = propertyDef.getJoin();

    // create join entity class
    const joinProps = this.schemaDef.getPropertiesFor(join.joinRef.getClass());
    const joinClass = this.handleCreateObjectClass(join.joinRef, 'p', targetRef);
    const hasId = joinProps.filter(j => j.identifier).length > 0;
    if (!hasId) {
      this.createColumnIfNotExists('primary-generated', joinClass, 'id', {name: 'id', type: 'int'});
    }

    joinProps.forEach(prop => {
      const propName = prop.name;
      const propStoreName = prop.storingName;
      this.createColumnIfNotExists('regular', joinClass, propName, prop, propStoreName);
    });

    join.validate(
      sourceDef instanceof EntityRef ? sourceDef.getClassRef() : sourceDef,
      propertyDef,
      targetRef instanceof EntityRef ? targetRef.getClassRef() : targetRef);

    if (targetRef instanceof EntityRef) {
      return {next: joinClass};
    }
    return {next: this.handleCreateObjectClass(targetRef)};
  }

  /**
   * Entity -> Property -> Entity
   *
   * @param sourceRef
   * @param propertyRef
   * @param targetRef
   * @param sources
   */
  async visitEntityReference(sourceRef: EntityRef | ClassRef,
                             propertyRef: PropertyRef,
                             targetRef: EntityRef,
                             sources: XContext): Promise<XContext> {
    if (this.handleCheckConditionsIfGiven(sourceRef, propertyRef, targetRef)) {
      // if condition is given then no new join table is needed
      return sources;
    } else if (propertyRef.hasJoin()) {
      return this.handleJoinDefinitionIfGiven(sourceRef, propertyRef, targetRef, sources);
    } else if (sourceRef instanceof EntityRef) {

      if (propertyRef.isEmbedded()) {
        return this.handleEmbeddedPropertyReference(sourceRef, propertyRef, targetRef, sources);
      } else {
        /**
         * Default variant if nothing else given generate or use p_{propertyName}_{entityName}
         */
        const pName = propertyRef.storingName;
        const clazz = this.handleCreatePropertyClass(propertyRef, pName);
        this.attachPrimaryKeys(sourceRef, propertyRef, clazz);
        this.attachTargetKeys(propertyRef, targetRef, clazz);
        return {next: clazz};
      }
    } else if (sourceRef instanceof ClassRef) {
      if (!propertyRef.isCollection()) {
        this.attachTargetPrefixedKeys(propertyRef.machineName, targetRef, sources.next);
        return sources;
      } else {
        throw new NotYetImplementedError('not supported; entity reference collection in object');
      }
    }
    throw new NotYetImplementedError('entity reference for ' + sourceRef);
  }


  async leaveEntityReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef,
                             entityDef: EntityRef, sources: XContext, visitResult: XContext): Promise<XContext> {
    // const relation: RelationMetadataArgs = {
    //   target: sourceDef.getClass(),
    //   relationType: propertyDef.isCollection() ? 'one-to-many' : 'one-to-one',
    //   propertyName: propertyDef.name,
    //   // propertyType: reflectedType,
    //   isLazy: false,
    //   type: entityDef.getClass(),
    //   inverseSideProperty: () => entityDef.storingName + '.' + propertyDef.,
    //   options: {}
    // };
    // _.set(propertyDef, 'relation', relation);
    return sources;
  }


  async visitObjectReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef,
                             classRef: ClassRef, sources?: XContext): Promise<XContext> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveObjectReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef,
                             classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }


  async visitExternalReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef,
                               classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveExternalReference(sourceDef: PropertyRef | EntityRef | ClassRef,
                               propertyDef: PropertyRef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }


  async _visitReference(sourceRef: EntityRef | ClassRef, propertyDef: PropertyRef,
                        classRef: ClassRef, sources: XContext): Promise<XContext> {
    if (this.handleCheckConditionsIfGiven(sourceRef, propertyDef, classRef)) {
      // if condition is given then no new join table is needed
      return {next: this.handleCreateObjectClass(classRef)};
    } else if (propertyDef.hasJoin()) {
      return this.handleJoinDefinitionIfGiven(sourceRef, propertyDef, classRef, sources);
    } else if (propertyDef.isEmbedded()) {
      if (!propertyDef.isCollection()) {
        if (sourceRef instanceof EntityRef) {
          await this.handleEmbeddedPropertyReference(sourceRef, propertyDef, classRef, sources);
          return {next: this.handleCreateObjectClass(classRef)};
        } else if (sourceRef instanceof ClassRef) {
          await this.handleEmbeddedPropertyReference(sourceRef, propertyDef, classRef, sources);
          return {next: this.handleCreateObjectClass(classRef)};
        }
      }
    } else if (sourceRef instanceof EntityRef) {
      const storeClass = this.handleCreatePropertyClass(
        propertyDef, [sourceRef.name, _.capitalize(propertyDef.name)].filter(x => !_.isEmpty(x)).join('')
      );
      this.attachPrimaryKeys(sourceRef, propertyDef, storeClass);

      /*
       * a classref can be generated if no name or id property is given
       */
      const targetIdProps = this.schemaDef.getPropertiesFor(classRef.getClass()).filter(p => p.identifier);
      if (targetIdProps.length > 0) {
        this.attachTargetKeys(propertyDef, classRef, storeClass);
        return {next: this.handleCreateObjectClass(classRef)};
      } else {
        return {next: storeClass};
      }
    } else if (sourceRef instanceof ClassRef) {
      if (!propertyDef.isCollection()) {
        return {next: sources.next, prefix: propertyDef.name};
      } else {
        const storeClass = this.handleCreatePropertyClass(propertyDef, _.capitalize(propertyDef.name) + classRef.className);
        this.attachPropertyPrimaryKeys(storeClass);
        return {next: storeClass};
      }
    }
    throw new NotYetImplementedError('object reference for ' + sourceRef);
  }


  async _leaveReference(sourceRef: PropertyRef | EntityRef | ClassRef,
                        propertyRef: PropertyRef,
                        classRef: ClassRef,
                        sources: XContext): Promise<XContext> {
    return sources;
  }


  private handleCreateObjectClass(classRef: ClassRef, prefix: string = 'o', targetRef?: EntityRef | ClassRef) {
    let tName = classRef.storingName;
    if (!classRef.hasName()) {
      tName = [prefix, tName].join('_');
    }
    classRef.storingName = tName;
    const entityClass = classRef.getClass();
    this.createEntityIfNotExists(entityClass, tName);
    // check if an ID exists in class else add one

    if (targetRef) {
      const sourceClass = targetRef.getClass();
      getMetadataArgsStorage().entitySubscribers.filter(s => s.target === sourceClass).map(s => {
        (<any>s['target']) = entityClass;
      });
      getMetadataArgsStorage().entityListeners.filter(s => s.target === sourceClass).map(s => {
        (<any>s['target']) = entityClass;
      });
    }
    return entityClass;
  }


  private handleCreatePropertyClass(propertyDef: PropertyRef, className: string) {
    propertyDef.joinRef = classRefGet(SchemaUtils.clazz(className));
    const storeClass = propertyDef.joinRef.getClass();
    const storingName = propertyDef.storingName;
    this.createEntityIfNotExists(storeClass, storingName);
    return storeClass;
  }


  private async handleEmbeddedPropertyReference(sourceDef: PropertyRef | EntityRef | ClassRef,
                                                propertyDef: PropertyRef,
                                                targetDef: EntityRef | ClassRef,
                                                sources: XContext): Promise<XContext> {
    const targetClass = sources.next;
    let propertyNames: string[] = [];
    if (propertyDef.hasIdKeys()) {
      propertyNames = propertyDef.getIdKeys();
    } else {
      propertyNames = [propertyDef.storingName];
    }
    const indexNames: string[] = [];
    let idProps: PropertyRef[] = [];
    if (targetDef instanceof EntityRef) {
      idProps = targetDef.getPropertyRefIdentifier();
    } else {
      idProps = this.schemaDef.getPropertiesFor(targetDef.getClass()).filter(p => p.identifier);
    }
    if (_.isEmpty(idProps)) {
      throw new NotYetImplementedError('no primary key is defined on ' + targetDef.machineName);
    }
    idProps.forEach(p => {
      const name = propertyNames.shift();
      indexNames.push(name);
      let targetId, targetName;
      if (propertyDef.hasIdKeys()) {
        [targetId, targetName] = this.nameResolver.for(name);
      } else {
        [targetId, targetName] = this.nameResolver.for(name, p);
      }

      const dataType = this.detectDataTypeFromProperty(p);
      const propDef = _.merge({name: targetName}, dataType);
      this.createColumnIfNotExists('regular', targetClass, targetId, propDef);
    });

    if (!_.isEmpty(propertyNames)) {
      throw new Error('amount of given reference keys is not equal with primary keys of referred entity');
    }

    if (!_.isEmpty(indexNames)) {
      Index(indexNames)({constructor: targetClass});
    }
    return sources;
  }


  private ColumnDef(property: PropertyRef, name: string, skipIdentifier: boolean = false) {
    if (property.isStoreable()) {
      let def = _.clone(property.getOptions(REGISTRY_TYPEORM, {}));
      const dbType = this.detectDataTypeFromProperty(property);
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
      } else if (dbType.sourceType === 'date' && dbType.variant === 'updated') {
        return UpdateDateColumn(def);
      } else if (dbType.sourceType === 'date' && dbType.variant === 'created') {
        return CreateDateColumn(def);
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
    this.addType(entityClass);
  }


  private createColumnIfNotExists(type: 'regular' | 'primary' | 'primary-generated' | 'updated' | 'created',
                                  targetClass: Function,
                                  propertyName: string,
                                  propertyRef?: PropertyRef | any,
                                  altPropertyName?: string,
                                  skipIdentifier: boolean = false
  ) {

    if (this.hasColumn(targetClass, propertyName) /*|| this.isAlreadyColumn(targetClass, propertyName)*/) {
      return;
    }

    let annotation: Function = null;
    const container = {constructor: targetClass};
    if (propertyRef instanceof PropertyRef) {
      annotation = this.ColumnDef(propertyRef, altPropertyName, skipIdentifier);
    } else if (_.isPlainObject(propertyRef)) {
      switch (type) {
        case 'primary-generated':
          annotation = PrimaryGeneratedColumn(propertyRef);
          break;
        case 'primary':
          annotation = PrimaryColumn(propertyRef);
          break;
        case 'regular':
          annotation = Column(propertyRef);
          break;
        case 'created':
          annotation = CreateDateColumn(propertyRef);
          break;
        case 'updated':
          annotation = UpdateDateColumn(propertyRef);
          break;
      }

    } else {
      throw new NotYetImplementedError();
    }
    if (!annotation) {
      throw new NotSupportedError('annotation can not be empty');
    }
    return annotation(container, propertyName);
  }


  private attachTargetPrefixedKeys(prefix: string, entityDef: EntityRef, refTargetClass: Function) {
    entityDef.getPropertyRefIdentifier().forEach(property => {
      const [targetId, targetName] = this.nameResolver.for(prefix, property);
      this.createColumnIfNotExists('regular', refTargetClass, targetId, property, targetName, true);
    });

    if (entityDef.areRevisionsEnabled()) {
      const [targetId, targetName] = this.nameResolver.for(prefix, 'revId');
      this.createColumnIfNotExists('regular', refTargetClass, targetId, {name: targetName, type: 'int'});
    }
    // TODO if revision support is enabled for entity then it must be handled also be the property
  }


  private attachTargetKeys(propDef: PropertyRef, entityDef: EntityRef | ClassRef, refTargetClass: Function) {
    const uniqueIndex: string[] = [];

    let idProps = [];
    if (entityDef instanceof EntityRef) {
      idProps = entityDef.getPropertyRefIdentifier();
    } else {
      idProps = this.schemaDef.getPropertiesFor(entityDef.getClass()).filter(p => p.identifier);
    }

    idProps.forEach(property => {
      const [targetId, targetName] = this.nameResolver.forTarget(property);
      this.createColumnIfNotExists('regular', refTargetClass, targetId, property, targetName, true);
      uniqueIndex.push(targetId);
    });

    if (entityDef instanceof EntityRef) {

      // TODO if revision support is enabled for entity then it must be handled also be the property
      if (entityDef.areRevisionsEnabled()) {
        const [targetId, targetName] = this.nameResolver.forTarget('revId');
        this.createColumnIfNotExists('regular', refTargetClass, targetId, {name: targetName, type: 'int'});
        uniqueIndex.push(targetId);
      }
    }
    Index(uniqueIndex)(refTargetClass);
  }


  private attachPrimaryKeys(entityDef: EntityRef, propDef: PropertyRef, refTargetClass: Function) {
    // this is the default variant!
    // create an generic id
    this.createColumnIfNotExists('primary-generated', refTargetClass, 'id', {name: 'id', type: 'int'});

    let [sourceId, sourceName] = this.nameResolver.forSource(XS_P_TYPE);
    this.createColumnIfNotExists('regular', refTargetClass, sourceId, {name: sourceName, type: 'varchar', length: 64});
    const uniqueIndex = [sourceId];

    if (propDef.propertyRef && propDef.propertyRef.getClass() === refTargetClass) {
      [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY);
      this.createColumnIfNotExists('regular', refTargetClass, sourceId, {
        name: sourceName,
        type: 'varchar',
        length: 64
      });
      uniqueIndex.push(sourceId);
    }

    // TODO if revision support is enabled for entity then it must be handled also be the property
    entityDef.getPropertyRefIdentifier().forEach(property => {
      const [sourceId, sourceName] = this.nameResolver.forSource(property);
      const dbType = this.detectDataTypeFromProperty(property);
      const def = _.merge({name: sourceName}, dbType);
      this.createColumnIfNotExists('regular', refTargetClass, sourceId, def);
      uniqueIndex.push(sourceId);
    });

    if (entityDef.areRevisionsEnabled()) {
      [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY);
      this.createColumnIfNotExists('regular', refTargetClass, sourceId, {name: sourceName, type: 'int'});
      uniqueIndex.push(sourceId);
    }
    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_SEQ_NR);
    this.createColumnIfNotExists('regular', refTargetClass, sourceId, {name: sourceName, type: 'int'});
    uniqueIndex.push(sourceId);
    Index(uniqueIndex, {unique: true})(refTargetClass);
  }


  private attachPropertyPrimaryKeys(refTargetClass: Function) {
    // this is the default variant!
    // create an generic id
    this.createColumnIfNotExists('primary-generated', refTargetClass, 'id', {name: 'id', type: 'int'});

    let [sourceId, sourceName] = this.nameResolver.forSource(XS_P_TYPE);
    this.createColumnIfNotExists('regular', refTargetClass, sourceId, {name: sourceName, type: 'varchar', length: 64});
    const uniqueIndex = [sourceId];

    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY);
    this.createColumnIfNotExists('regular', refTargetClass, sourceId, {name: sourceName, type: 'varchar', length: 64});
    uniqueIndex.push(sourceId);

    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY_ID);
    this.createColumnIfNotExists('regular', refTargetClass, sourceId, {name: sourceName, type: 'int'});
    uniqueIndex.push(sourceId);

    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_SEQ_NR);
    this.createColumnIfNotExists('regular', refTargetClass, sourceId, {name: sourceName, type: 'int'});
    uniqueIndex.push(sourceId);

    Index(uniqueIndex, {unique: true})(refTargetClass);
  }


  // fixme workaround
  private getStorageOptions(): IStorageOptions {
    return this.storageRef['options'];
  }


  private detectDataTypeFromProperty(prop: PropertyRef): IDBType {

    // handle object as json, mark for serialization
    if (prop.dataType === 'object') {
      return <any>{
        // type: Object,
        type: String,
        stringify: true,
        sourceType: 'object',
      };
    }
    if (prop.dataType === 'array') {
      return <any>{
        type: String,
        stringify: true,
        // type: Array,
        sourceType: 'array'
      };
    }

    const schemaHandler = this.storageRef.getSchemaHandler();

    const type: IDBType = schemaHandler.translateToStorageType(prop.dataType); // {type: 'text', sourceType: <JS_DATA_TYPES>prop.dataType};
    if (prop.getOptions('typeorm')) {
      const typeorm = prop.getOptions('typeorm');
      if (_.has(typeorm, 'type')) {
        type.type = typeorm.type;
      }
      if (_.has(typeorm, 'length')) {
        type.length = typeorm.length;
      }
    }
    return type;
  }

}
