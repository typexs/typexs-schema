import * as _ from '../../LoDash';
import {IFindOp} from '../IFindOp';
import {EntityDefTreeWorker} from '../EntityDefTreeWorker';
import {EntityController} from '../../EntityController';
import {ConnectionWrapper, NotYetImplementedError, XS_P_$COUNT, XS_P_$LIMIT, XS_P_$OFFSET} from '@typexs/base';
import {PropertyRef} from '../../registry/PropertyRef';
import {EntityRef} from '../../registry/EntityRef';

import {XS_P_$ABORTED, XS_P_PROPERTY, XS_P_PROPERTY_ID, XS_P_SEQ_NR, XS_P_TYPE} from '../../Constants';
import {IDataExchange} from '../IDataExchange';
import {SqlHelper} from './SqlHelper';
import {Sql} from './Sql';
import {JoinDesc} from '../../descriptors/JoinDesc';
import {EntityRegistry} from '../../EntityRegistry';
import {IFindOptions} from '../IFindOptions';
import {OrderDesc} from '../../..';
import {SqlConditionsBuilder} from './SqlConditionsBuilder';
import {ClassRef} from 'commons-schema-api';


interface IFindData extends IDataExchange<any[]> {
  condition?: any;
  lookup?: any;
  join?: any[];
  map?: number[][];
  options?: IFindOptions;
  target?: any[];
}


export class SqlFindOp<T> extends EntityDefTreeWorker implements IFindOp<T> {

  constructor(em: EntityController) {
    super();
    this.em = em;
  }

  objectDepth: number = 0;

  entityDepth: number = 0;

  readonly em: EntityController;

  private c: ConnectionWrapper;

  private options: IFindOptions;


  static getTargetKeyMap(targetDef: EntityRef | ClassRef) {
    const props: PropertyRef[] = targetDef instanceof EntityRef ? targetDef.getPropertyRefs() : EntityRegistry.getPropertyRefsFor(targetDef);
    return _.merge({}, ..._.map(props, p => {
      const c = {};
      c[p.name] = p.storingName;
      return c;
    }));
  }


  private static conditionToQuery(condition: any): string {
    return _.keys(condition).map(k => `${k} = '${condition[k]}'`).join(' AND ');
  }

  private hookAbortCondition: (entityDef: EntityRef, propertyDef: PropertyRef, results: any[], op: SqlFindOp<T>) => boolean =
    (entityDef: EntityRef, propertyDef: PropertyRef, results: any[], op: SqlFindOp<T>) => {
      return op.entityDepth > 0;
    }

  private hookAfterEntity: (entityDef: EntityRef, entities: any[]) => void = () => {
  }


  visitDataProperty(propertyDef: PropertyRef, sourceDef: PropertyRef | EntityRef | ClassRef, sources: IFindData, targets: IFindData): void {
  }

  /**
   * Returns the entities for source.conditions
   */
  async visitEntity(entityDef: EntityRef, propertyDef: PropertyRef, sources: IFindData): Promise<IFindData> {
    // TODO default limit configurable
    const limit = _.get(sources, 'options.limit', propertyDef ? this.options.subLimit : this.options.limit);
    const offset = _.get(sources, 'options.offset', null);
    const sortBy = _.get(sources, 'options.sort', null);

    const qb = this.c.manager.getRepository(entityDef.object.getClass()).createQueryBuilder();

    if (sources.condition) {
      const builder = new SqlConditionsBuilder(entityDef, qb.alias);
      builder.skipNull();
      const where = builder.build(sources.condition);
      if (_.isEmpty(where)) {
        return {next: [], abort: true};
      }

      builder.getJoins().forEach(join => {
        qb.leftJoin(join.table, join.alias, join.condition);
      });
      qb.where(where);
    }

    const recordCount = await qb.getCount();

    if (!_.isNull(limit) && _.isNumber(limit)) {
      qb.limit(limit);
    }

    if (!_.isNull(offset) && _.isNumber(offset)) {
      qb.offset(offset);
    }

    if (_.isNull(sortBy)) {
      entityDef.getPropertyRefIdentifier().forEach(x => {
        qb.addOrderBy(qb.alias + '.' + x.storingName, 'ASC');
      });
    } else if (propertyDef && propertyDef.hasOrder()) {
      const mapping = SqlFindOp.getTargetKeyMap(entityDef);
      propertyDef.getOrder().forEach((o: OrderDesc) => {
        qb.addOrderBy(_.get(mapping, o.key.key, o.key.key), o.asc ? 'ASC' : 'DESC');
      });
    } else {
      _.keys(sortBy).forEach(sortKey => {
        qb.addOrderBy(qb.alias + '.' + sortKey, sortBy[sortKey].toUpperCase());
      });
    }

    const results = await qb.getMany();
    results[XS_P_$COUNT] = recordCount;
    results[XS_P_$OFFSET] = offset;
    results[XS_P_$LIMIT] = limit;

    const abort = results.length === 0 || this.hookAbortCondition(entityDef, propertyDef, results, this);
    if (abort) {
      // marked as aborted
      results.forEach(r => {
        r[XS_P_$ABORTED] = true;
      });
    }
    return {next: results, abort: abort};
  }

