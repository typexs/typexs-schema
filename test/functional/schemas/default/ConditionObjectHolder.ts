import {CObject, Property} from "../../../../src";

@CObject({name: 'condition_object_holder'})
export class ConditionObjectHolder {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type:'string'})
  tableName: string;

  @Property({type:'number'})
  tableId: number;



}
