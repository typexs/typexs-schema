import {EmbeddedObject} from './EmbeddedObject';
import {Schema} from '../../../../src/libs/decorators/Schema';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Property} from '../../../../src/libs/decorators/Property';


@Schema({name: 'embedded'})
@Entity()
export class EntityWithEmbedded {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: EmbeddedObject})
  obj: EmbeddedObject;

}
