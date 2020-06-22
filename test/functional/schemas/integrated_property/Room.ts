import {Schema} from '../../../../src/libs/decorators/Schema';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Property} from '../../../../src/libs/decorators/Property';


@Schema({name: 'integrated_property'})
@Entity()
export class Room {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'number'})
  number: number;

}
