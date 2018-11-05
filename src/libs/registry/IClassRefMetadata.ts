import {IPropertyMetadata} from "./IPropertyMetadata";

export interface IClassRefMetadata {

  schema: string | string[]

  className: string,

  isEntity: boolean,

  options: any,

  properties?: IPropertyMetadata[]

}
