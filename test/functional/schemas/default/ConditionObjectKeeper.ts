import {ConditionObjectHolder} from './ConditionObjectHolder';
import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';

import {And, Eq, Key, Value} from '@allgemein/expressions';

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
