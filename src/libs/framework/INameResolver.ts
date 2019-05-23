import {PropertyRef} from '../registry/PropertyRef';

export interface INameResolver {


  forTarget(property: PropertyRef | string, prefix?: string): [string, string];

  forSource(property: PropertyRef | string, prefix?: string): [string, string];

  /**
   * Id is the key for an object, name is the storeage value
   */
  for(prefix: string | PropertyRef, property?: PropertyRef | string): [string, string];
}
