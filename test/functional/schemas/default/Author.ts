
import {Entity, Property} from "../../../../src";

@Entity()
export class Author {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  firstName: string;

  @Property({type: 'string'})
  lastName: string;

}
