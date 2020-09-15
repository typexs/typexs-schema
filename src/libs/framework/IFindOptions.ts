import {IFindOptions as _IFindOptions} from '@typexs/base/libs/storage/framework/IFindOptions';
import {IFindOp} from '@typexs/base/libs/storage/framework/IFindOp';
import {IEntityRef, IPropertyRef} from 'commons-schema-api/browser';

export interface IFindOptions extends _IFindOptions {

  /**
   * limit for queries for subelements, default will be 50
   */
  subLimit?: number;

  hooks?: {
    afterEntity?: (entityRef: IEntityRef, entities: any[]) => void
    abortCondition?: (entityRef: IEntityRef, propertyDef: IPropertyRef, results: any[], op: IFindOp<any>) => boolean
  };
}
