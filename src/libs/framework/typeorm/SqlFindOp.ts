import * as _ from 'lodash';
import {IFindOp} from "../IFindOp";
import {EntityDefTreeWorker} from "../EntityDefTreeWorker";
import {EntityController} from "../../EntityController";
import {ConnectionWrapper, NotYetImplementedError} from "typexs-base";
import {PropertyDef} from "../../PropertyDef";
import {EntityDef} from "../../EntityDef";
import {ClassRef} from "../../ClassRef";
import {XS_P_PROPERTY, XS_P_PROPERTY_ID, XS_P_SEQ_NR, XS_P_TYPE} from "../../Constants";
import {IDataExchange} from "../IDataExchange";


interface IFindData extends IDataExchange<any[]> {
  condition?: any;
  lookup?: any;
  join?: any[],
  map?: number[][]
  limit?: number;
  target?: any[];
}

export class SqlFindOp<T> extends EntityDefTreeWorker implements IFindOp<T> {

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
        qb.orWhere(SqlFindOp.conditionToQuery(c));
      })
    } else if (sources.condition) {
      qb.where(SqlFindOp.conditionToQuery(sources.condition));
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
        qb.orWhere(SqlFindOp.conditionToQuery(condition));

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
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }

  leaveExternalReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IFindData): Promise<any> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }

  async visitObjectReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IFindData): Promise<IFindData> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveObjectReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IFindData): Promise<any> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }

  async _visitReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IFindData): Promise<IFindData> {

    let sourceRefDef: EntityDef = null;
    if (sourceDef instanceof EntityDef) {
      sourceRefDef = sourceDef;
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
          queryBuilder.orWhere(SqlFindOp.conditionToQuery(condition));
        }

        // TODO if revision support beachte dies an der stellle
        let _results = await queryBuilder.orderBy(sourceSeqNrName, "ASC").getMany();

        if (_results.length == 0) {
          return {next: [], target: sources.next, lookup: [], abort: true}
        }
        return {next: _results, target: sources.next, lookup: lookups, abort: _results.length === 0}

      }
    } else if (sourceDef instanceof ClassRef) {
      if (propertyDef.joinRef) {

        let joinClass = propertyDef.joinRef.getClass();
        // for default join variant

        let [sourcePropertyId, sourcePropertyName] = this.em.nameResolver().forSource(XS_P_PROPERTY_ID);
        let [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);

        // collect pk from source objects

        let repo = this.c.manager.getRepository(joinClass);
        let queryBuilder = repo.createQueryBuilder();


        let lookups: any[] = [];
        for (let object of sources.next) {
          let condition: any = {}, lookup: any = {};

          let [id, name] = this.em.nameResolver().forSource(XS_P_TYPE);
          lookup[id] = sourceDef.machineName();
          condition[name] = sourceDef.machineName();

          [id, name] = this.em.nameResolver().forSource(XS_P_PROPERTY);
          lookup[id] = propertyDef.machineName;
          condition[name] = propertyDef.machineName;

          [id, name] = this.em.nameResolver().forSource(XS_P_PROPERTY_ID);
          lookup[id] = object.id;
          condition[name] = object.id;

          lookups.push(lookup);
          queryBuilder.orWhere(SqlFindOp.conditionToQuery(condition));
        }

        // TODO if revision support beachte dies an der stellle
        let _results = await queryBuilder.addOrderBy(sourcePropertyName, "ASC").addOrderBy(sourceSeqNrName, "ASC").getMany();

        if (_results.length == 0) {
          return {next: [], target: sources.next, lookup: [], abort: true}
        }
        return {next: _results, target: sources.next, lookup: lookups, abort: _results.length === 0}

      } else {
        return sources;
        /*
        if (sources.next) {
          for (let next of sources.next) {

          }
        }
        */
      }

    }

    throw new NotYetImplementedError();
  }


  async _leaveReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IFindData): Promise<any> {
    if (sourceDef instanceof EntityDef) {
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
    } else if (sourceDef instanceof ClassRef) {
      let classProp = this.em.schema().getPropertiesFor(classRef.getClass());

      if (propertyDef.joinRef) {
        if (_.isEmpty(sources.target)) {
          return;
        }
        let [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);

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
      }else{
        const direct = true;
        for(let next of sources.next){
          if(!propertyDef.isCollection()){
            if(direct){
              let entry = classRef.new();
              classProp.forEach(prop => {
                let [id, name] = this.em.nameResolver().for(propertyDef.machineName, prop);
                entry[prop.name] = next[id];
              })
              next[propertyDef.name] = entry;

            }else{
              throw new NotYetImplementedError();
            }

          }else{
            throw new NotYetImplementedError();
          }

        }
        return;
      }
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


}


