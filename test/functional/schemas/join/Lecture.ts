
import {Teacher} from './Teacher';

import {RBelongsTo} from './RBelongsTo';
import {From, Join, To} from '../../../../src/libs/descriptors/JoinDesc';
import {And, Eq, Key, Value} from '@allgemein/expressions';
import {Schema} from '../../../../src/libs/decorators/Schema';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Property} from '../../../../src/libs/decorators/Property';
import {Asc} from '../../../../src/libs/descriptors/OrderDesc';

@Schema({name: 'join'})
@Entity({name: 'veranstaltung'})
export class Lecture {

  @Property({type: 'number', auto: true})
  veranstid: number;

  @Property({
    type: Teacher, cardinality: 0,
    join: Join(RBelongsTo, [
        From(Eq('tabpk', Key('veranstid'))),
        To(Eq('pid', Key('ownerid')))
      ],
      And(
        Eq('ownertab', Value('personal')),
        Eq('tabelle', Value('veranstaltung'))),
      [Asc(Key('sortierung')), Asc(Key('beltoid'))])
  })
  persons: Teacher[];
}
