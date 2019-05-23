import {ConnectionWrapper, DataContainer, NotYetImplementedError} from '@typexs/base';
import {EntityDefTreeWorker} from '../EntityDefTreeWorker';
import {ISaveOp} from '../ISaveOp';
import {EntityController} from '../../EntityController';
import {PropertyRef} from '../../registry/PropertyRef';
import {EntityRef} from '../../registry/EntityRef';
import {XS_P_PROPERTY, XS_P_PROPERTY_ID, XS_P_SEQ_NR, XS_P_TYPE} from '../../Constants';
import * as _ from 'lodash';
import {IDataExchange} from '../IDataExchange';
import {SqlHelper} from './SqlHelper';
import {JoinDesc} from '../../descriptors/JoinDesc';
import {EntityRegistry} from '../../EntityRegistry';
import {Sql} from './Sql';

import {ObjectsNotValidError} from '../../exceptions/ObjectsNotValidError';
import {ISaveOptions} from '../ISaveOptions';
import {ClassRef} from 'commons-schema-api';
import {SchemaUtils} from '../../SchemaUtils';

const PROP_KEY_LOOKUP = '__lookup__';
const PROP_KEY_TARGET = '__target__';

interface ISaveData extends IDataExchange<any[]> {
  join?: any[];
  map?: number[][];
  target?: any[];
}


export class SqlSaveOp<T> extends EntityDefTreeWorker implements ISaveOp<T> {


  constructor(em: EntityController) {
    super();
    this.em = em;
  }

  readonly em: EntityController;

  private objects: T[] = [];

  private c: ConnectionWrapper;

  static extractKeyableValues(data: any[]) {
    return data.map(obj => {
      const id: any = {};
      _.keys(obj)
        .filter(k => _.isString(obj[k]) || _.isNumber(obj[k]) || _.isDate(obj[k]) || _.isBoolean(obj[k]))
        .map(k => id[k] = obj[k]);
      return id;
    });
  }


  visitDataProperty(propertyDef: PropertyRef, sourceDef: PropertyRef | EntityRef | ClassRef, sources: ISaveData, targets: ISaveData): void {
  }


  async visitEntity(entityDef: EntityRef, propertyDef: PropertyRef, sources: ISaveData): Promise<ISaveData> {
    const map: number[][] = [];
    const embed = entityDef.getPropertyRefs().filter(p => p.isEmbedded() && !p.isNullable());
    if (!_.isEmpty(embed)) {
      const notNullProps = this.getNotNullablePropertyNames(entityDef.getClass());
      for (const source of sources.next) {
        notNullProps.forEach(notNullProp => {
          if (!_.has(source, notNullProp)) {
            source[notNullProp] = '0';
          }
        });
      }
    }
    const saved: any[] = await this.c.manager.save(entityDef.getClass(), sources.next);
    return {next: saved, map: map};
  }


  async leaveEntity(entityDef: EntityRef, propertyDef: PropertyRef, sources: ISaveData): Promise<ISaveData> {
    const embedded = entityDef.getPropertyRefs().filter(p => p.isEmbedded() && !p.isNullable());
    if (!_.isEmpty(embedded)) {
      // save again now with setted values
      await this.c.manager.save(entityDef.object.getClass(), sources.next);

      // cleanup references in object
      let targetName, targetId;

      for (const embed of embedded) {
        const targetIdProps = this.em.schema().getPropertiesFor(embed.getTargetClass()).filter(p => p.identifier);
        const refProps = SqlHelper.getEmbeddedPropertyIds(embed);
        for (const target of sources.next) {
          let idx = 0;
          targetIdProps.forEach(prop => {
            const name = refProps[idx++];
            [targetId, targetName] = SqlHelper
              .resolveNameForEmbeddedIds(
                this.em.nameResolver(), name, embed, prop);
            delete target[targetId];
          });
        }
      }
    }
    return sources;
  }


