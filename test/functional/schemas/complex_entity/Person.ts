import {Schema} from '../../../../src/libs/decorators/Schema';
import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Job} from './Job';
@Schema({name: 'complex_entity'})
@Entity()
export class Person {


  @Property({type: 'number', auto: true})
  ident: number;

  @Property({type: 'string'})
  name: string;

  @Property({type: Job, cardinality: 0})
  jobs: Job[];

}
