import {PropertyOf} from '../../../../../src/libs/xsschema/decorators/PropertyOf';
import {Room} from './Room';
import {Property} from '../../../../../src/libs/xsschema/decorators/Property';


@PropertyOf('equipment', Room, {cardinality: 0})
export class Equipment {

  @Property({type:'string'})
  label:string;

  @Property({type:'number'})
  amount:number;

}
