import {EntityController, EntityRef} from "..";

export interface IEntityControllerApi {

  beforeEntityBuild?(entityDef: EntityRef, data: any | any[], user?: any, controller?: EntityController): void;

  afterEntityBuild?(entityDef: EntityRef, data: any | any[], user?: any, controller?: EntityController): void;
}
