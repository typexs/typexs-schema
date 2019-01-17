import {And, Asc, Entity, Eq, Key, Property, Schema, Value} from "../../../../src";
import {Teacher} from "./Teacher";

import {RBelongsTo} from "./RBelongsTo";
import {From, Join, To} from "../../../../src/libs/descriptors/Join";

@Schema({name: 'join'})
@Entity({name: 'veranstaltung'})
export class Lecture {

  @Property({type: 'number', auto: true})
  veranstid: number;

  @Property({
    targetClass: Teacher, cardinality: 0,
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
