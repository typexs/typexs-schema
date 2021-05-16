import {Language} from './Language';
import {Schema} from '../../../../src/libs/decorators/Schema';
import {Property} from '../../../../src/libs/decorators/Property';

@Schema({name: 'complex_entity'})
export class Job {

  @Property({type: 'string'})
  position: string;

  @Property({type: Language, cardinality: 0})
  languages: Language[];

}
