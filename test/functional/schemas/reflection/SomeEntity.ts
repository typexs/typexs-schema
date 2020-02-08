import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Schema} from '../../../../src/libs/decorators/Schema';


@Schema({name: 'reflection'})
@Entity()
export class SomeEntity {

  @Property()
  name: string;

}
