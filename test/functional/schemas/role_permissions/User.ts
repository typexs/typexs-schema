import * as _ from 'lodash';
import {RBelongsTo2} from './RBelongsTo2';
import {And, Eq, Key, Value} from '@allgemein/expressions';
import {Role} from './Role';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Property} from '../../../../src/libs/decorators/Property';
import {From, Join, To} from '../../../../src/libs/descriptors/JoinDesc';
import {Asc} from '../../../../src/libs/descriptors/OrderDesc';


@Entity()
export class User {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', typeorm: {unique: true}})
  username: string;

  @Property({type: 'string', typeorm: {unique: true}})
  mail: string;

  @Property({type: 'string', nullable: true})
  displayName: string;

  @Property({type: 'boolean'})
  disabled: boolean = false;

  @Property({type: 'boolean'})
  approved: boolean = false;

  @Property({
    type: 'Role', cardinality: 0,
    join: Join(RBelongsTo2, [
        From(Eq('ownerid', Key('id'))),
        To(Eq('id', Key('refid')))
      ],
      And(
        Eq('ownertab', Value('user')),
        Eq('reftab', Value('role'))),
      [Asc(Key('sort')), Asc(Key('id'))])
  })
  roles: Role[];


  @Property({type: 'date:created'})
  created_at: Date;


  @Property({type: 'date:updated'})
  updated_at: Date;

  isApproved(): boolean {
    if (!_.isBoolean(this.approved)) {
      if (_.isString(this.approved)) {
        if (this.approved === '0' || this.approved === 'false') {
          this.approved = false;
        } else if (this.approved === '1' || this.approved === 'true') {
          this.approved = true;
        }
      } else {
        this.approved = this.approved ? true : false;
      }
    }
    return this.approved;
  }

  isDisabled(): boolean {
    if (!_.isBoolean(this.disabled)) {
      if (_.isString(this.disabled)) {
        if (this.disabled === '0' || this.disabled === 'false') {
          this.disabled = false;
        } else if (this.disabled === '1' || this.disabled === 'true') {
          this.disabled = true;
        }
      } else {
        this.disabled = this.disabled ? true : false;
      }
    }
    return this.disabled;
  }

  label() {
    if (this.displayName) {
      return this.displayName;
    }
    return this.username;
  }
}
