import {Property} from '../../../../src/libs/decorators/Property';
import {CObject} from '../../../../src/libs/decorators/CObject';


@CObject({name: 'condition_object_holder'})
export class ConditionObjectHolder {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  tableName: string;

  @Property({type: 'number'})
  tableId: number;


}
