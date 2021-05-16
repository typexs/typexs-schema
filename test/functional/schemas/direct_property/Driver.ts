import {Skil} from './Skil';
import {Schema} from '../../../../src/libs/decorators/Schema';
import {Property} from '../../../../src/libs/decorators/Property';

@Schema({name: 'direct_property'})
export class Driver {

  @Property({type: 'number'})
  age: number;

  @Property({type: 'string'})
  nickName: string;

  @Property({type: Skil})
  skill: Skil;


}
