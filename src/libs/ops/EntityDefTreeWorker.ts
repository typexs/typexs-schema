// TODO prevent circulations
import {NotYetImplementedError} from 'typexs-base';
import {EntityDef} from '../EntityDef';
import {PropertyDef} from '../PropertyDef';
import {ClassRef} from "../ClassRef";
import {EntityRegistry} from "../EntityRegistry";
import _ = require("lodash");

export interface IQEntry {
  def: EntityDef | PropertyDef | ClassRef,
  refer?: PropertyDef
  sources?: IDataExchange<any>,
  result?: IDataExchange<any>
}


export interface IDataExchange<T> {
  next: T,
  abort?: boolean
}

export abstract class EntityDefTreeWorker {

  context: any;

  sourceDef: EntityDef | PropertyDef;

  propertyDef: PropertyDef;

  queue: IQEntry[] = [];

  sourceObjects: any[];

  cache: any[] = [];

  public constructor() {
  }


  clear() {
    this.queue = [];
    this.cache = [];
  }

  isDone(o: any) {
    return this.cache.indexOf(o) != -1;
  }

  done(o: any) {
    if (!this.isDone(o)) {
      this.cache.push(o);
    }

  }

  abstract visitEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: IDataExchange<any>): Promise<IDataExchange<any>>;

  abstract leaveEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: IDataExchange<any>): Promise<IDataExchange<any>>;


  protected async onEntity(entityDef: EntityDef, referPropertyDef?: PropertyDef, sources?: IDataExchange<any>): Promise<IDataExchange<any>> {
    let def: IQEntry = {def: entityDef, sources: sources, refer: referPropertyDef};
    this.queue.push(def);
    def.result = await this.visitEntity(entityDef, referPropertyDef, sources);
    if (!(_.has(def.result, 'abort') && def.result.abort)) {
      let properties = entityDef.getPropertyDefs();
      await this.walkProperties(properties, def);
    }
    def.result = await this.leaveEntity(entityDef, referPropertyDef, def.result);
    this.queue.pop();

    return def.result;
  }


  private async onInternalProperty(propertyDef: PropertyDef, previous: IQEntry): Promise<void> {
    if (propertyDef.isReference()) {
      if (propertyDef.isEntityReference()) {
        await this.onEntityReference(propertyDef, previous);
      } else {
        await this.onObjectReference(propertyDef, previous);
      }
    } else {
      await this.onDataProperty(propertyDef, previous);
    }
  }


  abstract visitDataProperty(propertyDef: PropertyDef, sourceDef: PropertyDef | EntityDef | ClassRef, sources: IDataExchange<any>, targets: IDataExchange<any>): void;

  onDataProperty(propertyDef: PropertyDef, previous: IQEntry) {
    this.visitDataProperty(propertyDef, previous.def, previous.sources, previous.result);
  }


  abstract visitEntityReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources: IDataExchange<any>): Promise<IDataExchange<any>>;

  abstract leaveEntityReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources: IDataExchange<any>, visitResult: IDataExchange<any>): Promise<IDataExchange<any>>;


  async onEntityReference(property: PropertyDef, previous: IQEntry): Promise<void> {
    let entityDef = property.getEntity();

    let visitResult = await this.visitEntityReference(previous.def, property, entityDef, previous.result);
    let result = null;
    if (!(_.has(visitResult, 'abort') && visitResult.abort)) {
      result = await this.onEntity(entityDef, property, visitResult);
    } else {
      result = visitResult;
    }
    await this.leaveEntityReference(previous.def, property, entityDef, result, visitResult);

    // return def.result;
  }


  abstract visitObjectReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IDataExchange<any>): Promise<IDataExchange<any>>;

  abstract leaveObjectReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IDataExchange<any>): Promise<IDataExchange<any>>;


  private async onObjectReference(property: PropertyDef, previous: IQEntry): Promise<void> {
    let classDef = property.targetRef;
    let def: IQEntry = {def: classDef, sources: previous.result, refer: property};
    this.queue.push(def);
    def.result = await this.visitObjectReference(previous.def, property, classDef, previous.result);
    if (!(_.has(def.result, 'abort') && def.result.abort)) {
      let properties = EntityRegistry.getPropertyDefsFor(classDef);
      await this.walkProperties(properties, def);
    }
    def.result = await this.leaveObjectReference(previous.def, property, classDef, def.result);
    this.queue.pop();
  }


  abstract visitExternalReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IDataExchange<any>): Promise<IDataExchange<any>>;

  abstract leaveExternalReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources: IDataExchange<any>): Promise<IDataExchange<any>>;

  private async onExternalProperty(property: PropertyDef, previous: IQEntry): Promise<void> {
    let classDef = property.propertyRef;
    let def: IQEntry = {def: classDef, sources: previous.result, refer: property};
    this.queue.push(def);
    def.result = await this.visitExternalReference(previous.def, property, classDef, previous.result);
    if (!(_.has(def.result, 'abort') && def.result.abort)) {
      let properties = EntityRegistry.getPropertyDefsFor(classDef);
      await this.walkProperties(properties, def);
    }
    def.result = await this.leaveExternalReference(previous.def, property, classDef, def.result);
    this.queue.pop();
  }


  async walk(entityDef: EntityDef, sources?: any[]): Promise<any> {
    let result = await this.onEntity(entityDef, null, {next: sources});
    return result.next;
  }


  async walkProperties(properties: PropertyDef[], previous: IQEntry) {
    for (let propertyDef of properties) {
      await this.onProperty(propertyDef, previous);
    }
  }


  private async onProperty(propertyDef: PropertyDef, previous: IQEntry): Promise<any> {
    this.queue.push({def: propertyDef});
    let res: any = null;
    if (propertyDef.isInternal()) {
      res = await this.onInternalProperty(propertyDef, previous);
    } else {
      // property is declared externally
      res = await this.onExternalProperty(propertyDef, previous);
    }
    this.queue.pop();
    return res;
  }

}


