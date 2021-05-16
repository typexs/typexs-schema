import {Eq, Key, Value} from '@allgemein/expressions';

import {Identity} from './Identity';
import {IdentityRole} from './IdentityRole';
import {Schema} from '../../../../src/libs/decorators/Schema';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Property} from '../../../../src/libs/decorators/Property';
import {From, Join, To} from '../../../../src/libs/descriptors/JoinDesc';

@Schema({name: 'join'})
@Entity({name: 'bew'})
export class Candidate {

  @Property({type: 'number', name: 'bewnr', id: true})
  bewnr: number;

  @Property({type: 'string', name: 'nachname', length: 35})
  nachname: string;

  @Property({
    type: Identity,
    join: Join(IdentityRole,
      [From(Eq('verbindung_integer', Key('bewnr'))),
        To(Eq('identnr', Key('identnr')))],
      Eq('rolle', Value('B'))
    )
  })
  identity: Identity;


}
