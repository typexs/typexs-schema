import {PropertyDef} from "../PropertyDef";

export interface INameResolver {


  forTarget(property: PropertyDef | string, prefix?: string): [string, string];

  forSource(property: PropertyDef | string, prefix?: string): [string, string];

  /**
   * Id is the key for an object, name is the storeage value
   */
  for(prefix: string, property: PropertyDef | string): [string, string];
}
