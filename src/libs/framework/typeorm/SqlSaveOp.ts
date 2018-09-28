import {ConnectionWrapper, NotYetImplementedError} from 'typexs-base';
import {EntityDefTreeWorker} from "../EntityDefTreeWorker";
import {ISaveOp} from "../ISaveOp";
import {EntityController} from "../../EntityController";
import {PropertyDef} from "../../registry/PropertyDef";
import {EntityDef} from "../../registry/EntityDef";
import {ClassRef} from "../../registry/ClassRef";
import {SchemaUtils} from "../../SchemaUtils";
import {XS_P_PROPERTY, XS_P_PROPERTY_ID, XS_P_SEQ_NR, XS_P_TYPE} from "../../Constants";
import * as _ from "../../LoDash";
import {IDataExchange} from "../IDataExchange";
import {SqlHelper} from "./SqlHelper";
import {JoinDesc} from "../../descriptors/Join";
import {EntityRegistry} from "../../EntityRegistry";


interface ISaveData extends IDataExchange<any[]> {
  join?: any[];
  map?: number[][];
  target?: any[];
}


export class SqlSaveOp<T> extends EntityDefTreeWorker implements ISaveOp<T> {

  readonly em: EntityController;

  private objects: T[] = [];

  private c: ConnectionWrapper;


  constructor(em: EntityController) {
    super();
    this.em = em;
  }


  visitDataProperty(propertyDef: PropertyDef, sourceDef: PropertyDef | EntityDef | ClassRef, sources: ISaveData, targets: ISaveData): void {
  }


