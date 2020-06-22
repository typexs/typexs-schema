import {Schema} from '../../../../src/libs/decorators/Schema';
import {CObject} from '../../../../src/libs/decorators/CObject';
import {Property} from '../../../../src/libs/decorators/Property';

@Schema({name: 'join'})
@CObject({name: 'identroll'})
export class IdentityRole {
  @Property({type: 'number', name: 'identnr', id: true})
  identnr: number;
  @Property({type: 'string', name: 'rolle', length: 1, id: true})
  rolle: string;
  @Property({type: 'number', name: 'verbindung_integer', id: true})
  verbindung_integer: number;
  @Property({type: 'string', name: 'verbindung_char', length: 50, nullable: true})
  verbindung_char: string;
  @Property({type: 'string', name: 'anschrkz', length: 1, nullable: true})
  anschrkz: string;
}
