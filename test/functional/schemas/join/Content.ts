import {CObject, Property, Schema} from "../../../../src";

@Schema({name: 'join'})
@CObject({name: 'blobs'})
export class Content{

  @Property({type: 'number', auto: true})
  blobid: number;

  @Property({type: 'string'})
  text: string;
}
