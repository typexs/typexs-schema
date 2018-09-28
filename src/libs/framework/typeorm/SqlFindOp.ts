import * as _ from '../../LoDash';
import {IFindOp} from "../IFindOp";
import {EntityDefTreeWorker} from "../EntityDefTreeWorker";
import {EntityController} from "../../EntityController";
import {ConnectionWrapper, NotYetImplementedError} from "typexs-base";
import {PropertyDef} from "../../registry/PropertyDef";
import {EntityDef} from "../../registry/EntityDef";
import {ClassRef} from "../../registry/ClassRef";
import {XS_P_PROPERTY, XS_P_PROPERTY_ID, XS_P_SEQ_NR, XS_P_TYPE} from "../../Constants";
import {IDataExchange} from "../IDataExchange";
import {SqlHelper} from "./SqlHelper";
import {Sql} from "./Sql";
import {JoinDesc} from "../../descriptors/Join";
import {EntityRegistry} from "../../EntityRegistry";


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


    if (sources.condition) {
      const whereCond = this.handleCondition(sources.condition);
      qb.where(whereCond);
    }

    entityDef.getPropertyDefIdentifier().forEach(x => {
      qb.addOrderBy(x.storingName, 'ASC');
    });

    let results = await qb.limit(limit).getMany();
    return {next: results, abort: results.length === 0}
  }

  //Object.keys(condition).map(k => `${k} = '${condition[k]}'`).join(' AND ')
  private handleCondition(condition: any, k: string = null): string {
    return Sql.conditionsToString(condition, k);
  }

  leaveEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: any): Promise<any> {
    return sources;
  }


  private async handleJoinDefintionVisit(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, targetDef: EntityDef | ClassRef, sources: IFindData): Promise<[any[], any[], any[]]> {
    let conditions: any[] = [];
    let _lookups: any[] = [];
    let results: any[] = [];

    const joinDef: JoinDesc = propertyDef.getJoin();
    const joinProps = EntityRegistry.getPropertyDefsFor(joinDef.joinRef);

    const mapping = _.merge({}, ... _.map(joinProps, p => {
      let c = {};
      c[p.name] = p.storingName;
      return c;
    }));

    for (let x = 0; x < sources.next.length; x++) {
      let source = sources.next[x];
      conditions.push(joinDef.for(source, mapping));
      _lookups.push(joinDef.lookup(source));
    }


    let where = Sql.conditionsToString(conditions);
    if (!_.isEmpty(conditions) && where) {
      let queryBuilder = this.c.manager.getRepository(joinDef.joinRef.getClass()).createQueryBuilder();
      queryBuilder.where(Sql.conditionsToString(conditions));

      joinDef.order.forEach(o => {
        queryBuilder.addOrderBy(_.get(mapping, o.key.key, o.key.key), o.asc ? 'ASC' : 'DESC');
      });

      results = await queryBuilder.getMany();
    }

    if (results.length == 0) {
      return [[], [], []]
    }

    let lookups: any[] = [];
    conditions = [];
    for (let x = 0; x < sources.next.length; x++) {
      let lookup = _lookups[x];
      let source = sources.next[x];
      let joinResults = _.filter(results,r => lookup(r));
      source[propertyDef.name] = joinResults;
      for(let joinResult of joinResults){
        let condition = joinDef.getTo().cond.for(joinResult);
        conditions.push(condition);
        lookups.push(joinDef.getTo().cond.lookup(joinResult));
      }
    }

    return [conditions, lookups, results];
  }


  private async handleJoinDefintionLeave(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, targetDef: EntityDef | ClassRef, sources: IFindData, visitResult: IFindData): Promise<IFindData> {
    for(let x=0;x< visitResult.next.length;x++){
      let source = visitResult.next[x];
      let targets = propertyDef.get(source);
      if(!targets) continue;

      let results= [];
      for(let target of targets){
        let lookup = visitResult.lookup.shift();
        let result = _.find(sources.next,s => lookup(s));
        if(result){
          results.push(result);
        }
      }
      source[propertyDef.name] = results;
    }
    return sources;
  }


  async visitEntityReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, targetDef: EntityDef, sources: IFindData): Promise<IFindData> {
    let conditions: any[] = [];
    let lookups: any[] = [];
    let results: any[] = [];

    if (propertyDef.hasConditions()) {

      const mapping = _.merge({}, ... _.map(targetDef.getPropertyDefs(), p => {
        let c = {};
        c[p.name] = p.storingName;
        return c;
      }));

      let conditionDef = propertyDef.getCondition();
      for (let source of sources.next) {
        lookups.push(conditionDef.lookup(source));
        conditions.push(conditionDef.for(source, mapping));
      }
    } else if (propertyDef.hasJoin()) {
      [conditions, lookups, results] = await this.handleJoinDefintionVisit(sourceDef, propertyDef, targetDef, sources);
    } else if (propertyDef.hasJoinRef()) {
      // own refering table, fetch table data and extract target references
      let sourcePropsIds: PropertyDef[] = null;
      if (sourceDef instanceof EntityDef) {
        sourcePropsIds = sourceDef.getPropertyDefIdentifier();
      } else if (sourceDef instanceof ClassRef) {
        sourcePropsIds = this.em.schema().getPropertiesFor(sourceDef.getClass()).filter(p => p.identifier);
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

      let targetIdProps = targetDef.getPropertyDefIdentifier();
      results = await qb.orderBy(sourceSeqNrName, "ASC").getMany();


      for (let result of results) {
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


    } else {
      // previous refering table, extract conditions
      const targetIdProps = targetDef.getPropertyDefIdentifier();

      let targetName, targetId;

      if (propertyDef.isEmbedded()) {
        const refProps = SqlHelper.getEmbeddedPropertyIds(propertyDef);
        for (let extJoinObj of sources.next) {
          let condition = {};
          let lookup = {};

          let idx = 0;
          targetIdProps.forEach(prop => {
            let name = refProps[idx++];

            [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
              this.em.nameResolver(), name, propertyDef, prop);

            condition[prop.storingName] = extJoinObj[targetId];
            lookup[prop.name] = extJoinObj[targetId];
          });

          lookups.push(lookup);
          conditions.push(condition);
        }

      } else {
        for (let extJoinObj of sources.next) {
          let condition = {};
          let lookup = {};

          targetIdProps.forEach(prop => {
            let [targetId,] = this.em.nameResolver().for(propertyDef.machineName, prop);
            condition[prop.storingName] = extJoinObj[targetId];
            lookup[prop.name] = extJoinObj[targetId];
          });
          lookups.push(lookup);
          conditions.push(condition);
        }
      }
    }
    if (_.isEmpty(conditions)) {
      return {next: [], condition: conditions, lookup: [], join: results, abort: conditions.length === 0};
    }
    return {
      next: sources.next,
      condition: conditions,
      join: results,
      lookup: lookups,
//      target: sources.next,
      abort: conditions.length === 0
    };
  }


  async leaveEntityReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources: IFindData, visitResult: IFindData): Promise<IFindData> {
    if (propertyDef.hasConditions()) {
      for (let i = 0; i < visitResult.next.length; i++) {
        let source = visitResult.next[i];
        let lookup = visitResult.lookup[i];
        let targets = _.filter(sources.next, s => lookup(s));
        if (propertyDef.isCollection()) {
          source[propertyDef.name] = targets;
        } else {
          source[propertyDef.name] = targets.shift();
        }

      }
    } else if (propertyDef.hasJoin()) {
      await this.handleJoinDefintionLeave(sourceDef, propertyDef, entityDef, sources, visitResult);
    } else if (propertyDef.hasJoinRef()) {
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

    } else if (propertyDef.isEmbedded()) {
      let targetIdProps = entityDef.getPropertyDefIdentifier();
      let refProps = SqlHelper.getEmbeddedPropertyIds(propertyDef);
      let targetName, targetId;
      for (let x = 0; x < visitResult.lookup.length; x++) {

        const lookup = visitResult.lookup[x];
        let joinObj = visitResult.next[x];
        let attachObj = _.find(sources.next, lookup);

        let idx = 0;
        targetIdProps.forEach(prop => {
          let name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.em.nameResolver(), name, propertyDef, prop);
          delete joinObj[targetId];
        });
        joinObj[propertyDef.name] = attachObj;
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
    let lookups: any[] = [];
    let results: any[] = [];
    if (propertyDef.hasJoinRef()) {
      let sourceRefDef: EntityDef = null;
      let joinClass = propertyDef.joinRef.getClass();
      let [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);

      if (sourceDef instanceof EntityDef) {
        sourceRefDef = sourceDef;

        // for default join variant
        let [sourceTypeId, sourceTypeName] = this.em.nameResolver().forSource(XS_P_TYPE);

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

      } else if (sourceDef instanceof ClassRef) {
        // for default join variant
        let [sourcePropertyId, sourcePropertyName] = this.em.nameResolver().forSource(XS_P_PROPERTY_ID);

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

        return {next: _results, target: sources.next, lookup: lookups, abort: _results.length === 0}
      }
    } else if (propertyDef.isEmbedded()) {
      const targetIdProps = this.em.schema()
        .getPropertiesFor(propertyDef.getTargetClass()).filter(p => p.identifier);
      let targetName, targetId;
      const refProps = SqlHelper.getEmbeddedPropertyIds(propertyDef);


      let repo = this.c.manager.getRepository(propertyDef.getTargetClass());
      let queryBuilder = repo.createQueryBuilder();

      for (let extJoinObj of sources.next) {
        let condition = {};
        let lookup = {};

        let idx = 0;
        targetIdProps.forEach(prop => {
          let name = refProps[idx++];

          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.em.nameResolver(), name, propertyDef, prop);

          condition[prop.storingName] = extJoinObj[targetId];
          lookup[prop.name] = extJoinObj[targetId];
        });

        lookups.push(lookup);
        queryBuilder.orWhere(SqlFindOp.conditionToQuery(condition));
        let _results = await queryBuilder.getMany();
        if (_results.length == 0) {
          return {next: [], target: sources.next, lookup: [], abort: true}
        }
        return {next: _results, target: sources.next, lookup: lookups, abort: _results.length === 0}

      }
    } else if (propertyDef.hasConditions()) {

      const targetProps = this.em.schema().getPropertiesFor(classRef.getClass());

      const mapping = _.merge({}, ... _.map(targetProps, p => {
        let c = {};
        c[p.name] = p.storingName;
        return c;
      }));

      let conditions = [];
      let conditionDef = propertyDef.getCondition();
      for (let source of sources.next) {
        lookups.push(conditionDef.lookup(source));
        conditions.push(conditionDef.for(source, mapping));
      }

      let repo = this.c.manager.getRepository(classRef.getClass());
      let queryBuilder = repo.createQueryBuilder();
      let whereConditions = this.handleCondition(conditions);

      if (whereConditions) {
        queryBuilder.where(whereConditions);
        results = await queryBuilder.getMany();
      }

      return {next: results, target: sources.next, lookup: lookups, abort: results.length === 0}
    } else {
      let ret = this.handleInlinePropertyPrefixObject(sources, propertyDef, classRef);
      if (ret !== false) {
        return sources;
      }
    }
    throw new NotYetImplementedError();
  }


  async _leaveReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IFindData): Promise<any> {
    if (propertyDef.hasJoinRef()) {


      if (sourceDef instanceof EntityDef) {

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
            });

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

      } else if (sourceDef instanceof ClassRef) {
        let classProp = this.em.schema().getPropertiesFor(classRef.getClass());


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
            });

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
    } else if (propertyDef.isEmbedded()) {
      let targetIdProps = this.em.schema()
        .getPropertiesFor(propertyDef.getTargetClass())
        .filter(p => p.identifier);

      let refProps = SqlHelper.getEmbeddedPropertyIds(propertyDef);
      let targetName, targetId;
      for (let x = 0; x < sources.lookup.length; x++) {

        const lookup = sources.lookup[x];
        let joinObj = sources.target[x];
        let attachObj = _.find(sources.next, lookup);

        let idx = 0;
        targetIdProps.forEach(prop => {
          let name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.em.nameResolver(), name, propertyDef, prop);
          delete joinObj[targetId];
        });
        joinObj[propertyDef.name] = attachObj;
      }
      return;
    } else if (propertyDef.hasConditions()) {

      for (let i = 0; i < sources.target.length; i++) {
        let target = sources.target[i];
        let lookup = sources.lookup[i];
        let results = _.filter(sources.next, s => lookup(s));
        if (propertyDef.isCollection()) {
          target[propertyDef.name] = results
        } else {
          target[propertyDef.name] = results.shift();
        }
      }
      return;
    } else {

      if (_.get(sources, 'status.inline', false)) {
        // inline objects already readed
        return;
      }
    }
    throw new NotYetImplementedError();
  }

  /**
   *
   * Example: property speed => Speed {value,unit} is embedded inline as obj.speedValue and obj.speedUnit in the overlying object
   *
   */
  private handleInlinePropertyPrefixObject(sources: IFindData, propertyDef: PropertyDef, classRef: ClassRef) {
    const targetProps = this.em.schema().getPropertiesFor(classRef.getClass());
    const hasId = targetProps.filter(p => p.identifier).length > 0;

    if (!hasId) {
      // is embedded in current data record
      for (let join of sources.next) {
        if (propertyDef.isCollection()) {
          throw new NotYetImplementedError()
        } else {
          let target = classRef.new();
          targetProps.forEach(prop => {
            let [id, name] = this.em.nameResolver().for(propertyDef.machineName, prop);
            target[prop.name] = join[id];
            delete join[id];
          });
          join[propertyDef.name] = target;
        }
      }
      _.set(sources, 'status.inline', true);
      return sources;
    }
    return false;
  }


  private static conditionToQuery(condition: any): string {
    return Object.keys(condition).map(k => `${k} = '${condition[k]}'`).join(' AND ')
  }


  async run(entityType: Function | string, findConditions: any = null, limit: number = 100): Promise<T[]> {
    this.c = await this.em.storageRef.connect();
    let entityDef = ClassRef.get(entityType).getEntity();
    let result = await this.onEntity(entityDef, null, <IFindData>{next: null, condition: findConditions, limit: limit});
    return result.next;
  }


}


