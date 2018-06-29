import {Property} from '../../../../../src/libs/xsschema/decorators/Property';
import {Entity} from '../../../../../src/libs/xsschema/decorators/Entity';


@Entity({name:'author_with_new_name'})
export class AuthorRename {

  @Property({type: 'number', auto: true, name: 'id_new_name'})
  id: number;

  @Property({type: 'string'})
  firstName: string;

  @Property({type: 'string'})
  lastName: string;

}
