import {Room} from './Room';
import {Schema} from '../../../../src/libs/decorators/Schema';
import {PropertyOf} from '../../../../src/libs/decorators/PropertyOf';
import {Property} from '../../../../src/libs/decorators/Property';

@Schema({name: 'integrated_property'})
@PropertyOf('equipment', Room, {cardinality: 0})
export class Equipment {

  @Property({type: 'string'})
  label: string;

  @Property({type: 'number'})
  amount: number;

}
