import {EntityController} from '../libs/EntityController';
import {IEntityControllerApi} from './IEntityControllerApi';
import {EntityRef} from '../libs/registry/EntityRef';

export class EntityControllerApi implements IEntityControllerApi {

  beforeEntityBuild?(entityDef: EntityRef, data: any | any[], user?: any, controller?: EntityController): void {
    return null;
  }

  afterEntityBuild?(entityDef: EntityRef, data: any | any[], user?: any, controller?: EntityController): void {
    return null;
  }
}
