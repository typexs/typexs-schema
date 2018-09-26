import {CObject, Property} from "../../../../src";
import {ConditionObjectHolder} from "./ConditionObjectHolder";
import {And, Eq, Key, Value} from "../../../../src/libs/descriptors/Conditions";

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