  async visitEntityReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, targetDef: EntityRef, sources?: ISaveData): Promise<ISaveData> {

    let sourceEntityDef: EntityRef;
    let targetObjects: any[] = [];
    let map: number[][] = [];
    let joinObjs: any[] = [];

    // extract property data
    if (sourceDef instanceof EntityRef) {
      sourceEntityDef = sourceDef;
      [map, targetObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources.next);
    } else if (sourceDef instanceof ClassRef) {
      [map, targetObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources.next);
    } else {
      throw new NotYetImplementedError();
    }

    targetObjects = _.uniq(targetObjects);

    if (propertyDef.hasConditions()) {
      const condition = propertyDef.getCondition();
      for (const source of sources.next) {
        const targets = propertyDef.get(source);
        for (const target of targets) {
          condition.applyOn(target, source);
        }
      }
    } else if (propertyDef.hasJoinRef()) {
      // if joinRef is present then a new class must be created
      for (let x = 0; x < sources.next.length; x++) {
        const source = sources.next[x];
        // let localMap = map[x];
        let seqNr = 0;
        let targets = propertyDef.get(source);
        if (targets) {
          if (!_.isArray(targets)) {
            targets = [targets];
          }
        } else {
          targets = [];
          if (propertyDef.isCollection()) {
            source[propertyDef.name] = [];
          } else {
            source[propertyDef.name] = null;
          }
        }

        for (const target of targets) {
          // if (!target) continue;
          const joinObj = propertyDef.joinRef.new();
          joinObjs.push(joinObj);
          let [id, name] = this.em.nameResolver().forSource(XS_P_TYPE);
          joinObj[id] = sourceEntityDef.machineName;
          sourceEntityDef.getPropertyRefIdentifier().forEach(prop => {
            [id, name] = this.em.nameResolver().forSource(prop);
            joinObj[id] = prop.get(source);
          });
          [id, name] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
          joinObj[id] = seqNr++;
          joinObj[propertyDef.name] = target;
        }
      }
    } else if (propertyDef.hasJoin()) {
      joinObjs = this.handleJoinDefintionVisit(sourceDef, propertyDef, targetDef, sources);
    } else {
      joinObjs = sources.join;
    }

    // TODO if joinObj is empty, then maybe they are not present in the passing data, but exists in the database

    return {
      next: targetObjects,
      join: joinObjs,
      target: sources.next,
      abort: targetObjects.length === 0
    };
  }


  private handleJoinDefintionVisit(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, targetDef: EntityRef | ClassRef, sources: ISaveData) {
    const joinObjs: any[] = [];

    const joinDef: JoinDesc = propertyDef.getJoin();
    const joinProps = EntityRegistry.$().getPropertyRefsFor(joinDef.joinRef);
    const seqNrProp = joinProps.find(p => p.isSequence());
    for (let x = 0; x < sources.next.length; x++) {
      const source = sources.next[x];
      let seqNr = 0;
      let joinTargets = propertyDef.get(source);
      if (!joinTargets) { continue; }
      if (!_.isArray(joinTargets)) {
        joinTargets = [joinTargets];
      }

      // save lookup for removing previous
      const lookup: any = {};
      joinDef.getFrom().cond.applyOn(lookup, source);
      joinDef.condition.applyOn(lookup, source);
      source[PROP_KEY_LOOKUP] = lookup;

      for (const joinTarget of joinTargets) {
        const joinObj = joinDef.joinRef.new();
        joinObjs.push(joinObj);
        joinObj[PROP_KEY_TARGET] = joinTarget;
        //  joinObj[PROP_KEY_LOOKUP] = lookup;
        _.assign(joinObj, lookup);
        if (seqNrProp) {
          joinObj[seqNrProp.name] = seqNr++;
        }
      }
    }
    return joinObjs;
  }


  private async handleJoinDefintionLeave(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, targetDef: EntityRef | ClassRef, sources: ISaveData, visitResult: ISaveData): Promise<ISaveData> {
    const joinDef: JoinDesc = propertyDef.getJoin();
    const clazz = joinDef.joinRef.getClass();
    const removeConditions = [];
    for (const source of visitResult.target) {
      if (_.has(source, PROP_KEY_LOOKUP)) {
        const lookup = source[PROP_KEY_LOOKUP];
        removeConditions.push(lookup);
        delete source[PROP_KEY_LOOKUP];
      }
    }

    // delete previous relations
    if (!_.isEmpty(removeConditions)) {
      const removeSql = Sql.conditionsToString(removeConditions);
      await this.c.manager.getRepository(clazz).createQueryBuilder().delete().where(removeSql).execute();
    }

    if (!_.isEmpty(visitResult.join)) {
      for (const joinObj of visitResult.join) {
        const target = joinObj[PROP_KEY_TARGET];
        joinDef.getTo().cond.applyReverseOn(joinObj, target);
        delete joinObj[PROP_KEY_TARGET];

      }
      await this.c.manager.save(clazz, visitResult.join);
    }
    return sources;
  }

  async saveEntityReference(propertyDef: PropertyRef, targetDef: EntityRef, join: any[]) {
    const klass = propertyDef.joinRef.getClass();
    const ids = SqlSaveOp.extractKeyableValues(join);

    // find previous results
    let previous: any[] = [];
    if (ids.length > 0) {
      previous = await this.c.manager.find(klass, {where: ids});
    }

    const targetIdProps = targetDef.getPropertyRefIdentifier();
    for (let x = 0; x < join.length; x++) {
      const findIds = ids[x];
      if (findIds && !_.isEmpty(previous)) {
        const prevObj = _.remove(previous, findIds);
        if (!_.isEmpty(prevObj)) {
          join[x] = _.merge(prevObj.shift(), join[x]);
        }
      }

      const joinObj = join[x];
      const target = propertyDef.get(joinObj);
      targetIdProps.forEach(prop => {
        const [targetId, ] = this.em.nameResolver().forTarget(prop);
        joinObj[targetId] = prop.get(target);
      });
    }
    await this.c.manager.save(klass, join);

  }

  // TODO retrieveEntityReference, different ways

  async leaveEntityReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, targetDef: EntityRef, sources: ISaveData, visitResult: ISaveData): Promise<ISaveData> {
    if (propertyDef.hasJoinRef()) {
      if (_.isEmpty(visitResult.join)) { return sources; }
      await this.saveEntityReference(propertyDef, targetDef, visitResult.join);
    } else if (propertyDef.isEmbedded()) {
      // set saved referrer id to base entity
      const targetIdProps = targetDef.getPropertyRefIdentifier();
      const refProps = SqlHelper.getEmbeddedPropertyIds(propertyDef);
      let targetName, targetId;
      for (const target of visitResult.target) {
        const source = propertyDef.get(target);
        let idx = 0;
        targetIdProps.forEach(prop => {
          const name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.em.nameResolver(), name, propertyDef, prop);
          target[targetId] = prop.get(source);
        });
      }
    } else if (propertyDef.hasJoin()) {
      return this.handleJoinDefintionLeave(sourceDef, propertyDef, targetDef, sources, visitResult);
    } else {

      if (visitResult.join) {

        const refIdProps = targetDef.getPropertyRefIdentifier();

        for (let x = 0; x < visitResult.join.length; x++) {
          const joinObj = visitResult.join[x];
          const target = propertyDef.get(joinObj);
          refIdProps.forEach(prop => {
            const [propId, ] = this.em.nameResolver().for(propertyDef.machineName, prop);
            joinObj[propId] = prop.get(target);
          });
        }
      }
    }
    return sources;
  }


  async visitExternalReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: ISaveData): Promise<ISaveData> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveExternalReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: ISaveData): Promise<any> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }


  async visitObjectReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: ISaveData): Promise<ISaveData> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveObjectReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources?: ISaveData): Promise<ISaveData> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }


  async _visitReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: ISaveData): Promise<ISaveData> {
    let [map, targetObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources.next);
    let joinObjs: any[] = [];


    if (propertyDef.hasConditions()) {
      const notNullProps = this.getNotNullablePropertyNames(classRef.getClass());
      const condition = propertyDef.getCondition();
      for (const source of sources.next) {
        const targets = propertyDef.get(source);
        if (_.isEmpty(targets)) { continue; }
        for (const target of targets) {
          condition.applyOn(target, source);

          notNullProps.forEach(notNullProp => {
            if (!_.has(target, notNullProp)) {
              target[notNullProp] = '0';
            }
          });
        }
      }

      targetObjects = await this.c.manager.save(classRef.getClass(), targetObjects);

      const targets: ISaveData = {
        next: targetObjects,
        join: joinObjs,
        map: map,
        abort: targetObjects.length === 0
      };


      return targets;
    } else if (propertyDef.hasJoin()) {

      joinObjs = this.handleJoinDefintionVisit(sourceDef, propertyDef, classRef, sources);
      return {
        next: targetObjects,
        join: joinObjs,
        target: sources.next,
        abort: targetObjects.length === 0
      };
    } else if (propertyDef.hasJoinRef()) {
      const targetIdProps = this.em.schema().getPropertiesFor(classRef.getClass()).filter(p => p.identifier);

      if (!_.isEmpty(targetIdProps)) {
        const notNullProps = this.getNotNullablePropertyNames(classRef.getClass());
        for (const target of targetObjects) {
          notNullProps.forEach(notNullProp => {
            if (!_.has(target, notNullProp)) {
              target[notNullProp] = '0';
            }
          });
        }
        targetObjects = await this.c.manager.save(classRef.getClass(), targetObjects);
      }

      if (sourceDef instanceof EntityRef) {

        const sourceIdProps = sourceDef.getPropertyRefIdentifier();
        const embedProps = this.em.schema().getPropertiesFor(classRef.getClass());
        const notNullProps = this.getNotNullablePropertiesForEmbedded(propertyDef, embedProps);

        for (const source of sources.next) {
          let seqNr = 0;

          let _targetObjects = propertyDef.get(source);
          if (!_targetObjects) { continue; }
          if (!_.isArray(_targetObjects)) {
            _targetObjects = [_targetObjects];
          }

          for (const target of _targetObjects) {
            const joinObj = propertyDef.joinRef.new();
            joinObjs.push(joinObj);
            let [id, name] = this.em.nameResolver().forSource(XS_P_TYPE);
            joinObj[id] = sourceDef.machineName;

            sourceIdProps.forEach(prop => {
              [id, name] = this.em.nameResolver().forSource(prop);
              joinObj[id] = prop.get(source);
            });

            [id, name] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
            joinObj[id] = seqNr++;


            const nullable = _.clone(notNullProps);
            embedProps.forEach(prop => {
              _.remove(nullable, x => x == prop.name);
              joinObj[prop.name] = prop.get(target);
            });

            // if target because of reference to an object
            targetIdProps.forEach(prop => {
              const [targetId, ] = this.em.nameResolver().forTarget(prop);
              joinObj[targetId] = prop.get(target);
            });

            notNullProps.forEach(notNullProp => {
              if (!_.has(joinObj, notNullProp)) {
                joinObj[notNullProp] = '0';
              }
            });
          }
        }

        joinObjs = await this.c.manager.save(propertyDef.joinRef.getClass(), joinObjs);

        const targets: ISaveData = {
          next: targetObjects,
          join: joinObjs,
          target: sources.next,
          map: map,
          abort: targetObjects.length === 0
        };

        return targets;

      } else if (sourceDef instanceof ClassRef) {

        // my own property
        const embedProps = this.em.schema().getPropertiesFor(classRef.getClass());
        const notNullProps = this.getNotNullablePropertiesForEmbedded(propertyDef, embedProps);

        for (const join of sources.join) {
          let seqNr = 0;
          const targets = propertyDef.get(join);

          for (const target of targets) {
            const joinObj = propertyDef.joinRef.new();
            joinObj['__property__'] = join;
            joinObjs.push(joinObj);

            let [id, name] = this.em.nameResolver().forSource(XS_P_TYPE);
            joinObj[id] = sourceDef.machineName;

            [id, name] = this.em.nameResolver().forSource(XS_P_PROPERTY);
            joinObj[id] = propertyDef.machineName;

            [id, name] = this.em.nameResolver().forSource(XS_P_PROPERTY_ID);
            joinObj[id] = join.id;

            [id, name] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
            joinObj[id] = seqNr++;


            embedProps.forEach(prop => {
              joinObj[prop.name] = prop.get(target);
            });

            // for initial save we must fill nullables
            notNullProps.forEach(notNullProp => {
              joinObj[notNullProp] = '0';
            });
          }
        }

        joinObjs = await this.c.manager.save(propertyDef.joinRef.getClass(), joinObjs);

        const targets: ISaveData = {
          next: targetObjects,
          join: joinObjs,
          map: map,
          abort: targetObjects.length === 0
        };
        return targets;
      }
    } else if (propertyDef.isEmbedded()) {
      // save targets
      const targetClass = classRef.getClass();
      // TODO save
      const embed = this.em.schema()
        .getPropertiesFor(targetClass)
        .filter(p => p.isEmbedded() && !p.isNullable());

      if (!_.isEmpty(embed)) {
        const notNullProps = this.getNotNullablePropertyNames(targetClass);
        for (const source of targetObjects) {
          notNullProps.forEach(notNullProp => {
            if (!_.has(source, notNullProp)) {
              source[notNullProp] = '0';
            }
          });
        }
      }

      joinObjs = await this.c.manager.save(targetClass, targetObjects);

      const targets: ISaveData = {
        next: joinObjs,
        target: sources.next,
        abort: targetObjects.length === 0
      };
      return targets;
    } else {

      // not my own property
      const embedProps = this.em.schema().getPropertiesFor(classRef.getClass());

      if (sources.join) {
        for (const join of sources.join) {

          let targets = propertyDef.get(join);
          if (!_.isArray(targets)) {
            targets = [targets];
          }

          if (propertyDef.isCollection()) {
            throw new NotYetImplementedError();
          } else {
            // single entry direct or indirect?
            const target = _.first(targets);
            embedProps.forEach(prop => {
              const [id, name] = this.em.nameResolver().for(propertyDef.machineName, prop);
              join[id] = prop.get(target);
            });

          }
        }
        return sources;
      }

    }
    throw new NotYetImplementedError();

  }

  async _leaveReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources?: ISaveData): Promise<ISaveData> {
    if (propertyDef.hasJoinRef()) {

      if (sourceDef instanceof EntityRef) {
        if (!_.isEmpty(sources.join)) {
          // Save join again because new data could be attached!
          const saved: any[] = await this.c.manager.save(propertyDef.joinRef.getClass(), sources.join);
          return {next: saved};
        }

      } else if (sourceDef instanceof ClassRef) {
        if (!_.isEmpty(sources.join)) {
          // Save join again because new data could be attached!
          const saved: any[] = await this.c.manager.save(propertyDef.joinRef.getClass(), sources.join);
          return {next: saved};
        }
      }
    } else if (propertyDef.hasJoin()) {
      const saved: any[] = await this.c.manager.save(classRef.getClass(), sources.next);
      await this.handleJoinDefintionLeave(sourceDef, propertyDef, classRef, sources, sources);
      return {next: saved};
    } else if (propertyDef.isEmbedded()) {

      // set saved referrer id to base entity
      const targetClass = propertyDef.getTargetClass();
      const targetIdProps = this.em.schema().getPropertiesFor(classRef.getClass()).filter(p => p.identifier);
      const refProps = SqlHelper.getEmbeddedPropertyIds(propertyDef);
      let targetName, targetId;
      for (const target of sources.target) {
        const source = propertyDef.get(target);
        let idx = 0;
        targetIdProps.forEach(prop => {
          const name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.em.nameResolver(), name, propertyDef, prop);
          target[targetId] = prop.get(source);
        });
      }
      sources.next = await this.c.manager.save(targetClass, sources.next);
      // cleanup help variables
      for (const target of sources.next) {
        let idx = 0;
        targetIdProps.forEach(prop => {
          const name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.em.nameResolver(), name, propertyDef, prop);
          delete target[targetId];
        });
      }

    }
    return sources;
  }


  private async saveByEntityDef<T>(entityName: string | EntityRef, objects: T[]): Promise<T[]> {
    const entityDef = _.isString(entityName) ? this.em.schema().getEntity(entityName) : entityName;
    return await this.walk(entityDef, objects);
  }


  prepare(object: T | T[]): T[] {
    let objs: T[] = [];
    if (_.isArray(object)) {
      objs = object;
    } else {
      objs.push(object);
    }
    return objs;
  }


  private async validate() {
    let valid = true;
    await Promise.all(_.map(this.objects, o => new DataContainer(o, EntityRegistry.$())).map(async c => {
      valid = valid && await c.validate();
      c.applyState();
    }));
    return valid;
  }


  async run(object: T | T[], options: ISaveOptions = {validate: true}): Promise<T | T[]> {
    const isArray = _.isArray(object);

    this.objects = this.prepare(object);
    let objectsValid = true;
    if (_.get(options, 'validate', false)) {
      objectsValid = await this.validate();
    }


    if (objectsValid) {
      const resolveByEntityDef = EntityController.resolveByEntityDef(this.objects);
      const entityNames = Object.keys(resolveByEntityDef);
      this.c = await this.em.storageRef.connect();

      // start transaction, got to leafs and save
      const results = await this.c.manager.transaction(async em => {
        const promises = [];
        for (const entityName of entityNames) {
          const p = this.saveByEntityDef(entityName, resolveByEntityDef[entityName]);
          promises.push(p);
        }
        return Promise.all(promises);
      });
    } else {
      throw new ObjectsNotValidError(this.objects, isArray);
    }


    if (!isArray) {
      return this.objects.shift();
    }
    return this.objects;
  }

  private getNotNullablePropertyNames(clazz: Function) {
    const metadata = this.c.manager.connection.getMetadata(clazz);
    const notNullProps = metadata.ownColumns
      .filter(x => !x.isNullable &&
        !x.propertyName.startsWith('source') && x.propertyName !== 'id')
      .map(x => x.propertyName);
    return notNullProps;
  }


  private getNotNullablePropertiesForEmbedded(propertyDef: PropertyRef, embedProps: PropertyRef[]) {
    const notNullProps = this.getNotNullablePropertyNames(propertyDef.joinRef.getClass());
    embedProps.forEach(prop => {
      _.remove(notNullProps, x => x == prop.name);
    });
    return notNullProps;
  }

}
