import {Schema} from '../../../../../../src/libs/decorators/Schema';
import {Entity} from '../../../../../../src/libs/decorators/Entity';
import {Property} from '../../../../../../src/libs/decorators/Property';

@Schema({name: 'literature'})
@Entity()
export class Book3 {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', nullable: true})
  label: string;

  @Property({type: 'string', nullable: true})
  content: string;

}
