import {EntityController} from '../EntityController';
import {ClassRef} from '../ClassRef';
import {EntityDef} from '../EntityDef';

import {ConnectionWrapper, NotSupportedError, NotYetImplementedError} from 'typexs-base';

import {PropertyDef} from '../PropertyDef';
import {EntityDefTreeWorker, IDataExchange} from './EntityDefTreeWorker';
import {XS_P_PROPERTY, XS_P_SEQ_NR, XS_P_TYPE} from '../Constants';
import * as _ from '../LoDash';


interface IFindData extends IDataExchange<any[]> {
  condition?: any;
  lookup?: any;
  join?: any[],
  map?: number[][]
  limit?: number;
  target?: any[];
}

export class FindOp<T> extends EntityDefTreeWorker {

  readonly em: EntityController;

  private c: ConnectionWrapper;

  constructor(em: EntityController) {
    super();
    this.em = em;
  }


  visitDataProperty(propertyDef: PropertyDef, sourceDef: PropertyDef | EntityDef | ClassRef, sources: IFindData, targets: IFindData): void {
  }

  /**
   * Returns the entities for source.conditions
   */
  async visitEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: IFindData): Promise<IFindData> {
    const limit = sources.limit ? sources.limit : 100;
    let qb = this.c.manager.getRepository(entityDef.object.getClass()).createQueryBuilder();

    if (_.isArray(sources.condition)) {
      sources.condition.forEach(c => {
        qb.orWhere(FindOp.conditionToQuery(c));
      })
    } else if (sources.condition) {
      qb.where(FindOp.conditionToQuery(sources.condition));
    }
    entityDef.getPropertyDefIdentifier().forEach(x => {
      qb.addOrderBy(x.storingName, 'ASC');
    })

    let results = await qb.limit(limit).getMany();
    return {next: results, abort: results.length === 0}
  }

  leaveEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: any): Promise<any> {
    return sources;
  }


  async visitEntityReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources: IFindData): Promise<IFindData> {

    if (propertyDef.joinRef) {
      // own refering table, fetch table data and extract target references
      let sourcePropsIds: PropertyDef[] = null;
      if (sourceDef instanceof EntityDef) {
        sourcePropsIds = sourceDef.getPropertyDefIdentifier();
      } else if (sourceDef instanceof ClassRef) {
        sourcePropsIds = this.em.schema().getPropertiesFor(sourceDef.getClass());
      } else {
        throw new NotYetImplementedError();
      }


      let [sourceTypeId, sourceTypeName] = this.em.nameResolver().forSource(XS_P_TYPE);
      let [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);

      let qb = this.c.manager.getRepository(propertyDef.joinRef.getClass()).createQueryBuilder();

      for (let source of sources.next) {
        let condition: any = {};
        condition[sourceTypeName] = sourceDef.machineName;
        sourcePropsIds.forEach(prop => {
          let [sourceId, sourceName] = this.em.nameResolver().forSource(prop);
          condition[sourceName] = prop.get(source);
        });
        qb.orWhere(FindOp.conditionToQuery(condition));

        if (!_.has(source, propertyDef.name)) {
          if (propertyDef.isCollection()) {
            source[propertyDef.name] = [];
          } else {
            source[propertyDef.name] = null;
          }
        }
      }

      let targetIdProps = entityDef.getPropertyDefIdentifier();
      let _results = await qb.orderBy(sourceSeqNrName, "ASC").getMany();

      let lookups: any[] = [];
      let conditions: any = [];
      for (let result of _results) {
        let condition: any = {};
        let lookup: any = {source: {}, target: {}};

        sourcePropsIds.forEach(prop => {
          lookup.source[prop.name] = prop.get(result);
        });

        targetIdProps.forEach(prop => {
          let [targetId,] = this.em.nameResolver().forTarget(prop);
          condition[prop.storingName] = result[targetId];
          lookup.target[prop.name] = prop.get(result);
        });

        lookups.push(lookup);
        conditions.push(condition);
      }

      if (_.isEmpty(conditions)) {
        return {next: [], condition: conditions, lookup: [], join: _results, abort: conditions.length === 0};
      }
      return {
        next: sources.next,
        condition: conditions,
        join: _results,
        lookup: lookups,
        abort: conditions.length === 0
      }

    } else {
      // previous refering table, extract conditions
      const targetIdProps = entityDef.getPropertyDefIdentifier();

      let conditions: any[] = [];
      let lookups: any[] = [];
      for (let extJoinObj of sources.next) {
        let condition = {};
        let lookup = {};

        targetIdProps.forEach(prop => {
          let [propId, propName] = this.em.nameResolver().for(propertyDef.machineName, prop);
          condition[prop.storingName] = extJoinObj[propId];
          lookup[prop.name] = extJoinObj[propId];
        })
        lookups.push(lookup);
        conditions.push(condition);
      }
      if (_.isEmpty(conditions)) {
        return {next: [], condition: conditions, lookup: [], abort: conditions.length === 0};
      }
      return {
        next: sources.next,
        condition: conditions,
        lookup: lookups,
        target: sources.next,
        abort: conditions.length === 0
      };
    }
    throw new NotYetImplementedError();
  }


  async leaveEntityReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources: IFindData, visitResult: IFindData): Promise<IFindData> {

    if (propertyDef.joinRef) {
      // my data so handle it
      let sourcePropsIds: PropertyDef[] = null;
      if (sourceDef instanceof EntityDef) {
        sourcePropsIds = sourceDef.getPropertyDefIdentifier();
      } else if (sourceDef instanceof ClassRef) {
        sourcePropsIds = this.em.schema().getPropertiesFor(sourceDef.getClass());
      } else {
        throw new NotYetImplementedError();
      }

      let targetIdProps = entityDef.getPropertyDefIdentifier();
      let [sourceTypeId, sourceTypeName] = this.em.nameResolver().forSource(XS_P_TYPE);
      let [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);

      for (let target of visitResult.next) {
        let lookup: any = {};
        lookup[sourceTypeId] = sourceDef.machineName;
        sourcePropsIds.forEach(prop => {
          let [sourceId,] = this.em.nameResolver().forSource(prop);
          lookup[sourceId] = prop.get(target);
        });

        let joinObjs = _.filter(visitResult.join, lookup);
        // _.orderBy(joinObjs,[sourceSeqNrId]);

        let result: any[] = [];
        for (let joinObj of joinObjs) {
          lookup = {};
          targetIdProps.forEach(prop => {
            let [targetId,] = this.em.nameResolver().forTarget(prop);
            lookup[prop.name] = joinObj[targetId];
          });
          let res = _.find(sources.next, lookup);
          if (res) {
            result.push(res);
          }
        }

        if (propertyDef.isCollection()) {
          target[propertyDef.name] = result;
        } else {
          target[propertyDef.name] = _.isEmpty(result) ? null : _.first(result);
        }
      }

    } else {
      // not my table
      // add object to join object
      let [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
      for (let x = 0; x < visitResult.lookup.length; x++) {

        const lookup = visitResult.lookup[x];
        let joinObj = visitResult.next[x];
        let attachObj = _.find(sources.next, lookup);
        let seqNr = joinObj[sourceSeqNrId];

        if (propertyDef.isCollection()) {
          if (!_.isArray(joinObj[propertyDef.name])) {
            joinObj[propertyDef.name] = [];
          }
          joinObj[propertyDef.name][seqNr] = attachObj;
        } else {
          joinObj[propertyDef.name] = attachObj;
        }
      }
    }
    return sources;
  }


  visitExternalReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IFindData): Promise<IFindData> {
    throw new NotYetImplementedError()
  }

  leaveExternalReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IFindData): Promise<any> {
    throw new NotYetImplementedError()
  }

  async visitObjectReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IFindData): Promise<IFindData> {

    let sourceRefDef: EntityDef = null;
    if (sourceDef instanceof EntityDef) {
      sourceRefDef = sourceDef;
    } else {
      throw new NotYetImplementedError()
    }

    if (propertyDef.joinRef) {

      let joinClass = propertyDef.joinRef.getClass();
      // for default join variant

      let [sourceTypeId, sourceTypeName] = this.em.nameResolver().forSource(XS_P_TYPE);
      let [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);

      // collect pk from source objects
      let idProperties = sourceRefDef.getPropertyDefIdentifier();

      let repo = this.c.manager.getRepository(joinClass);
      let queryBuilder = repo.createQueryBuilder();


      let lookups: any[] = [];
      for (let object of sources.next) {
        let condition: any = {}, lookup: any = {};
        lookup[sourceTypeId] = sourceRefDef.machineName;
        condition[sourceTypeName] = sourceRefDef.machineName;
        idProperties.forEach(x => {
          let [sourceId, sourceName] = this.em.nameResolver().forSource(x);
          condition[sourceName] = x.get(object);
          lookup[sourceId] = x.get(object);
        });
        lookups.push(lookup);
        queryBuilder.orWhere(FindOp.conditionToQuery(condition));
      }

      // TODO if revision support beachte dies an der stellle
      let _results = await queryBuilder.orderBy(sourceSeqNrName, "ASC").getMany();

      if (_results.length == 0) {
        return {next: [], target: sources.next, lookup: [], abort: true}
      }
      return {next: _results, target: sources.next, lookup: lookups, abort: _results.length === 0}

    }
    throw new NotYetImplementedError();
  }


  async leaveObjectReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IFindData): Promise<any> {
    if (propertyDef.joinRef) {
      if (_.isEmpty(sources.target)) {
        return;
      }
      let [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
      let classProp = this.em.schema().getPropertiesFor(classRef.getClass());

      for (let x = 0; x < sources.lookup.length; x++) {
        let lookup = sources.lookup[x];
        let target = sources.target[x];
        let attachObjs = _.filter(sources.next, lookup);
        for (let attachObj of attachObjs) {
          let seqNr = attachObj[sourceSeqNrId];

          let newObject = classRef.new();
          classProp.forEach(p => {
            newObject[p.name] = p.get(attachObj);
          })

          if (propertyDef.isCollection()) {
            if (!_.isArray(target[propertyDef.name])) {
              target[propertyDef.name] = [];
            }
            target[propertyDef.name][seqNr] = newObject;
          } else {
            target[propertyDef.name] = newObject;
          }

        }


      }
      return;
    }
    throw new NotYetImplementedError();
  }


  private static conditionToQuery(condition: any): string {
    return Object.keys(condition).map(k => `${k} = '${condition[k]}'`).join(' AND ')
  }

  private async loadEntityDef<T>(entityName: string | EntityDef, objects: T[]): Promise<T[]> {
    if (objects.length > 0) {
      let entityDef: EntityDef = <EntityDef>entityName;
      if (_.isString(entityName)) {
        entityDef = this.em.schemaDef.getEntity(entityName);
      }
    }
    return objects;
  }


  async run(entityType: Function | string, findConditions: any = null, limit: number = 100): Promise<T[]> {
    this.c = await this.em.storageRef.connect();
    let entityDef = ClassRef.get(entityType).getEntity();
    let result = await this.onEntity(entityDef, null, <IFindData>{next: null, condition: findConditions, limit: limit});
    return result.next;
  }


//
//   async onObjectReference(entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]) {
//     let propClass = propertyDef.targetRef.getClass();
//     await this._onPropertyRefGeneral(propClass, entityDef, propertyDef, objects);
//
//   }
//
//
//   async onExternalProperty(entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]) {
//     let propertyClass = propertyDef.propertyRef.getClass();
//     await this._onPropertyRefGeneral(propertyClass, entityDef, propertyDef, objects);
//   }
//
//
//   private async _onPropertyRefGeneral(propClass: Function, entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]) {
//     let conditions: any[] = [];
//     let storeClass = propertyDef.joinRef.getClass();
//
//     // parent and child must be saved till relations can be inserted
//     //let objectIds: number[] = SchemaUtils.get('id', objects);
//     let [sourceTypeId, sourceTypeName] = this.em.nameResolver().forSource(XS_P_TYPE);
//     let [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
//
//
//     let idProperties = entityDef.getPropertyDefIdentifier();
//
//     let repo = this.c.manager.getRepository(storeClass.name);
//     let queryBuilder = repo.createQueryBuilder();
//
//     for (let object of objects) {
//       let condition: any = {};
//       condition[sourceTypeName] = entityDef.name;
//       idProperties.forEach(x => {
//         let [, sourceName] = this.em.nameResolver().forSource(x);
//         condition[sourceName] = x.get(object);
//       });
//       queryBuilder.orWhere(Object.keys(condition).map(k => `${k} = '${condition[k]}'`).join(' AND '));
//     }
//
//     // TODO if revision support beachte dies an der stellle
//     let _results = await queryBuilder.orderBy(sourceSeqNrName, 'ASC').getMany();
//     if (_results.length == 0) {
//       return;
//     }
//
//     let results = _.map(_results,_result => _.assign(<any>Reflect.construct(propClass,[]),<any>_result));
//
//     conditions = [];
//
//     let subPropertyDefs = this.em.schemaDef.getPropertiesFor(propClass);
//     for (let subPropertyDef of subPropertyDefs) {
//       if (subPropertyDef.isInternal()) {
//         if (subPropertyDef.isReference()) {
//           if (subPropertyDef.isEntityReference()) {
//             let targetEntity = subPropertyDef.targetRef.getEntity();
//             let subIdProperties = targetEntity.getPropertyDefIdentifier();
//             let repo = this.c.manager.getRepository(targetEntity.object.getClass());
//             let queryBuilder = repo.createQueryBuilder();
//
//             results.map(result => {
//               let condition: any = {};
//               subIdProperties.forEach(idProp => {
//                 let [targetId, targetName] = this.em.nameResolver().for(subPropertyDef.machineName, idProp);
//                 condition[idProp.name] = result[targetId];
//               });
//               queryBuilder.orWhere(Object.keys(condition).map(k => `${k} = '${condition[k]}'`).join(' AND '));
//             });
//
//             let targets = await queryBuilder.getMany();
//             targets = await this.loadEntityDef(targetEntity, targets);
//
//             if (targets.length == 0) {
//               continue;
//             }
//
//             results.map(result => {
//               let condition: any = {};
//               subIdProperties.forEach(idProp => {
//                 let [targetId, targetName] = this.em.nameResolver().for(subPropertyDef.machineName, idProp);
//                 condition[idProp.name] = result[targetId];
//               });
//               let subResults = _.filter(targets, condition);
//
//               // cleanup
//               delete result[sourceTypeId];
//               delete result[sourceSeqNrId];
//
//               subIdProperties.forEach(idProp => {
//                 let [targetId,] = this.em.nameResolver().for(subPropertyDef.machineName, idProp);
//                 delete result[targetId];
//               });
//
//
//               if (subPropertyDef.isCollection()) {
//                 result[subPropertyDef.name] = subResults;
//               } else {
//                 result[subPropertyDef.name] = subResults.length == 1 ? subResults.shift() : null;
//               }
//             });
//
//           } else {
//             if (!subPropertyDef.isCollection()) {
//               let subProps = this.em.schema().getPropertiesFor(subPropertyDef.targetRef.getClass());
//               let prefix = subPropertyDef.targetRef.machineName();
//               results.map(result => {
//                 result[subPropertyDef.name] = Reflect.construct(subPropertyDef.targetRef.getClass(), []);
//                 subProps.forEach(subProp => {
//                   const subId = [prefix, subProp.name].join('__');
//                   result[subPropertyDef.name][subProp.name] = result[subId];
//                   delete result[subId];
//                 })
//               })
//             } else {
//
//               throw new NotSupportedError('other then direct entity integration not allowed in property referencing ... ' + subPropertyDef.name);
//             }
//           }
//         }
//       } else {
//         throw new NotSupportedError('only internal properties allowed ' + subPropertyDef.name);
//       }
//     }
//
//     objects.map(object => {
//       let condition: any = {};
//       idProperties.forEach(idProp => {
//         let [targetId, targetName] = this.em.nameResolver().forSource(idProp);
//         condition[targetId] = object[idProp.name];
//       });
//       let subResults = _.filter(results, condition);
//
//       // cleanup
//       subResults.map(sub => {
//         [XS_P_TYPE, XS_P_SEQ_NR, XS_P_PROPERTY].forEach(prop => {
//           let [sourceId,] = this.em.nameResolver().forSource(prop);
//           delete sub[sourceId];
//         });
//         idProperties.map(idProp => {
//           let [sourceId,] = this.em.nameResolver().forSource(idProp);
//           delete sub[sourceId];
//         });
//       });
//
//       if (propertyDef.isCollection()) {
//         object[propertyDef.name] = subResults;
//       } else {
//         object[propertyDef.name] = subResults.length == 1 ? subResults.shift() : null;
//       }
//     });
//
//   }

}


