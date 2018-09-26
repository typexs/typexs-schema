import {Entity, Property} from "../../../../src";
import {ConditionHolder} from "./ConditionHolder";
import {And, Eq, Key, Value} from "../../../../src/libs/descriptors/Conditions";

@Entity()
export class ConditionKeeper {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({
    type: ConditionHolder,
    cardinality: 0,
    cond: And(Eq('tableName', Value('condition_keeper')), Eq('tableId', Key('id')))
  })
  holders: ConditionHolder[];

}
