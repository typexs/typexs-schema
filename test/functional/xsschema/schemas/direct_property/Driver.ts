import {Property} from '../../../../../src/libs/xsschema/decorators/Property';
import {Address} from 'cluster';
import {Skil} from './Skil';


export class Driver {

  @Property({type: 'number'})
  age: number;

  @Property({type: 'string'})
  nickName: string;

  @Property({targetClass: Skil})
  skill: Skil;


}
