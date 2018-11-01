import {IPropertyMetadata} from "./IPropertyMetadata";


export interface IEntityMetadata {
  id: string,
  name: string,
  type: string,
  machineName: string,
  options: any,
  schema: string,
  properties: IPropertyMetadata[]
}
