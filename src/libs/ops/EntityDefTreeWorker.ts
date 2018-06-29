// TODO prevent circulations
import {NotYetImplementedError} from 'typexs-base';
import {EntityDef} from '../EntityDef';
import {PropertyDef} from '../PropertyDef';

export abstract class EntityDefTreeWorker {

  constructor() {
  }


  onEntityReference(entityDef: EntityDef, property: PropertyDef, objects: any[]): void {
    throw new NotYetImplementedError();
  }

  onPropertyReference(entityDef: EntityDef, property: PropertyDef, objects: any[]): void {
    throw new NotYetImplementedError();
  }

  onPropertyOfReference(entityDef: EntityDef, property: PropertyDef, objects: any[]):void {
    throw new NotYetImplementedError();
  }

  async walk(entityDef: EntityDef, objects: any[]) {

    let properties = entityDef.getPropertyDefs();
    for (let propertyDef of properties) {
      if (propertyDef.isInternal()) {
        if (propertyDef.isReference()) {
          if (propertyDef.isEntityReference()) {
            await this.onEntityReference(entityDef, propertyDef, objects);
          } else {
            await this.onPropertyReference(entityDef, propertyDef, objects);
          }
        } else {
          // throw new NotYetImplementedError();
        }
      } else {
        await this.onPropertyOfReference(entityDef, propertyDef, objects);
        // throw new NotYetImplementedError();
      }
    }
  }


}


