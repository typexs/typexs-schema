import {EntityRef} from '../registry/EntityRef';
import {PropertyRef} from '../registry/PropertyRef';

export interface IFindOptions {

  limit?: number;

  offset?: number;

  sort?: { [key: string]: 'asc' | 'desc' };

  /**
   * limit for queries for subelements, default will be 50
   */
  subLimit?: number;

  hooks?: {
    afterEntity?: (entityRef: EntityRef, entities: any[]) => void
    abortCondition?: (entityRef: EntityRef, propertyDef: PropertyRef, results: any[], op: any) => boolean
  };
}
