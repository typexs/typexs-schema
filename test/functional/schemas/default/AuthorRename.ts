
import {Entity, Property} from "../../../../src";

@Entity({name:'author_with_new_name'})
export class AuthorRename {

  @Property({type: 'number', auto: true, name: 'id_new_name'})
  id: number;

  @Property({type: 'string'})
  firstName: string;

  @Property({type: 'string'})
  lastName: string;

}