  async visitEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: ISaveData): Promise<ISaveData> {
    let map: number[][] = [];

    let embed = entityDef.getPropertyDefs()
      .filter(p => p.isEmbedded() && !p.isNullable());

    if (!_.isEmpty(embed)) {
      let notNullProps = this.getNotNullablePropertyNames(entityDef.getClass());
      for (let source of sources.next) {
        notNullProps.forEach(notNullProp => {
          if (!_.has(source, notNullProp)) {
            source[notNullProp] = '0';
          }
        });
      }
    }

    let saved: any[] = await this.c.manager.save(entityDef.getClass(), sources.next);

    return {next: saved, map: map};
  }

  async leaveEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: ISaveData): Promise<ISaveData> {
    let embedded = entityDef.getPropertyDefs().filter(p => p.isEmbedded() && !p.isNullable());
    if (!_.isEmpty(embedded)) {
      // save again now with setted values
      await this.c.manager.save(entityDef.object.getClass(), sources.next);

      // cleanup references in object
      let targetName, targetId;

      for (let embed of embedded) {
        let targetIdProps = this.em.schema().getPropertiesFor(embed.getTargetClass()).filter(p => p.identifier);
        let refProps = SqlHelper.getEmbeddedPropertyIds(embed);
        for (let target of sources.next) {
          let idx = 0;
          targetIdProps.forEach(prop => {
            let name = refProps[idx++];
            [targetId, targetName] = SqlHelper
              .resolveNameForEmbeddedIds(
                this.em.nameResolver(), name, embed, prop);
            delete target[targetId];
          })
        }

      }
    }
    return sources;
  }


  async visitEntityReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, targetDef: EntityDef, sources?: ISaveData): Promise<ISaveData> {

    let sourceEntityDef: EntityDef;
    let targetObjects: any[] = [];
    let map: number[][] = [];
    let joinObjs: any[] = [];

    if (sourceDef instanceof EntityDef) {
      sourceEntityDef = sourceDef;
      [map, targetObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources.next);
    } else if (sourceDef instanceof ClassRef) {
      [map, targetObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources.next);
    } else {
      throw new NotYetImplementedError()
    }

    targetObjects = _.uniq(targetObjects);

    if (propertyDef.hasConditions()) {
      let condition = propertyDef.getCondition();
      for (let source of sources.next) {
        let targets = propertyDef.get(source);
        for (let target of targets) {
          condition.applyOn(target, source);
        }
      }
    } else if (propertyDef.hasJoinRef()) {
      // if joinRef is present then a new class must be created
      for (let x = 0; x < sources.next.length; x++) {
        let source = sources.next[x];
        //let localMap = map[x];
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

        for (let target of targets) {
          let joinObj = propertyDef.joinRef.new();
          joinObjs.push(joinObj);
          let [id, name] = this.em.nameResolver().forSource(XS_P_TYPE);
          joinObj[id] = sourceEntityDef.machineName;
          sourceEntityDef.getPropertyDefIdentifier().forEach(prop => {
            [id, name] = this.em.nameResolver().forSource(prop);
            joinObj[id] = prop.get(source);
          });
          [id, name] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
          joinObj[id] = seqNr++;
          joinObj[propertyDef.name] = target;
        }
      }
    } else if (propertyDef.hasJoin()) {
      joinObjs = this.handleJoinDefintionVisit(sourceDef, propertyDef, targetDef, sources)
    } else {
      joinObjs = sources.join;
    }
    return {next: targetObjects, join: joinObjs, target: sources.next, abort: targetObjects.length === 0};
  }

  private handleJoinDefintionVisit(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, targetDef: EntityDef | ClassRef, sources: ISaveData) {
    let joinObjs: any[] = [];

    const joinDef: JoinDesc = propertyDef.getJoin();
    const joinProps = EntityRegistry.getPropertyDefsFor(joinDef.joinRef);
    const seqNrProp = joinProps.find(p => p.isSequence())
    for (let x = 0; x < sources.next.length; x++) {
      let source = sources.next[x];
      let seqNr = 0;
      let joinTargets = propertyDef.get(source);
      if (!joinTargets) continue;
      if (!_.isArray(joinTargets)) {
        joinTargets = [joinTargets];
      }

      for (let joinTarget of joinTargets) {
        let joinObj = joinDef.joinRef.new();
        joinObjs.push(joinObj);
        joinObj['__target__'] = joinTarget;
        joinDef.getForm().cond.applyOn(joinObj, source);
        joinDef.condition.applyOn(joinObj, source);
        if (seqNrProp) {
          joinObj[seqNrProp.name] = seqNr++;
        }
      }
    }
    return joinObjs;
  }


  private async handleJoinDefintionLeave(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, targetDef: EntityDef | ClassRef, sources: ISaveData, visitResult: ISaveData): Promise<ISaveData> {
    const joinDef: JoinDesc = propertyDef.getJoin();
    for (let joinObj of visitResult.join) {
      let target = joinObj['__target__'];
      joinDef.getTo().cond.applyReverseOn(joinObj, target);
      delete joinObj['__target__'];
    }
    await this.c.manager.save(joinDef.joinRef.getClass(), visitResult.join);
    return sources;
  }


  async leaveEntityReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, targetDef: EntityDef, sources: ISaveData, visitResult: ISaveData): Promise<ISaveData> {
    if (propertyDef.hasJoinRef()) {
      if (_.isEmpty(visitResult.join)) return sources;

      let targetIdProps = targetDef.getPropertyDefIdentifier();
      for (let x = 0; x < visitResult.join.length; x++) {
        let joinObj = visitResult.join[x];
        let target = propertyDef.get(joinObj);
        targetIdProps.forEach(prop => {
          let [targetId,] = this.em.nameResolver().forTarget(prop);
          joinObj[targetId] = prop.get(target);
        });
      }
      await this.c.manager.save(propertyDef.joinRef.getClass(), visitResult.join);
    } else if (propertyDef.isEmbedded()) {
      // set saved referrer id to base entity
      let targetIdProps = targetDef.getPropertyDefIdentifier();
      let refProps = SqlHelper.getEmbeddedPropertyIds(propertyDef);
      let targetName, targetId;
      for (let target of visitResult.target) {
        let source = propertyDef.get(target);
        let idx = 0;
        targetIdProps.forEach(prop => {
          let name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.em.nameResolver(), name, propertyDef, prop);
          target[targetId] = prop.get(source);
        })
      }
    } else if (propertyDef.hasJoin()) {
      return this.handleJoinDefintionLeave(sourceDef, propertyDef, targetDef, sources, visitResult);
    } else {

      if (visitResult.join) {
        /*
        let sourcePropsIds: PropertyDef[] = null;
        if (sourceDef instanceof EntityDef) {
          sourcePropsIds = sourceDef.getPropertyDefIdentifier();
        } else if (sourceDef instanceof ClassRef) {
          sourcePropsIds = this.em.schema().getPropertiesFor(sourceDef.getClass());
        } else {
          throw new NotYetImplementedError();
        }*/

        //  let [seqNrId, ] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
        let refIdProps = targetDef.getPropertyDefIdentifier();

        for (let x = 0; x < visitResult.join.length; x++) {
          let joinObj = visitResult.join[x];
          let target = propertyDef.get(joinObj);
          refIdProps.forEach(prop => {
            let [propId,] = this.em.nameResolver().for(propertyDef.machineName, prop);
            joinObj[propId] = prop.get(target)
          })
        }
      }
    }
    return sources;
  }


  async visitExternalReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: ISaveData): Promise<ISaveData> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveExternalReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: ISaveData): Promise<any> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }


  async visitObjectReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: ISaveData): Promise<ISaveData> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveObjectReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources?: ISaveData): Promise<ISaveData> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }


  async _visitReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: ISaveData): Promise<ISaveData> {
    let [map, targetObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources.next);
    let joinObjs: any[] = [];


    if (propertyDef.hasConditions()) {
      let notNullProps = this.getNotNullablePropertyNames(classRef.getClass());
      let condition = propertyDef.getCondition();
      for (let source of sources.next) {
        let targets = propertyDef.get(source);
        if (_.isEmpty(targets)) continue;
        for (let target of targets) {
          condition.applyOn(target, source);

          notNullProps.forEach(notNullProp => {
            if (!_.has(target, notNullProp)) {
              target[notNullProp] = '0';
            }
          });
        }
      }

      targetObjects = await this.c.manager.save(classRef.getClass(), targetObjects);

      let targets: ISaveData = {
        next: targetObjects,
        join: joinObjs,
        map: map,
        abort: targetObjects.length === 0
      };


      return targets;
    } else if (propertyDef.hasJoinRef()) {
      let targetIdProps = this.em.schema().getPropertiesFor(classRef.getClass()).filter(p => p.identifier);

      if (!_.isEmpty(targetIdProps)) {
        let notNullProps = this.getNotNullablePropertyNames(classRef.getClass());
        for (let target of targetObjects) {
          notNullProps.forEach(notNullProp => {
            if (!_.has(target, notNullProp)) {
              target[notNullProp] = '0';
            }
          })
        }

        targetObjects = await this.c.manager.save(classRef.getClass(), targetObjects);
      }

      if (sourceDef instanceof EntityDef) {

        let sourceIdProps = sourceDef.getPropertyDefIdentifier();
        let embedProps = this.em.schema().getPropertiesFor(classRef.getClass());
        let notNullProps = this.getNotNullablePropertiesForEmbedded(propertyDef, embedProps);

        for (let source of sources.next) {
          let seqNr = 0;

          let _targetObjects = propertyDef.get(source);
          if (!_targetObjects) continue;
          if (!_.isArray(_targetObjects)) {
            _targetObjects = [_targetObjects]
          }

          for (let target of _targetObjects) {
            let joinObj = propertyDef.joinRef.new();
            joinObjs.push(joinObj);
            let [id, name] = this.em.nameResolver().forSource(XS_P_TYPE);
            joinObj[id] = sourceDef.machineName;

            sourceIdProps.forEach(prop => {
              [id, name] = this.em.nameResolver().forSource(prop);
              joinObj[id] = prop.get(source);
            });

            [id, name] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
            joinObj[id] = seqNr++;


            let nullable = _.clone(notNullProps);
            embedProps.forEach(prop => {
              _.remove(nullable, x => x == prop.name);
              joinObj[prop.name] = prop.get(target);
            });

            // if target because of reference to an object
            targetIdProps.forEach(prop => {
              let [targetId,] = this.em.nameResolver().forTarget(prop);
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

        let targets: ISaveData = {
          next: targetObjects,
          join: joinObjs,
          target: sources.next,
          map: map,
          abort: targetObjects.length === 0
        };

        return targets;

      } else if (sourceDef instanceof ClassRef) {

        // my own property
        let embedProps = this.em.schema().getPropertiesFor(classRef.getClass());
        let notNullProps = this.getNotNullablePropertiesForEmbedded(propertyDef, embedProps);

        for (let join of sources.join) {
          let seqNr = 0;
          let targets = propertyDef.get(join);

          for (let target of targets) {
            let joinObj = propertyDef.joinRef.new();
            joinObj['__property__'] = join;
            joinObjs.push(joinObj);

            let [id, name] = this.em.nameResolver().forSource(XS_P_TYPE);
            joinObj[id] = sourceDef.machineName();

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

        let targets: ISaveData = {
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
      let embed = this.em.schema()
        .getPropertiesFor(targetClass)
        .filter(p => p.isEmbedded() && !p.isNullable());

      if (!_.isEmpty(embed)) {
        let notNullProps = this.getNotNullablePropertyNames(targetClass);
        for (let source of targetObjects) {
          notNullProps.forEach(notNullProp => {
            if (!_.has(source, notNullProp)) {
              source[notNullProp] = '0';
            }
          });
        }
      }

      joinObjs = await this.c.manager.save(targetClass, targetObjects);

      let targets: ISaveData = {
        next: joinObjs,
        target: sources.next,
        abort: targetObjects.length === 0
      };
      return targets;
    } else {

      // not my own property
      let embedProps = this.em.schema().getPropertiesFor(classRef.getClass());

      if (sources.join) {
        for (let join of sources.join) {

          let targets = propertyDef.get(join);
          if (!_.isArray(targets)) {
            targets = [targets];
          }

          if (propertyDef.isCollection()) {
            throw new NotYetImplementedError()
          } else {
            // single entry direct or indirect?
            let target = _.first(targets);
            embedProps.forEach(prop => {
              let [id, name] = this.em.nameResolver().for(propertyDef.machineName, prop);
              join[id] = prop.get(target);
            })

          }
        }
        return sources;
      }

    }
    throw new NotYetImplementedError()

  }

  async _leaveReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources?: ISaveData): Promise<ISaveData> {
    if (propertyDef.hasJoinRef()) {

      if (sourceDef instanceof EntityDef) {
        if (!_.isEmpty(sources.join)) {
          // Save join again because new data could be attached!
          let saved: any[] = await this.c.manager.save(propertyDef.joinRef.getClass(), sources.join);
          return {next: saved};
        }

      } else if (sourceDef instanceof ClassRef) {
        if (!_.isEmpty(sources.join)) {
          // Save join again because new data could be attached!
          let saved: any[] = await this.c.manager.save(propertyDef.joinRef.getClass(), sources.join);
          return {next: saved};
        }
      }

    } else if (propertyDef.isEmbedded()) {

      // set saved referrer id to base entity
      const targetClass = propertyDef.getTargetClass();
      let targetIdProps = this.em.schema().getPropertiesFor(classRef.getClass()).filter(p => p.identifier);
      let refProps = SqlHelper.getEmbeddedPropertyIds(propertyDef);
      let targetName, targetId;
      for (let target of sources.target) {
        let source = propertyDef.get(target);
        let idx = 0;
        targetIdProps.forEach(prop => {
          let name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.em.nameResolver(), name, propertyDef, prop);
          target[targetId] = prop.get(source);
        })
      }
      sources.next = await this.c.manager.save(targetClass, sources.next);
      // cleanup help variables
      for (let target of sources.next) {
        let idx = 0;
        targetIdProps.forEach(prop => {
          let name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.em.nameResolver(), name, propertyDef, prop);
          delete target[targetId];
        })
      }

    }
    return sources;
  }


  private async saveByEntityDef<T>(entityName: string | EntityDef, objects: T[]): Promise<T[]> {
    let entityDef = _.isString(entityName) ? this.em.schema().getEntity(entityName) : entityName;
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


  async run(object: T | T[]): Promise<T | T[]> {
    let isArray = _.isArray(object);

    this.objects = this.prepare(object);

    let resolveByEntityDef = EntityController.resolveByEntityDef(this.objects);
    let entityNames = Object.keys(resolveByEntityDef);
    this.c = await this.em.storageRef.connect();

    // start transaction, got to leafs and save
    let results = await this.c.manager.transaction(async em => {
      let promises = [];
      for (let entityName of entityNames) {
        let p = this.saveByEntityDef(entityName, resolveByEntityDef[entityName]);
        promises.push(p);
      }
      return Promise.all(promises);
    });


    if (!isArray) {
      return this.objects.shift();
    }
    return this.objects;
  }

  private getNotNullablePropertyNames(clazz: Function) {
    let metadata = this.c.manager.connection.getMetadata(clazz);
    let notNullProps = metadata.ownColumns
      .filter(x => !x.isNullable &&
        !x.propertyName.startsWith('source') && x.propertyName !== 'id')
      .map(x => x.propertyName);
    return notNullProps;
  }


  private getNotNullablePropertiesForEmbedded(propertyDef: PropertyDef, embedProps: PropertyDef[]) {
    let notNullProps = this.getNotNullablePropertyNames(propertyDef.joinRef.getClass());
    embedProps.forEach(prop => {
      _.remove(notNullProps, x => x == prop.name);
    });
    return notNullProps;
  }

}
