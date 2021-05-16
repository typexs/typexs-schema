import {ConditionObjectHolder} from './ConditionObjectHolder';
import {Property} from '../../../../src/libs/decorators/Property';
import {And, Eq, Key, Value} from '@allgemein/expressions';
import {CObject} from '../../../../src/libs/decorators/CObject';


@CObject({name: 'condition_obj_keeper'})
export class ConditionObjKeeper {

  @Property({type: 'number', auto: true})
  id: number;


  @Property({
    type: ConditionObjectHolder,
    cardinality: 0,
    cond: And(Eq('tableName', Value('condition_object_keeper')), Eq('tableId', Key('id')))
  })
  objects: ConditionObjectHolder[];

}
