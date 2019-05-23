import {EntityDefTreeWorker} from '../EntityDefTreeWorker';
import {IDeleteOp} from '../IDeleteOp';
import {EntityRef} from '../../registry/EntityRef';
import {PropertyRef} from '../../registry/PropertyRef';

import {IDataExchange} from '../IDataExchange';
import {EntityController} from '../../EntityController';
import {ConnectionWrapper} from '@typexs/base';
import * as _ from '../../LoDash';
import {XS_P_PREV_ID} from '../../Constants';
import {ClassRef} from 'commons-schema-api';


export interface IDeleteData extends IDataExchange<any[]> {

}

export class SqlDeleteOp<T> extends EntityDefTreeWorker implements IDeleteOp<T> {

  readonly em: EntityController;

  private c: ConnectionWrapper;

  private objects: any[] = [];

  private entityDepth = 0;


  constructor(em: EntityController) {
    super();
    this.em = em;
  }

  visitDataProperty(propertyDef: PropertyRef, sourceDef: EntityRef | ClassRef, sources: IDeleteData, targets: IDeleteData): void {
  }

  async visitEntity(entityDef: EntityRef, propertyDef: PropertyRef, sources: IDeleteData): Promise<IDeleteData> {
    if (this.entityDepth === 0) {
      const ids = entityDef.resolveIds(sources.next);
      await this.c.manager.remove(entityDef.getClass(), sources.next);
      sources.next.map((v: any, i: number) => {
        v[XS_P_PREV_ID] = ids[i];
      });
    }
    return sources;
  }


  async leaveEntity(entityDef: EntityRef, propertyDef: PropertyRef, sources: IDeleteData): Promise<IDeleteData> {
    // todo delete
    return sources;
  }

  async visitEntityReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, entityDef: EntityRef, sources: IDeleteData): Promise<IDeleteData> {
    this.entityDepth++;
    return sources;
  }

  leaveEntityReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, entityDef: EntityRef, sources: IDeleteData, visitResult: IDeleteData): Promise<IDeleteData> {
    this.entityDepth--;
    return null;
  }


  visitExternalReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: IDeleteData): Promise<IDeleteData> {
    return null;
  }

  leaveExternalReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: IDeleteData): Promise<IDeleteData> {
    return null;
  }


  visitObjectReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: IDeleteData): Promise<IDeleteData> {
    return undefined;
  }

  leaveObjectReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef, classRef: ClassRef, sources: IDeleteData): Promise<IDeleteData> {
    return undefined;
  }


  private prepare(object: T | T[]): T[] {
    let objs: T[] = [];
    if (_.isArray(object)) {
      objs = object;
    } else {
      objs.push(object);
    }
    return objs;
  }


  private async deleteByEntityDef<T>(entityName: string | EntityRef, objects: T[]): Promise<T[]> {
    const entityDef = _.isString(entityName) ? this.em.schema().getEntity(entityName) : entityName;
    return await this.walk(entityDef, objects);
  }


  async run(object: T | T[]): Promise<T | T[]> {
    const isArray = _.isArray(object);

    this.objects = this.prepare(object);

    const resolveByEntityDef = EntityController.resolveByEntityDef(this.objects);
    const entityNames = Object.keys(resolveByEntityDef);
    this.c = await this.em.storageRef.connect();

    // start transaction, got to leafs and save
    await this.c.manager.transaction(async em => {
      const promises = [];
      for (const entityName of entityNames) {
        const p = this.deleteByEntityDef(entityName, resolveByEntityDef[entityName]);
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
