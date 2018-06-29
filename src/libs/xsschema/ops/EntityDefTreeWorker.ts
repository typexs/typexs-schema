// TODO prevent circulations
import {NotYetImplementedError} from '../NotYetImplementedError';
import {XsEntityDef} from '../XsEntityDef';
import {XsPropertyDef} from '../XsPropertyDef';

export abstract class EntityDefTreeWorker {

  constructor() {
  }


  onEntityReference(entityDef: XsEntityDef, property: XsPropertyDef, objects: any[]): void {
    throw new NotYetImplementedError();
  }

  onPropertyReference(entityDef: XsEntityDef, property: XsPropertyDef, objects: any[]): void {
    throw new NotYetImplementedError();
  }

  onPropertyOfReference(entityDef: XsEntityDef, property: XsPropertyDef, objects: any[]):void {
    throw new NotYetImplementedError();
  }

  async walk(entityDef: XsEntityDef, objects: any[]) {

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


