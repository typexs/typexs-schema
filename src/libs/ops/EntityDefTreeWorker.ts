// TODO prevent circulations
import {NotYetImplementedError} from 'typexs-base';
import {EntityDef} from '../EntityDef';
import {PropertyDef} from '../PropertyDef';

export interface IQEntry {
  def: EntityDef | PropertyDef,
  sources?: any[],
  result?: any[]
}

export abstract class EntityDefTreeWorker {

  context: any;

  sourceDef: EntityDef | PropertyDef;

  propertyDef: PropertyDef;

  queue: IQEntry[];

  sourceObjects: any[];

  constructor() {
  }


  /*
    async walk(entityDef: EntityDef, objects: any[]) {

      let properties = entityDef.getPropertyDefs();
      for (let propertyDef of properties) {
        if (propertyDef.isInternal()) {
          if (propertyDef.isReference()) {
            if (propertyDef.isEntityReference()) {
              await this.onEntityReference(entityDef, propertyDef, objects);
            } else {
              await this.onObjectReference(entityDef, propertyDef, objects);
            }
          } else {
            // throw new NotYetImplementedError();
          }
        } else {
          await this.onExternalProperty(entityDef, propertyDef, objects);
          // throw new NotYetImplementedError();
        }
      }
    }

    */

  abstract visitEntity(entityDef: EntityDef, objects?: any[]): Promise<any>;


  abstract visitDataProperty(propertyDef:PropertyDef, sourceDef: PropertyDef | EntityDef, sources?:any, targets?:any):void;


  private onExternalProperty(property: PropertyDef,  previous: IQEntry): Promise<any> {
    throw new NotYetImplementedError();
  }


  private async onInternalProperty(propertyDef: PropertyDef,  previous: IQEntry): Promise<any> {
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



  onDataProperty( propertyDef: PropertyDef,  previous: IQEntry) {
    this.visitDataProperty(propertyDef, previous.def, previous.sources, previous.result);
  }

  onEntityReference(property: PropertyDef,  previous: IQEntry): Promise<any> {
    throw new NotYetImplementedError();
  }

  onObjectReference(property: PropertyDef,  previous: IQEntry): Promise<any> {
    throw new NotYetImplementedError();
  }


  async walk(entityDef: EntityDef, sources?: any[]): Promise<any> {
    this.sourceObjects = sources;
    let def: IQEntry = {def: entityDef,sources:sources};
    this.queue.push(def);
    def.result = await this.visitEntity(entityDef, sources);
    let properties = entityDef.getPropertyDefs();
    await this.walkProperties(properties, def);
    this.queue.pop();
    return def.result;
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


