import {EntityDef} from "../..";

export interface IFindOptions {
  limit?: number;
  offset?: number;
  sort?: { [key: string]: 'asc' | 'desc' }
  hooks?: {
    afterEntity?: (entityDef: EntityDef, entities: any[]) => void
    abortCondition?: (entity: any[]) => boolean
  };
}
