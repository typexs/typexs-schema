import {Teacher} from './Teacher';

import {RBelongsTo} from './RBelongsTo';
import {From, Join, To} from '../../../../src/libs/descriptors/JoinDesc';
import {Asc, Entity, Property, Schema} from '../../../../src';
import {And, Eq, Key, Value} from 'commons-expressions';

@Schema({name: 'join'})
@Entity({name: 'simple_course'})
export class SimpleLecture {

  @Property({auto: true})
  veranstid: number;

  @Property()
  label: string;

  @Property({
    type: Teacher,
    join: Join(RBelongsTo, [
        From(Eq('tabpk', Key('veranstid'))),
        To(Eq('pid', Key('ownerid')))
      ],
      And(
        Eq('ownertab', Value('personal')),
        Eq('tabelle', Value('veranstaltung'))),
      [Asc(Key('sortierung')), Asc(Key('beltoid'))])
  })
  person: Teacher;
}
