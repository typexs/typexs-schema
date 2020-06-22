
import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';
@Entity({name: 'k_abint'})
export class QualiKeys {

  @Property({type: 'string', length: 2, id: true})
  abint: string;

  @Property({type: 'string'})
  ktxt: string;

}
