import {Schema} from '../../../../src/libs/decorators/Schema';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Property} from '../../../../src/libs/decorators/Property';


@Schema({name: 'direct_property'})
@Entity()
export class Skil {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  label: string;

  @Property({type: 'number'})
  quality: number;

}
