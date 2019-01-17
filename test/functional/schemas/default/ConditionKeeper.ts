import {And, Entity, Eq, Key, Property, Value} from "../../../../src";
import {ConditionHolder} from "./ConditionHolder";


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
