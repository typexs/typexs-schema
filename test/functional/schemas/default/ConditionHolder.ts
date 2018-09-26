import {Entity, Property} from "../../../../src";

@Entity()
export class ConditionHolder {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type:'string'})
  tableName: string;


  @Property({type:'number'})
  tableId: number;

}
