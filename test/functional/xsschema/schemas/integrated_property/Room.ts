import {Entity} from '../../../../../src/libs/xsschema/decorators/Entity';
import {Property} from '../../../../../src/libs/xsschema/decorators/Property';
import {Schema} from '../../../../../src/libs/xsschema/decorators/Schema';

@Schema({name:'integrated_property'})
@Entity()
export class Room {

  @Property({type: 'number', auto: true})
  id: number;

}
