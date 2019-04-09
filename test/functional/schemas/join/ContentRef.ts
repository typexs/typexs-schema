import {CObject, Property, Schema} from "../../../../src";

@Schema({name: 'join'})
@CObject({name: 'r_blobs'})
export class ContentRef {

  @Property({type: 'number', auto: true})
  rblobid: number;

  @Property({type: 'string'})
  tableName: string;

  @Property({type: 'number'})
  tableId: number;

  @Property({type: 'number', nullable: true})
  blobid: number;

}
