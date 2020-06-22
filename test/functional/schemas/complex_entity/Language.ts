import {Schema} from '../../../../src/libs/decorators/Schema';
import {Property} from '../../../../src/libs/decorators/Property';

@Schema({name: 'complex_entity'})
export class Language {

  @Property({type: 'string', length: 2})
  code: string;

  @Property({type: 'string'})
  label: string;

}
