import {EntityRef} from "../..";

export interface IFindOptions {
  limit?: number;
  offset?: number;
  sort?: { [key: string]: 'asc' | 'desc' }
  hooks?: {
    afterEntity?: (entityDef: EntityRef, entities: any[]) => void
    abortCondition?: (entity: any[]) => boolean
  };
}
