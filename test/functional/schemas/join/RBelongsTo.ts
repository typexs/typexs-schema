import {UpdateDateColumn} from "typeorm";
import {CObject, Property, Schema} from "../../../../src";

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
