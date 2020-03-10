import {Eq, Key, Value} from 'commons-expressions/browser';
import {Entity, From, Join, Property, Schema, To} from '../../../../src';
import {Identity} from './Identity';
import {IdentityRole} from './IdentityRole';

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
