
import {ConditionObjectHolder} from "./ConditionObjectHolder";
import {CObject, Property} from "../../../../src";
import {And, Eq, Key, Value} from "commons-expressions";


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
