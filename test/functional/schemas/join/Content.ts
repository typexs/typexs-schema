import {Schema} from '../../../../src/libs/decorators/Schema';
import {CObject} from '../../../../src/libs/decorators/CObject';
import {Property} from '../../../../src/libs/decorators/Property';

@Schema({name: 'join'})
@CObject({name: 'blobs'})
export class Content{

  @Property({type: 'number', auto: true})
  blobid: number;

  @Property({type: 'string'})
  text: string;
}
