import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Schema} from '../../../../src/libs/decorators/Schema';
import {MultipleTypesDeclared} from './MultipleTypesDeclared';

@Schema({name: 'conversion'})
@Entity()
export class EmbeddedMultipleTypesDeclared {

  @Property({type: 'number'})
  number: number;

  @Property({type: MultipleTypesDeclared})
  object: MultipleTypesDeclared;

  @Property({type: MultipleTypesDeclared, cardinality: 0})
  objects: MultipleTypesDeclared[];

}
