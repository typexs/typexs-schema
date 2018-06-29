
import {Address} from 'cluster';
import {Skil} from './Skil';
import {Entity, Property,Schema} from "../../../../src";


export class Driver {

  @Property({type: 'number'})
  age: number;

  @Property({type: 'string'})
  nickName: string;

  @Property({targetClass: Skil})
  skill: Skil;


}
