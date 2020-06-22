import {Schema} from '../../../../src/libs/decorators/Schema';
import {CObject} from '../../../../src/libs/decorators/CObject';
import {Property} from '../../../../src/libs/decorators/Property';

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
