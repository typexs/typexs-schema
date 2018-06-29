import {Room} from './Room';

import {Property, PropertyOf} from "../../../../src";


@PropertyOf('equipment', Room, {cardinality: 0})
export class Equipment {

  @Property({type:'string'})
  label:string;

  @Property({type:'number'})
  amount:number;

}
