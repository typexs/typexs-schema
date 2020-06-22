import {Schema} from '../../../../src/libs/decorators/Schema';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Property} from '../../../../src/libs/decorators/Property';



@Schema({name: 'embedded'})
export class EmbeddedSubObject {


  @Property({type: 'string'})
  subName: string;

  @Property({type: 'number'})
  SubOtherVar: number;

}
