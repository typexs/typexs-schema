import {Entity, Property} from "../../../../src";
import {ConditionHolder} from "./ConditionHolder";
import {And, Eq, Key, Value} from "../../../../src/libs/descriptors/Conditions";
import {ConditionObjectHolder} from "./ConditionObjectHolder";

@Entity()
export class ConditionObjectKeeper {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({
    type: ConditionObjectHolder,
    cardinality: 0,
    cond: And(Eq('tableName', Value('condition_object_keeper')), Eq('tableId', Key('id')))
  })
  objects: ConditionObjectHolder[];

}