  // Object.keys(condition).map(k => `${k} = '${condition[k]}'`).join(' AND ')
  private handleCondition(condition: any, entityDef: EntityRef = null): string {
    return Sql.conditionsToString(condition, null, entityDef ? entityDef.getKeyMap() : {});
  }

  leaveEntity(entityDef: EntityRef, propertyDef: PropertyRef, sources: any): Promise<any> {
    if (sources.next) {
      this.hookAfterEntity(entityDef, sources.next);
    }
    return sources;
  }


  private async handleJoinDefintionVisit(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, targetDef: EntityRef | ClassRef, sources: IFindData): Promise<[any[], any[], any[]]> {
    let conditions: any[] = [];
    const _lookups: any[] = [];
    let results: any[] = [];

    const joinDef: JoinDesc = propertyDef.getJoin();
    // const joinProps = EntityRegistry.getPropertyRefsFor(joinDef.joinRef);

    const mapping = SqlFindOp.getTargetKeyMap(joinDef.joinRef);

    for (let x = 0; x < sources.next.length; x++) {
      const source = sources.next[x];
      conditions.push(joinDef.for(source, mapping));
      _lookups.push(joinDef.lookup(source));
    }


    const where = Sql.conditionsToString(conditions);
    if (!_.isEmpty(conditions) && where) {
      const queryBuilder = this.c.manager.getRepository(joinDef.joinRef.getClass()).createQueryBuilder();
      queryBuilder.where(Sql.conditionsToString(conditions));

      joinDef.order.forEach(o => {
        queryBuilder.addOrderBy(_.get(mapping, o.key.key, o.key.key), o.asc ? 'ASC' : 'DESC');
      });

      results = await queryBuilder.getMany();
    }

    if (results.length == 0) {
      return [[], [], []];
    }

    const lookups: any[] = [];
    conditions = [];
    for (let x = 0; x < sources.next.length; x++) {
      const lookup = _lookups[x];
      const source = sources.next[x];
      const joinResults = _.filter(results, r => lookup(r));
      source[propertyDef.name] = joinResults;
      for (const joinResult of joinResults) {
        const condition = joinDef.getTo().cond.for(joinResult);
        conditions.push(condition);
        lookups.push(joinDef.getTo().cond.lookup(joinResult));
      }
    }

    return [conditions, lookups, results];
  }


  private async handleJoinDefintionLeave(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, targetDef: EntityRef | ClassRef, sources: IFindData, visitResult: IFindData): Promise<IFindData> {
    for (let x = 0; x < visitResult.next.length; x++) {
      const source = visitResult.next[x];
      const targets = propertyDef.get(source);
      if (!targets) {
        continue;
      }

      const results = [];
      for (const target of targets) {
        const lookup = visitResult.lookup.shift();
        const result = _.find(sources.next, s => lookup(s));
        if (result) {
          results.push(result);
        }
      }
      source[propertyDef.name] = results;
    }
    return sources;
  }

