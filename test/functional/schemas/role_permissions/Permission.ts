import {RBelongsTo2} from './RBelongsTo2';
import {Role} from './Role';
import {And, Eq, Key, Value} from '@allgemein/expressions';
import {Schema} from '../../../../src/libs/decorators/Schema';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Property} from '../../../../src/libs/decorators/Property';
import {From, Join, To} from '../../../../src/libs/descriptors/JoinDesc';
import {Asc} from '../../../../src/libs/descriptors/OrderDesc';


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
  roles: Role[];

  label() {
    return this.permission;
  }
}
