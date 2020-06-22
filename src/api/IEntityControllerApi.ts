import {EntityRef} from '../libs/registry/EntityRef';
import {EntityController} from '../libs/EntityController';

export interface IEntityControllerApi {

  beforeEntityBuild?(entityDef: EntityRef, data: any | any[], user?: any, controller?: EntityController): void;

  afterEntityBuild?(entityDef: EntityRef, data: any | any[], user?: any, controller?: EntityController): void;
}
