import {EntityController, EntityDef} from "..";

export interface IEntityControllerApi {
  prepareEntityData(entityDef: EntityDef, data: any | any[], user: any, controller: EntityController):void;
}
