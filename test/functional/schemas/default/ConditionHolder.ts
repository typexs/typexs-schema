import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';


@Entity()
export class ConditionHolder {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  tableName: string;


  @Property({type: 'number'})
  tableId: number;

}
