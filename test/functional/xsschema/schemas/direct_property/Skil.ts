import {Entity} from '../../../../../src/libs/xsschema/decorators/Entity';
import {Schema} from '../../../../../src/libs/xsschema/decorators/Schema';
import {Property} from '../../../../../src/libs/xsschema/decorators/Property';

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
