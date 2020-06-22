import {Schema} from '../../../../src/libs/decorators/Schema';
import {CObject} from '../../../../src/libs/decorators/CObject';
import {Property} from '../../../../src/libs/decorators/Property';

@Schema({name: 'role_permissions'})
@CObject({name: 'r_belongsto2'})
export class RBelongsTo2 {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  ownertab: string;

  @Property({type: 'number'})
  ownerid: number;

  @Property({type: 'string'})
  reftab: string;

  @Property({type: 'number'})
  refid: number;

  // TODO mark as seqnr replacement
  @Property({type: 'number', nullable: true, sequence: true})
  sort: number = 0;

  @Property({type: 'date:updated', nullable: true})
  updated_at: Date;

}
