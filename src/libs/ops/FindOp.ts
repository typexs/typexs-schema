import {EntityManager} from '../EntityManager';
import {ClassRef} from '../ClassRef';
import {EntityDef} from '../EntityDef';

import {ConnectionWrapper, NotSupportedError} from 'typexs-base';

import {PropertyDef} from '../PropertyDef';
import {EntityDefTreeWorker} from './EntityDefTreeWorker';
import {XS_P_PROPERTY, XS_P_SEQ_NR, XS_P_TYPE} from '../Constants';

export class FindOp<T> extends EntityDefTreeWorker {

  readonly em: EntityManager;

  private c: ConnectionWrapper;

  constructor(em: EntityManager) {
    super();
    this.em = em;
  }


  async onEntityReference(entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]) {
    let propEntityDef = propertyDef.targetRef.getEntity();

   // let conditions: any[] = [];

    // parent and child must be saved till relations can be inserted
    //let objectIds: number[] = SchemaUtils.get('id', objects);
    let [, sourceTypeName] = this.em.nameResolver().forSource(XS_P_TYPE);
    let [, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);

    // fetch property data
    let queryBuilder = this.c.manager.getRepository(propertyDef.joinRef.getClass()).createQueryBuilder();
    for (let object of objects) {
      let condition: any = {};

      condition[sourceTypeName] = entityDef.name;
      // TODO revision ID
      entityDef.getPropertyDefIdentifier().forEach(x => {
        let [, sourceName] = this.em.nameResolver().forSource(x);
        condition[sourceName] = x.get(object);
      });
      queryBuilder.orWhere(Object.keys(condition).map(k => `${k} = '${condition[k]}'`).join(' AND '));
    }

    // TODO if revision support beachte dies an der stellle
    let results = await queryBuilder.orderBy(sourceSeqNrName, 'ASC').getMany();


    // fetch entity data
    queryBuilder = this.c.manager.getRepository(propEntityDef.object.getClass()).createQueryBuilder();
    for (let result of results) {
      // TODO revision support!
      let condition: any = {};
      entityDef.getPropertyDefIdentifier().forEach(x => {
        let [targetId, targetName] = this.em.nameResolver().forTarget(x);
        condition[x.name] = result[targetId] ? result[targetId] : null;
      });
      queryBuilder.orWhere(Object.keys(condition).map(k => `${k} = '${condition[k]}'`).join(' AND '));
    }

    let targets = await queryBuilder.getMany();

    targets = await this.loadEntityDef(propEntityDef, targets);

    for (let object of objects) {
      let condition: any = {};
      entityDef.getPropertyDefIdentifier().forEach(x => {
        let [sourceId, ] = this.em.nameResolver().forSource(x);
        condition[sourceId] = x.get(object);
      });
      let _results = _.remove(results, condition);

      let pIds = propEntityDef.getPropertyDefIdentifier().map(x => x.name);

      let objectTargets: any[] = [];
      _results.forEach(r => {
        let _cond: any = {};
        pIds.forEach(id => {
          let [targetId,] = this.em.nameResolver().forTarget( id);
          _cond[id] = r[targetId];
        });
        let entry = _.filter(targets, _cond);
        objectTargets.push(entry.shift());
      });

      if (propertyDef.isCollection()) {
        object[propertyDef.name] = objectTargets;
      } else {
        object[propertyDef.name] = objectTargets.length == 1 ? objectTargets.shift() : null;
      }
    }
  }


  async onPropertyReference(entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]) {
    let propClass = propertyDef.targetRef.getClass();
    await this._onPropertyRefGeneral(propClass, entityDef, propertyDef, objects);

  }


  async onPropertyOfReference(entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]) {
    let propertyClass = propertyDef.propertyRef.getClass();
    await this._onPropertyRefGeneral(propertyClass, entityDef, propertyDef, objects);
  }


  private async _onPropertyRefGeneral(propClass: Function, entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]) {
    let conditions: any[] = [];
    let storeClass = propertyDef.joinRef.getClass();

    // parent and child must be saved till relations can be inserted
    //let objectIds: number[] = SchemaUtils.get('id', objects);
    let [sourceTypeId, sourceTypeName] = this.em.nameResolver().forSource(XS_P_TYPE);
    let [sourceSeqNrId, sourceSeqNrName] = this.em.nameResolver().forSource(XS_P_SEQ_NR);


    let idProperties = entityDef.getPropertyDefIdentifier();

    let repo = this.c.manager.getRepository(storeClass.name);
    let queryBuilder = repo.createQueryBuilder();

    for (let object of objects) {
      let condition: any = {};
      condition[sourceTypeName] = entityDef.name;
      idProperties.forEach(x => {
        let [, sourceName] = this.em.nameResolver().forSource(x);
        condition[sourceName] = x.get(object);
      });
      queryBuilder.orWhere(Object.keys(condition).map(k => `${k} = '${condition[k]}'`).join(' AND '));
    }

    // TODO if revision support beachte dies an der stellle
    let results = await queryBuilder.orderBy(sourceSeqNrName, 'ASC').getMany();
    if(results.length == 0){
      return;
    }
    conditions = [];

    let subPropertyDefs = this.em.schemaDef.getPropertiesFor(propClass);
    for (let subPropertyDef of subPropertyDefs) {
      if (subPropertyDef.isInternal()) {
        if (subPropertyDef.isReference()) {
          if (subPropertyDef.isEntityReference()) {
            let targetEntity = subPropertyDef.targetRef.getEntity();
            let subIdProperties = targetEntity.getPropertyDefIdentifier();
            let repo = this.c.manager.getRepository(targetEntity.object.getClass());
            let queryBuilder = repo.createQueryBuilder();

            results.map(result => {
              let condition: any = {};
              subIdProperties.forEach(idProp => {
                let [targetId, targetName] = this.em.nameResolver().for(subPropertyDef.machineName(), idProp);
                condition[idProp.name] = result[targetId];
              });
              queryBuilder.orWhere(Object.keys(condition).map(k => `${k} = '${condition[k]}'`).join(' AND '));
            });

            let targets = await queryBuilder.getMany();
            targets = await this.loadEntityDef(targetEntity, targets);

            if(targets.length == 0){
              continue;
            }

            results.map(result => {
              let condition: any = {};
              subIdProperties.forEach(idProp => {
                let [targetId, targetName] = this.em.nameResolver().for(subPropertyDef.machineName(), idProp);
                condition[idProp.name] = result[targetId];
              });
              let subResults = _.filter(targets, condition);

              // cleanup
              delete result[sourceTypeId];
              delete result[sourceSeqNrId];

              subIdProperties.forEach(idProp => {
                let [targetId,] = this.em.nameResolver().for(subPropertyDef.machineName(), idProp);
                delete result[targetId];
              });


              if (subPropertyDef.isCollection()) {
                result[subPropertyDef.name] = subResults;
              } else {
                result[subPropertyDef.name] = subResults.length == 1 ? subResults.shift() : null;
              }
            });

          } else {
            throw new NotSupportedError('other then direct entity integration not allowed in property referencing ... ' + subPropertyDef.name);
          }
        }
      } else {
        throw new NotSupportedError('only internal properties allowed ' + subPropertyDef.name);
      }
    }

    objects.map(object => {
      let condition: any = {};
      idProperties.forEach(idProp => {
        let [targetId, targetName] = this.em.nameResolver().forSource(idProp);
        condition[targetId] = object[idProp.name];
      });
      let subResults = _.filter(results, condition);

      // cleanup
      subResults.map(sub => {
        [XS_P_TYPE,XS_P_SEQ_NR,XS_P_PROPERTY].forEach(prop => {
          let [sourceId,] = this.em.nameResolver().forSource(prop);
          delete sub[sourceId];
        });
        idProperties.map(idProp => {
          let [sourceId,] = this.em.nameResolver().forSource(idProp);
          delete sub[sourceId];
        });
      });

      if (propertyDef.isCollection()) {
        object[propertyDef.name] = subResults;
      } else {
        object[propertyDef.name] = subResults.length == 1 ? subResults.shift() : null;
      }
    });

  }

  private static conditionToQuery(condition:any):string{
    return Object.keys(condition).map(k => `${k} = '${condition[k]}'`).join(' AND ')
  }

  private async loadEntityDef<T>(entityName: string | EntityDef, objects: T[]): Promise<T[]> {
    if (objects.length > 0) {
      let entityDef: EntityDef = <EntityDef>entityName;
      if (_.isString(entityName)) {
        entityDef = this.em.schemaDef.getEntity(entityName);
      }
      await this.walk(entityDef, objects);
    }
    return objects;
  }


  async run(entityType: Function | string, findConditions: any = null, limit:number = 100): Promise<T[]> {
    let xsEntityDef = ClassRef.get(entityType).getEntity();
    this.c = await this.em.storageRef.connect();
    let qb = this.c.manager.getRepository(xsEntityDef.object.getClass()).createQueryBuilder();
    if(_.isArray(findConditions)){
      findConditions.forEach(c => {
        qb.orWhere(FindOp.conditionToQuery(c));
      })
    }else if(findConditions){
      qb.where(FindOp.conditionToQuery(findConditions));
    }
    xsEntityDef.getPropertyDefIdentifier().forEach(x => {
      qb.addOrderBy(x.storingName(),'ASC');
    })
    let results = <any[]>await qb.limit(limit).getMany();
    //let results = <any[]>await this.c.manager.find(xsEntityDef.object.getClass(), {where: findConditions});
    return this.loadEntityDef(xsEntityDef, results);
  }

}


