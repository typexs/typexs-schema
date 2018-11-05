import {IClassRefMetadata} from "./IClassRefMetadata";

export interface IPropertyMetadata {
  id: string,
  name: string,
  type: string,
  machineName: string,
  options: any,
  schema: string,
  entityName: string,
  label: string,
  dataType?: string,
  generated: boolean,
  identifier: boolean
  cardinality: number,
  targetRef?: IClassRefMetadata,
  propertyRef?: IClassRefMetadata
}
