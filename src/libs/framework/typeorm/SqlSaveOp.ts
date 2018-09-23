import {ConnectionWrapper, NotYetImplementedError} from 'typexs-base';
import {EntityDefTreeWorker} from "../EntityDefTreeWorker";
import {ISaveOp} from "../ISaveOp";
import {EntityController} from "../../EntityController";
import {PropertyDef} from "../../PropertyDef";
import {EntityDef} from "../../EntityDef";
import {ClassRef} from "../../ClassRef";
import {SchemaUtils} from "../../SchemaUtils";
import {XS_P_PROPERTY, XS_P_PROPERTY_ID, XS_P_SEQ_NR, XS_P_TYPE} from "../../Constants";
import * as _ from "lodash";
import {IDataExchange} from "../IDataExchange";


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

    } else {
      joinObjs = sources.join;
    }
    return {next: targetObjects, join: joinObjs, target: sources.next, abort: targetObjects.length === 0};
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
    if (sourceDef instanceof EntityDef) {
      let [map, targetObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources.next);

      let sourceIdProps = sourceDef.getPropertyDefIdentifier();
      let embedProps = this.em.schema().getPropertiesFor(classRef.getClass());
      let metadata = this.c.manager.connection.getMetadata(propertyDef.joinRef.getClass());
      let notNullProps = metadata.ownColumns
        .filter(x => !x.isNullable && !x.propertyName.startsWith('source') && !x.propertyName.startsWith('property') && !x.propertyName.startsWith('target') && x.propertyName !== 'id')
        .map(x => x.propertyName);

      embedProps.forEach(prop => {
        _.remove(notNullProps, x => x == prop.name);
      });

      let joinObjs: any[] = [];
      for (let source of sources.next) {
        let seqNr = 0;

        for (let target of targetObjects) {
          let nullable = _.clone(notNullProps);
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


          embedProps.forEach(prop => {
            _.remove(nullable, x => x == prop.name);
            joinObj[prop.name] = prop.get(target);
          });

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

    } else if (sourceDef instanceof ClassRef) {

      if (propertyDef.joinRef) {
        // my own property
        let [map, targetObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources.next);
        let embedProps = this.em.schema().getPropertiesFor(classRef.getClass());
        let metadata = this.c.manager.connection.getMetadata(propertyDef.joinRef.getClass());
        let notNullProps = metadata.ownColumns
          .filter(x => !x.isNullable && !x.propertyName.startsWith('source') && !x.propertyName.startsWith('property') && !x.propertyName.startsWith('target') && x.propertyName !== 'id')
          .map(x => x.propertyName);

        embedProps.forEach(prop => {
          _.remove(notNullProps, x => x == prop.name);
        });


        let joinObjs: any[] = [];
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

      } else {

        // not my own property
        const direct = true;
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
              if (direct) {
                let target = _.first(targets);
                embedProps.forEach(prop => {
                  let [id, name] = this.em.nameResolver().for(propertyDef.machineName, prop);
                  join[id] = prop.get(target);
                })
              } else {
                throw new NotYetImplementedError()
              }

            }
          }
          return sources;
        }

      }
    }
    throw new NotYetImplementedError()

  }

  async _leaveReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources?: ISaveData): Promise<ISaveData> {
    if (propertyDef.joinRef && sources.join.length > 0) {
      // TODO fetch existent data and find records for removally
      // Save join again because new data could be attached!
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


}
