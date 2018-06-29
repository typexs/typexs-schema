import {Entity} from '../../../../../src/libs/xsschema/decorators/Entity';
import {Property} from '../../../../../src/libs/xsschema/decorators/Property';

@Entity({name: 'k_abint'})
export class QualiKeys {

  @Property({type: 'string', length: 2, id: true})
  abint: string;

  @Property({type: 'string'})
  ktxt: string;

}
