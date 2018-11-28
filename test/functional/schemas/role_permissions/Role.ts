import {RBelongsTo2} from "./RBelongsTo2";
import {Permission} from "./Permission";
import {And, Asc, Entity, Eq, From, Join, Key, Property, Schema, To, Value} from "../../../../src";


@Schema({name: 'role_permissions'})
@Entity()
export class Role {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', typeorm: {unique: true}})
  rolename: string;

  @Property({type: 'string', nullable: true})
  displayName: string;

  @Property({type: 'boolean'})
  disabled: boolean = false;

  @Property({
    type: 'Permission', cardinality: 0,
    join: Join(RBelongsTo2, [
        From(Eq('ownerid', Key('id'))),
        To(Eq('id', Key('refid')))
      ],
      And(
        Eq('ownertab', Value('role')),
        Eq('reftab', Value('permission'))),
      [Asc(Key('sort')), Asc(Key('id'))])
  })
  permissions: Permission[];


  @Property({type: 'date:created'})
  created_at: Date;

  @Property({type: 'date:updated'})
  updated_at: Date;


  // TODO has a list of permissions

  label() {
    if (this.displayName) {
      return this.displayName;
    }
    return this.rolename;
  }
}
