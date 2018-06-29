
import {Entity, Property} from "../../../../src";
@Entity({name: 'k_abint'})
export class QualiKeys {

  @Property({type: 'string', length: 2, id: true})
  abint: string;

  @Property({type: 'string'})
  ktxt: string;

}
