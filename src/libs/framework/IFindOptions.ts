import {EntityRef} from '../registry/EntityRef';
import {PropertyRef} from '../registry/PropertyRef';
import {IFindOptions as _IFindOptions} from '@typexs/base/libs/storage/framework/IFindOptions';

export interface IFindOptions extends _IFindOptions {

  /**
   * limit for queries for subelements, default will be 50
   */
  subLimit?: number;

  hooks?: {
    afterEntity?: (entityRef: EntityRef, entities: any[]) => void
    abortCondition?: (entityRef: EntityRef, propertyDef: PropertyRef, results: any[], op: any) => boolean
  };
}
