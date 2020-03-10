import {CObject, Property, Schema} from '../../../../src';

@Schema({name: 'join'})
@CObject({name: 'ident'})
export class Identity {
  @Property({type: 'number', auto: true})
  identnr: number;

  @Property()
  name: string;

}
