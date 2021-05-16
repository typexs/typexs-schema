import {ConditionHolder} from './ConditionHolder';
import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';

import {And, Eq, Key, Value} from '@allgemein/expressions';


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
