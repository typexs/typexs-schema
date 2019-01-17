import {And, Entity, Eq, Key, Property, Value} from "../../../../src";

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
