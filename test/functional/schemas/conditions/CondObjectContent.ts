import {Schema} from '../../../../src/libs/decorators/Schema';
import {Property} from '../../../../src/libs/decorators/Property';


@Schema({name: 'conditions'})
export class CondObjectContent {

  @Property({type: 'number', id: true})
  somenr: number;

  @Property({type: 'number', id: true})
  subnr: number;

  @Property({type: 'string'})
  nickname: string;


}