  async visitEntityReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, targetDef: EntityRef, sources: IFindData): Promise<IFindData> {
    this.entityDepth++;
    let conditions: any[] = [];
    let lookups: any[] = [];
    let results: any[] = [];
    const orderBy: any[] = null;

    if (propertyDef.hasConditions()) {
      const mapping = SqlFindOp.getTargetKeyMap(targetDef);

      const conditionDef = propertyDef.getCondition();
      for (const source of sources.next) {
        lookups.push(conditionDef.lookup(source));
        conditions.push(conditionDef.for(source, mapping));
      }

    } else if (propertyDef.hasJoin()) {
      [conditions, lookups, results] = await this.handleJoinDefintionVisit(sourceDef, propertyDef, targetDef, sources);
    } else if (propertyDef.hasJoinRef()) {
      // own refering table, fetch table data and extract target references
      let sourcePropsIds: PropertyRef[] = null;
      if (sourceDef instanceof EntityRef) {
        sourcePropsIds = sourceDef.getPropertyRefIdentifier();
      } else if (sourceDef instanceof ClassRef) {
        sourcePropsIds = this.em.schema().getPropertiesFor(sourceDef.getClass()).filter(p => p.identifier);
      } else {
        throw new NotYetImplementedError();
      }

      const [sourceTypeId, sourceTypeName] = this.em.nameResolver().forSource(XS_P_TYPE);
      const [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);

      const qb = this.c.manager.getRepository(propertyDef.joinRef.getClass()).createQueryBuilder();

      for (const source of sources.next) {
        const condition: any = {};
        condition[sourceTypeName] = sourceDef.machineName;
        sourcePropsIds.forEach(prop => {
          const [sourceId, sourceName] = this.em.nameResolver().forSource(prop);
          condition[sourceName] = prop.get(source);
        });

        const query = SqlFindOp.conditionToQuery(condition);
        if (!_.isEmpty(query)) {
          qb.orWhere(query);
        }

        if (!_.has(source, propertyDef.name)) {
          if (propertyDef.isCollection()) {
            source[propertyDef.name] = [];
          } else {
            source[propertyDef.name] = null;
          }
        }
      }

      const targetIdProps = targetDef.getPropertyRefIdentifier();
      if (propertyDef.hasOrder()) {
        const mapping = SqlFindOp.getTargetKeyMap(targetDef);
        propertyDef.getOrder().forEach((o: OrderDesc) => {
          qb.addOrderBy(_.get(mapping, o.key.key, o.key.key), o.asc ? 'ASC' : 'DESC');
        });
      } else {
        qb.orderBy(sourceSeqNrName, 'ASC');
      }

      results = await qb.getMany();


      for (const result of results) {
        const condition: any = {};
        const lookup: any = {source: {}, target: {}};

        sourcePropsIds.forEach(prop => {
          lookup.source[prop.name] = prop.get(result);
        });

        targetIdProps.forEach(prop => {
          const [targetId, ] = this.em.nameResolver().forTarget(prop);
          condition[prop.storingName] = result[targetId];
          lookup.target[prop.name] = prop.get(result);
        });

        lookups.push(lookup);
        conditions.push(condition);
      }


    } else {
      // previous refering table, extract conditions
      const targetIdProps = targetDef.getPropertyRefIdentifier();

      let targetName, targetId;

      if (propertyDef.isEmbedded()) {
        const refProps = SqlHelper.getEmbeddedPropertyIds(propertyDef);
        for (const extJoinObj of sources.next) {
          const condition = {};
          const lookup = {};

          let idx = 0;
          targetIdProps.forEach(prop => {
            const name = refProps[idx++];

            [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
              this.em.nameResolver(), name, propertyDef, prop);

            condition[prop.storingName] = extJoinObj[targetId];
            lookup[prop.name] = extJoinObj[targetId];
          });

          lookups.push(lookup);
          conditions.push(condition);
        }

      } else {
        for (const extJoinObj of sources.next) {
          const condition = {};
          const lookup = {};

          targetIdProps.forEach(prop => {
            const [targetId, ] = this.em.nameResolver().for(propertyDef.machineName, prop);
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


  async leaveEntityReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, entityDef: EntityRef, sources: IFindData, visitResult: IFindData): Promise<IFindData> {
    this.entityDepth--;
    if (propertyDef.hasConditions()) {
      for (let i = 0; i < visitResult.next.length; i++) {
        const source = visitResult.next[i];
        const lookup = visitResult.lookup[i];
        const targets = _.filter(sources.next, s => lookup(s));
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
      let sourcePropsIds: PropertyRef[] = null;
      if (sourceDef instanceof EntityRef) {
        sourcePropsIds = sourceDef.getPropertyRefIdentifier();
      } else if (sourceDef instanceof ClassRef) {
        sourcePropsIds = this.em.schema().getPropertiesFor(sourceDef.getClass());
      } else {
        throw new NotYetImplementedError();
      }

      const targetIdProps = entityDef.getPropertyRefIdentifier();
      const [sourceTypeId, sourceTypeName] = this.em.nameResolver().forSource(XS_P_TYPE);
      const [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);

      for (const target of visitResult.next) {
        let lookup: any = {};
        lookup[sourceTypeId] = sourceDef.machineName;
        sourcePropsIds.forEach(prop => {
          const [sourceId, ] = this.em.nameResolver().forSource(prop);
          lookup[sourceId] = prop.get(target);
        });

        const joinObjs = _.filter(visitResult.join, lookup);
        // _.orderBy(joinObjs,[sourceSeqNrId]);

        const result: any[] = [];
        for (const joinObj of joinObjs) {
          lookup = {};
          targetIdProps.forEach(prop => {
            const [targetId, ] = this.em.nameResolver().forTarget(prop);
            lookup[prop.name] = joinObj[targetId];
          });
          const res = _.find(sources.next, lookup);
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
      const targetIdProps = entityDef.getPropertyRefIdentifier();
      const refProps = SqlHelper.getEmbeddedPropertyIds(propertyDef);
      let targetName, targetId;
      for (let x = 0; x < visitResult.lookup.length; x++) {

        const lookup = visitResult.lookup[x];
        const joinObj = visitResult.next[x];
        const attachObj = _.find(sources.next, lookup);

        let idx = 0;
        targetIdProps.forEach(prop => {
          const name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.em.nameResolver(), name, propertyDef, prop);
          delete joinObj[targetId];
        });
        joinObj[propertyDef.name] = attachObj;
      }

    } else {
      // not my table
      // add object to join object
      const [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
      for (let x = 0; x < visitResult.lookup.length; x++) {

        const lookup = visitResult.lookup[x];
        const joinObj = visitResult.next[x];
        const attachObj = _.find(sources.next, lookup);
        const seqNr = joinObj[sourceSeqNrId];

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


  visitExternalReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: IFindData): Promise<IFindData> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }

  leaveExternalReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: IFindData): Promise<any> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }

  async visitObjectReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: IFindData): Promise<IFindData> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }

  async leaveObjectReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: IFindData): Promise<any> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }

  async _visitReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: IFindData): Promise<IFindData> {
    this.objectDepth++;
    let conditions: any[] = [];
    let lookups: any[] = [];
    let results: any[] = [];

    if (propertyDef.hasJoin()) {
      [conditions, lookups, results] = await this.handleJoinDefintionVisit(sourceDef, propertyDef, classRef, sources);

      if (conditions.length > 0) {
        const repo = this.c.manager.getRepository(classRef.getClass());
        const queryBuilder = repo.createQueryBuilder();
        for (const cond of conditions) {
          const query = SqlFindOp.conditionToQuery(cond);
          if (!_.isEmpty(query)) {
            queryBuilder.orWhere(query);
          }
        }
        results = await queryBuilder.getMany();
      }

      return {
        next: results,
        target: sources.next,
        lookup: lookups,
        abort: results.length === 0,
        condition: conditions
      };
    } else if (propertyDef.hasJoinRef()) {
      let sourceRefDef: EntityRef = null;
      const joinClass = propertyDef.joinRef.getClass();
      const [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);

      if (sourceDef instanceof EntityRef) {
        sourceRefDef = sourceDef;

        // for default join variant
        const [sourceTypeId, sourceTypeName] = this.em.nameResolver().forSource(XS_P_TYPE);

        // collect pk from source objects
        const idProperties = sourceRefDef.getPropertyRefIdentifier();

        const repo = this.c.manager.getRepository(joinClass);
        const queryBuilder = repo.createQueryBuilder();

        const lookups: any[] = [];
        for (const object of sources.next) {
          const condition: any = {}, lookup: any = {};
          lookup[sourceTypeId] = sourceRefDef.machineName;
          condition[sourceTypeName] = sourceRefDef.machineName;
          idProperties.forEach(x => {
            const [sourceId, sourceName] = this.em.nameResolver().forSource(x);
            condition[sourceName] = x.get(object);
            lookup[sourceId] = x.get(object);
          });
          lookups.push(lookup);
          const query = SqlFindOp.conditionToQuery(condition);
          if (!_.isEmpty(query)) {
            queryBuilder.orWhere(query);
          }

        }

        // TODO if revision support beachte dies an der stellle
        const _results = await queryBuilder.orderBy(sourceSeqNrName, 'ASC').getMany();

        if (_results.length == 0) {
          return {next: [], target: sources.next, lookup: [], abort: true};
        }
        return {next: _results, target: sources.next, lookup: lookups, abort: _results.length === 0};

      } else if (sourceDef instanceof ClassRef) {
        // for default join variant
        const [sourcePropertyId, sourcePropertyName] = this.em.nameResolver().forSource(XS_P_PROPERTY_ID);

        // collect pk from source objects

        const repo = this.c.manager.getRepository(joinClass);
        const queryBuilder = repo.createQueryBuilder();


        const lookups: any[] = [];
        for (const object of sources.next) {
          const condition: any = {}, lookup: any = {};

          let [id, name] = this.em.nameResolver().forSource(XS_P_TYPE);
          lookup[id] = sourceDef.machineName;
          condition[name] = sourceDef.machineName;

          [id, name] = this.em.nameResolver().forSource(XS_P_PROPERTY);
          lookup[id] = propertyDef.machineName;
          condition[name] = propertyDef.machineName;

          [id, name] = this.em.nameResolver().forSource(XS_P_PROPERTY_ID);
          lookup[id] = object.id;
          condition[name] = object.id;

          lookups.push(lookup);
          const query = SqlFindOp.conditionToQuery(condition);
          if (!_.isEmpty(query)) {
            queryBuilder.orWhere(query);
          }
        }

        // TODO if revision support beachte dies an der stellle
        const _results = await queryBuilder.addOrderBy(sourcePropertyName, 'ASC').addOrderBy(sourceSeqNrName, 'ASC').getMany();

        return {next: _results, target: sources.next, lookup: lookups, abort: _results.length === 0};
      }
    } else if (propertyDef.isEmbedded()) {
      const targetIdProps = this.em.schema()
        .getPropertiesFor(propertyDef.getTargetClass()).filter(p => p.identifier);
      let targetName, targetId;
      const refProps = SqlHelper.getEmbeddedPropertyIds(propertyDef);


      const repo = this.c.manager.getRepository(propertyDef.getTargetClass());
      const queryBuilder = repo.createQueryBuilder();

      for (const extJoinObj of sources.next) {
        const condition = {};
        const lookup = {};

        let idx = 0;
        targetIdProps.forEach(prop => {
          const name = refProps[idx++];

          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(this.em.nameResolver(), name, propertyDef, prop);
          condition[prop.storingName] = extJoinObj[targetId];
          lookup[prop.name] = extJoinObj[targetId];
        });

        lookups.push(lookup);

        const query = SqlFindOp.conditionToQuery(condition);
        if (!_.isEmpty(query)) {
          queryBuilder.orWhere(query);
        }

        const _results = await queryBuilder.getMany();
        if (_results.length == 0) {
          return {next: [], target: sources.next, lookup: [], abort: true};
        }
        return {next: _results, target: sources.next, lookup: lookups, abort: _results.length === 0};

      }
    } else if (propertyDef.hasConditions()) {

      const mapping = SqlFindOp.getTargetKeyMap(classRef);
      const conditions = [];
      // let orderByDef = propertyDef.Condition();
      const conditionDef = propertyDef.getCondition();
      for (const source of sources.next) {
        lookups.push(conditionDef.lookup(source));

        conditions.push(conditionDef.for(source, mapping));
      }

      const repo = this.c.manager.getRepository(classRef.getClass());
      const queryBuilder = repo.createQueryBuilder();
      const whereConditions = this.handleCondition(conditions);

      if (whereConditions) {
        queryBuilder.where(whereConditions);
        if (propertyDef.hasOrder()) {
          propertyDef.getOrder().forEach((o: OrderDesc) => {
            queryBuilder.addOrderBy(_.get(mapping, o.key.key, o.key.key), o.asc ? 'ASC' : 'DESC');
          });
        }
        results = await queryBuilder.getMany();
      }

      return {
        next: results,
        target: sources.next,
        lookup: lookups,
        abort: results.length === 0,
        condition: conditions
      };
    } else {
      const ret = this.handleInlinePropertyPrefixObject(sources, propertyDef, classRef);
      if (ret !== false) {
        return sources;
      }
    }
    throw new NotYetImplementedError();
  }


  async _leaveReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: IFindData): Promise<any> {
    this.objectDepth--;
    if (propertyDef.hasJoin()) {
      if (_.isEmpty(sources.target)) {
        return;
      }

      for (let x = 0; x < sources.lookup.length; x++) {
        const lookup = sources.lookup[x];
        const target = sources.target[x];
        const attachObjs = _.filter(sources.next, lookup);
        if (propertyDef.isCollection()) {
          target[propertyDef.name] = attachObjs;
        } else {
          target[propertyDef.name] = attachObjs.shift();
        }
      }

//      await this.handleJoinDefintionLeave(sourceDef, propertyDef, classRef, sources, {next: sources.target,lookup:sources.});
      return;
    } else if (propertyDef.hasJoinRef()) {
      if (_.isEmpty(sources.target)) {
        return;
      }
      const classProp = this.em.schema().getPropertiesFor(classRef.getClass());
      const [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
      if (sourceDef instanceof EntityRef) {


        for (let x = 0; x < sources.lookup.length; x++) {
          const lookup = sources.lookup[x];
          const target = sources.target[x];
          const attachObjs = _.filter(sources.next, lookup);
          for (const attachObj of attachObjs) {
            const seqNr = attachObj[sourceSeqNrId];

            const newObject = classRef.new();
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
        // let classProp = this.em.schema().getPropertiesFor(classRef.getClass());
//        let [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);

        for (let x = 0; x < sources.lookup.length; x++) {
          const lookup = sources.lookup[x];
          const target = sources.target[x];
          const attachObjs = _.filter(sources.next, lookup);
          for (const attachObj of attachObjs) {
            const seqNr = attachObj[sourceSeqNrId];

            const newObject = classRef.new();
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
      const targetIdProps = this.em.schema()
        .getPropertiesFor(propertyDef.getTargetClass())
        .filter(p => p.identifier);

      const refProps = SqlHelper.getEmbeddedPropertyIds(propertyDef);
      let targetName, targetId;
      for (let x = 0; x < sources.lookup.length; x++) {

        const lookup = sources.lookup[x];
        const joinObj = sources.target[x];
        const attachObj = _.find(sources.next, lookup);

        let idx = 0;
        targetIdProps.forEach(prop => {
          const name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.em.nameResolver(), name, propertyDef, prop);
          delete joinObj[targetId];
        });
        joinObj[propertyDef.name] = attachObj;
      }
      return;
    } else if (propertyDef.hasConditions()) {

      for (let i = 0; i < sources.target.length; i++) {
        const target = sources.target[i];
        const lookup = sources.lookup[i];
        const results = _.filter(sources.next, s => lookup(s));

        if (propertyDef.isCollection()) {
          target[propertyDef.name] = results;
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
  private handleInlinePropertyPrefixObject(sources: IFindData, propertyDef: PropertyRef, classRef: ClassRef) {
    const targetProps = this.em.schema().getPropertiesFor(classRef.getClass());
    const hasId = targetProps.filter(p => p.identifier).length > 0;

    if (!hasId) {
      // is embedded in current data record
      for (const join of sources.next) {
        if (propertyDef.isCollection()) {
          throw new NotYetImplementedError();
        } else {
          const target = classRef.new();
          targetProps.forEach(prop => {
            const [id, name] = this.em.nameResolver().for(propertyDef.machineName, prop);
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


  async run(entityType: Function | string, findConditions: any = null, options?: IFindOptions):
    Promise<T[]> {
    this.c = await this.em.storageRef.connect();
    const opts = _.clone(options) || {};
    this.options = _.defaults(opts, {limit: 100, subLimit: 100});
    this.hookAbortCondition = _.get(options, 'hooks.abortCondition', this.hookAbortCondition);
    this.hookAfterEntity = _.get(options, 'hooks.afterEntity', this.hookAfterEntity);
    const entityDef = <EntityRef>ClassRef.get(entityType).getEntityRef();
    const result = await this.onEntity(entityDef, null, <IFindData>{
      next: null,
      condition: findConditions,
      options: options
    });
    await this.c.close();
    return result.next;
  }


}


