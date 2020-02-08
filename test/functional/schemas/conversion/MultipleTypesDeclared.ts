import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Schema} from '../../../../src/libs/decorators/Schema';

@Schema({name: 'conversion'})
@Entity()
export class MultipleTypesDeclared {

  @Property({type: 'number'})
  number: number;

  @Property({type: 'string'})
  string: string;

  @Property({type: 'date'})
  date: Date;

  @Property({type: 'boolean'})
  boolean: boolean;

}
