import {Schema} from '../../../../src/libs/decorators/Schema';
import {CObject} from '../../../../src/libs/decorators/CObject';
import {Property} from '../../../../src/libs/decorators/Property';

@Schema({name: 'join'})
@CObject({name: 'ident'})
export class Identity {
  @Property({type: 'number', auto: true})
  identnr: number;

  @Property()
  name: string;

}
