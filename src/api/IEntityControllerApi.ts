import {EntityController, EntityDef} from "..";

export interface IEntityControllerApi {
  beforeEntityBuild?(entityDef: EntityDef, data: any | any[], user?: any, controller?: EntityController):void;
  afterEntityBuild?(entityDef: EntityDef, data: any | any[], user?: any, controller?: EntityController):void;
}
