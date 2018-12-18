import {EntityController, EntityDef} from "..";
import {IEntityControllerApi} from "./IEntityControllerApi";

export class EntityControllerApi implements IEntityControllerApi {

  prepareEntityData(entityDef: EntityDef, data: any | any[], user: any, controller: EntityController):void {
    return null;
  }
}
