import {UpdateDateColumn} from 'typeorm';
import {Schema} from '../../../../src/libs/decorators/Schema';
import {CObject} from '../../../../src/libs/decorators/CObject';
import {Property} from '../../../../src/libs/decorators/Property';

@Schema({name: 'join'})
@CObject({name: 'r_belongsto'})
export class RBelongsTo {

  @Property({type: 'number', auto: true})
  beltoid: number;

  @Property({type: 'string'})
  ownertab: string;

  @Property({type: 'number'})
  ownerid: number;

  @Property({type: 'string'})
  tabelle: string;

  @Property({type: 'number'})
  tabpk: number;

  // TODO mark as seqnr replacement
  @Property({type: 'number', nullable: true, sequence: true})
  sortierung: number = 0;

  @UpdateDateColumn()
  @Property({type: 'date', nullable: true})
  zeitstempel: Date;

}
