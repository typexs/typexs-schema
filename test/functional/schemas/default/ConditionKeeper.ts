
import {ConditionHolder} from "./ConditionHolder";
import {Entity, Property} from "../../../../src";
import {And, Eq, Key, Value} from "commons-expressions";


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
