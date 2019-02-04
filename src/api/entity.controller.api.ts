import {EntityController, EntityRef} from "..";
import {IEntityControllerApi} from "./IEntityControllerApi";

export class EntityControllerApi implements IEntityControllerApi {

  beforeEntityBuild?(entityDef: EntityRef, data: any | any[], user?: any, controller?: EntityController): void {
    return null;
  }

  afterEntityBuild?(entityDef: EntityRef, data: any | any[], user?: any, controller?: EntityController): void {
    return null;
  }
}
