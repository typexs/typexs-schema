import {EntityRef} from "../..";

export interface IFindOptions {

  limit?: number;

  offset?: number;

  sort?: { [key: string]: 'asc' | 'desc' }

  /**
   * limit for queries for subelements, default will be 50
   */
  subLimit?: number;

  hooks?: {
    afterEntity?: (entityDef: EntityRef, entities: any[]) => void
    abortCondition?: (entity: any[]) => boolean
  };
}
