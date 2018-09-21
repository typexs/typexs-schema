import {EntityDef} from '../EntityDef';

import {ConnectionWrapper} from 'typexs-base';
import {SchemaUtils} from '../SchemaUtils';
import {PropertyDef} from '../PropertyDef';
import {EntityController} from '../EntityController';
import {EntityDefTreeWorker, IDataExchange} from './EntityDefTreeWorker';
import {NotYetImplementedError, NotSupportedError} from 'typexs-base';
import {XS_P_PROPERTY, XS_P_SEQ_NR, XS_P_TYPE} from '../Constants';
import * as _ from '../LoDash';
import {ClassRef} from "../ClassRef";


export interface IRelation {

}

export class EntityRefenceRelation implements IRelation {

  sourceRef: EntityDef;

  propertyRef: PropertyDef;

  source: any;

}


interface ISaveData extends IDataExchange<any[]> {
  join?: any[];
  map?: number[][];
  target?: any[];
}

export class PropertyRefenceRelation implements IRelation {

  sourceRef: EntityDef;

  propertyRef: PropertyDef;

  source: any;

}


export class SaveOp<T> extends EntityDefTreeWorker {

  readonly em: EntityController;

  private objects: T[] = [];

  private c: ConnectionWrapper;

  private relations: { [className: string]: IRelation[] } = {};


  constructor(em: EntityController) {
    super();
    this.em = em;
  }


  visitDataProperty(propertyDef: PropertyDef, sourceDef: PropertyDef | EntityDef | ClassRef, sources: ISaveData, targets: ISaveData): void {
  }

  async visitEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: ISaveData): Promise<ISaveData> {
    let map: number[][] = [];
    let saved: any[] = await this.c.manager.save(entityDef.object.getClass(), sources.next);
    return {next: saved, map: map};
  }

  async leaveEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: ISaveData): Promise<ISaveData> {
    return sources;
  }


  async visitEntityReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources?: ISaveData): Promise<ISaveData> {

    let sourceEntityDef: EntityDef;
    let targetObjects: any[] = [];
    let map: number[][] = [];
    if (sourceDef instanceof EntityDef) {
      sourceEntityDef = sourceDef;
      [map, targetObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources.next);
    } else if (sourceDef instanceof ClassRef) {
      [map, targetObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources.next);
    } else {
      throw new NotYetImplementedError()
    }

    targetObjects = _.uniq(targetObjects);

    let joinObjs: any[] = [];
    if (propertyDef.joinRef) {
      // if joinRef is present then a new class must be created
      for (let x = 0; x < sources.next.length; x++) {
        let source = sources.next[x];
        //let localMap = map[x];
        let seqNr = 0;
        let targets = propertyDef.get(source);
        if(targets){
          if (!_.isArray(targets)) {
            targets = [targets];
          }
        }else{
          targets = [];
          if(propertyDef.isCollection()){
            source[propertyDef.name] = [];
          }else{
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

    } else {
      joinObjs = sources.join;
    }
    return {next: targetObjects, join: joinObjs, target: sources.next, abort:targetObjects.length === 0};
  }

  async leaveEntityReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources?: ISaveData, visitResult?: ISaveData): Promise<ISaveData> {

    if (propertyDef.joinRef) {
      if (_.isEmpty(visitResult.join)) return sources;

      let targetIdProps = entityDef.getPropertyDefIdentifier();
      for (let x = 0; x < visitResult.join.length; x++) {
        let joinObj = visitResult.join[x];
        let target = propertyDef.get(joinObj);
        targetIdProps.forEach(prop => {
          let [targetId,] = this.em.nameResolver().forTarget(prop);
          joinObj[targetId] = prop.get(target);
        });
      }
      await this.c.manager.save(propertyDef.joinRef.getClass(), visitResult.join);
    } else {
      if (visitResult.join) {
        let sourcePropsIds: PropertyDef[] = null;
        if (sourceDef instanceof EntityDef) {
          sourcePropsIds = sourceDef.getPropertyDefIdentifier();
        } else if (sourceDef instanceof ClassRef) {
          sourcePropsIds = this.em.schema().getPropertiesFor(sourceDef.getClass());
        } else {
          throw new NotYetImplementedError();
        }

      //  let [seqNrId, ] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
        let refIdProps = entityDef.getPropertyDefIdentifier();

        for (let x = 0; x < visitResult.join.length; x++) {
          let joinObj = visitResult.join[x];
          let target = propertyDef.get(joinObj);
          refIdProps.forEach(prop => {
            let [propId, ] = this.em.nameResolver().for(propertyDef.machineName, prop);
            joinObj[propId] = prop.get(target)
          })
        }
      }
    }
    return sources;
  }

  async visitExternalReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: ISaveData): Promise<ISaveData> {
    throw new NotYetImplementedError();
  }

  async leaveExternalReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: ISaveData): Promise<any> {
    return sources;
  }

  async visitObjectReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: ISaveData): Promise<ISaveData> {

    let sourceEntityDef: EntityDef;
    if (sourceDef instanceof EntityDef) {
      sourceEntityDef = sourceDef;
    } else {
      throw new NotYetImplementedError()
    }

    let [map, targetObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources.next);
    let sourceIdProps = sourceEntityDef.getPropertyDefIdentifier();
    let embedProps = this.em.schema().getPropertiesFor(classRef.getClass());

    let joinObjs: any[] = [];
    for (let source of sources.next) {
      let seqNr = 0;
      for (let target of targetObjects) {
        let joinObj = propertyDef.joinRef.new();
        joinObjs.push(joinObj);
        let [id, name] = this.em.nameResolver().forSource(XS_P_TYPE);
        joinObj[id] = sourceEntityDef.machineName;

        sourceIdProps.forEach(prop => {
          [id, name] = this.em.nameResolver().forSource(prop);
          joinObj[id] = prop.get(source);
        });

        [id, name] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
        joinObj[id] = seqNr++;

        embedProps.forEach(prop => {
          joinObj[prop.name] = prop.get(target);
        });
      }
    }

    let targets: ISaveData = {
      next: targetObjects,
      join: joinObjs,
      map: map,
      abort:targetObjects.length === 0
    };

    return targets;

  }

  async leaveObjectReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources?: ISaveData): Promise<ISaveData> {
    if (propertyDef.joinRef && sources.join.length > 0) {
      let sdf = this.c.manager.connection.getMetadata(propertyDef.joinRef.getClass());
      console.log(sdf);
      let saved: any[] = await this.c.manager.save(propertyDef.joinRef.getClass(), sources.join);
      return {next: saved};
    }
    return sources;
  }

  private async saveByEntityDef<T>(entityName: string | EntityDef, objects: T[]): Promise<T[]> {
    let entityDef = SchemaUtils.resolve(this.em.schemaDef, entityName);
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
    this.relations = {};
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
      return Promise.all(promises)
        .then(x => {
          //return this.processRelations();
        });
    });


    if (!isArray) {
      return this.objects.shift();
    }
    return this.objects;

    return null;
  }


}
