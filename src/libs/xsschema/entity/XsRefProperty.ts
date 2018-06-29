import {Index,Column, Entity, PrimaryColumn} from 'typeorm';

@Entity('p_relations')
export class XsRefProperty {


  @PrimaryColumn('integer')
  source_id: number;

  @PrimaryColumn('integer')
  source_rev_id: number = 0;

  @PrimaryColumn({type:'varchar',length:64})
  source_type: string;

  @PrimaryColumn('text')
  source_property: string;

  @PrimaryColumn('integer')
  source_seqnr: number = 0;

  @Index()
  @Column('integer')
  target_id: number;

  @Index()
  @Column('integer',{nullable:true})
  target_rev_id: number = 0;

  @Index()
  @Column({type:'varchar',length:64})
  target_type: string;
}
