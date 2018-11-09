import {EntityDefTreeWorker} from "../EntityDefTreeWorker";
import {IDeleteOp} from "../IDeleteOp";
import {EntityDef} from "../../registry/EntityDef";
import {PropertyDef} from "../../registry/PropertyDef";
import {ClassRef} from "../../registry/ClassRef";
import {IDataExchange} from "../IDataExchange";
import {EntityController} from "../../EntityController";
import {ConnectionWrapper} from "typexs-base";
import * as _ from "../../LoDash";
import {XS_P_PREV_ID} from "../../Constants";


export interface IDeleteData extends IDataExchange<any[]> {

}

export class SqlDeleteOp<T> extends EntityDefTreeWorker implements IDeleteOp<T> {

  readonly em: EntityController;

  private c: ConnectionWrapper;

  private objects: any[] = [];

  private entityDepth: number = 0;


  constructor(em: EntityController) {
    super();
    this.em = em;
  }

  visitDataProperty(propertyDef: PropertyDef, sourceDef: EntityDef | ClassRef, sources: IDeleteData, targets: IDeleteData): void {
  }

  async visitEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: IDeleteData): Promise<IDeleteData> {
    if (this.entityDepth === 0) {
      let ids = entityDef.resolveIds(sources.next);
      await this.c.manager.remove(entityDef.getClass(), sources.next);
      sources.next.map((v: any, i: number) => {
        v[XS_P_PREV_ID] = ids[i]
      });
    }
    return sources;
  }


  async leaveEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: IDeleteData): Promise<IDeleteData> {
    // todo delete
    return sources;
  }

  async visitEntityReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources: IDeleteData): Promise<IDeleteData> {
    this.entityDepth++;
    return sources;
  }

  leaveEntityReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources: IDeleteData, visitResult: IDeleteData): Promise<IDeleteData> {
    this.entityDepth--;
    return null;
  }


  visitExternalReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IDeleteData): Promise<IDeleteData> {
    return null;
  }

  leaveExternalReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IDeleteData): Promise<IDeleteData> {
    return null;
  }


  visitObjectReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IDeleteData): Promise<IDeleteData> {
    return undefined;
  }

  leaveObjectReference(sourceDef: EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IDeleteData): Promise<IDeleteData> {
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


  private async deleteByEntityDef<T>(entityName: string | EntityDef, objects: T[]): Promise<T[]> {
    let entityDef = _.isString(entityName) ? this.em.schema().getEntity(entityName) : entityName;
    return await this.walk(entityDef, objects);
  }


  async run(object: T | T[]): Promise<T | T[]> {
    let isArray = _.isArray(object);

    this.objects = this.prepare(object);

    let resolveByEntityDef = EntityController.resolveByEntityDef(this.objects);
    let entityNames = Object.keys(resolveByEntityDef);
    this.c = await this.em.storageRef.connect();

    // start transaction, got to leafs and save
    await this.c.manager.transaction(async em => {
      let promises = [];
      for (let entityName of entityNames) {
        let p = this.deleteByEntityDef(entityName, resolveByEntityDef[entityName]);
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
