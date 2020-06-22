import {EmbeddedSubObject} from './EmbeddedSubObject';
import {Schema} from '../../../../src/libs/decorators/Schema';
import {Property} from '../../../../src/libs/decorators/Property';


@Schema({name: 'embedded'})
export class EmbeddedObject {

  @Property({type: 'string'})
  innerName: string;

  @Property({type: EmbeddedSubObject})
  inner: EmbeddedSubObject;

}
