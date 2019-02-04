
import {RBelongsTo2} from "./RBelongsTo2";
import {Role} from "./Role";
import {Asc, Entity, From, Join, Property, Schema, To} from "../../../../src";
import {And, Eq, Key, Value} from "commons-expressions";


@Schema({name: 'role_permissions'})
@Entity()
export class Permission {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', typeorm: {unique: true}})
  permission: string;

  @Property({type: 'string', typeorm: {index: true}})
  module: string;

  // Is single permission or permission pattern ...
  @Property({type: 'string', typeorm: {index: true}})
  type: string;

  @Property({type: 'boolean'})
  disabled: boolean = false;

  @Property({type: 'date:created'})
  created_at: Date;

  @Property({type: 'date:updated'})
  updated_at: Date;

  // TODO has a list of roles

  @Property({
    type: 'Role', cardinality: 0,
    join: Join(RBelongsTo2, [
        From(Eq('refid', Key('id'))),
        To(Eq('id', Key('ownerid')))
      ],
      And(
        Eq('ownertab', Value('role')),
        Eq('reftab', Value('permission'))),
      [Asc(Key('sort')), Asc(Key('id'))])
  })
  roles:Role[];

  label() {
    return this.permission;
  }
}
