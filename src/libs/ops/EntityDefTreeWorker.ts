// TODO prevent circulations
import {NotYetImplementedError} from 'typexs-base';
import {EntityDef} from '../EntityDef';
import {PropertyDef} from '../PropertyDef';
import {ClassRef} from "../ClassRef";
import {EntityRegistry} from "../EntityRegistry";

export interface IQEntry {
  def: EntityDef | PropertyDef | ClassRef,
  refer?: PropertyDef
  sources?: any[],
  result?: any[]
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


  clear(){
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

  abstract visitEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: any): Promise<any>;

  private async onEntity(entityDef: EntityDef, referPropertyDef?: PropertyDef, sources?: any) {
    let def: IQEntry = {def: entityDef, sources: sources, refer: referPropertyDef};
    this.queue.push(def);
    def.result = await this.visitEntity(entityDef, referPropertyDef, sources);
    let properties = entityDef.getPropertyDefs();
    await this.walkProperties(properties, def);
    this.queue.pop();

    return def.result;
  }


  private async onInternalProperty(propertyDef: PropertyDef, previous: IQEntry): Promise<any> {
    if (propertyDef.isReference()) {
      if (propertyDef.isEntityReference()) {
        return await this.onEntityReference(propertyDef, previous);
      } else {
        return await this.onObjectReference(propertyDef, previous);
      }
    } else {
      return await this.onDataProperty(propertyDef, previous);
    }
  }


  abstract visitDataProperty(propertyDef: PropertyDef, sourceDef: PropertyDef | EntityDef | ClassRef, sources?: any, targets?: any): void;

  onDataProperty(propertyDef: PropertyDef, previous: IQEntry) {
    this.visitDataProperty(propertyDef, previous.def, previous.sources, previous.result);
  }


  abstract visitEntityReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources?: any, targets?: any): Promise<any>;

  async onEntityReference(property: PropertyDef, previous: IQEntry): Promise<any> {
    let entityDef = property.getEntity();

    let result = await this.onEntity(entityDef, property, previous.result);
    await this.visitEntityReference(previous.def, property, entityDef, previous.result, result);

    // return def.result;
  }


  abstract visitObjectReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources?: any): Promise<any>;

  private async onObjectReference(property: PropertyDef, previous: IQEntry): Promise<any> {
    let classDef = property.targetRef;
    let def: IQEntry = {def: classDef, sources: previous.result, refer: property};
    this.queue.push(def);
    def.result = await this.visitObjectReference(previous.def, property, classDef, previous.result);
    let properties = EntityRegistry.getPropertyDefsFor(classDef);
    await this.walkProperties(properties, def);
    this.queue.pop();
    return def.result;
  }


  abstract visitExternalReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources?: any): Promise<any>;

  private async onExternalProperty(property: PropertyDef, previous: IQEntry): Promise<any> {
    let classDef = property.propertyRef;
    let def: IQEntry = {def: classDef, sources: previous.result, refer: property};
    this.queue.push(def);
    def.result = await this.visitExternalReference(previous.def, property, classDef, previous.result);
    let properties = EntityRegistry.getPropertyDefsFor(classDef);
    await this.walkProperties(properties, def);
    this.queue.pop();
    return def.result;
    // throw new NotYetImplementedError();
  }


  async walk(entityDef: EntityDef, sources?: any[]): Promise<any> {
    return await this.onEntity(entityDef, null, sources);
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


