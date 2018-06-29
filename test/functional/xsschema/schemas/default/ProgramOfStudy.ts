import {Entity} from '../../../../../src/libs/xsschema/decorators/Entity';
import {Property} from '../../../../../src/libs/xsschema/decorators/Property';
import {QualiKeys} from './QualiKeys';

@Entity()
export class ProgramOfStudy {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', length: 2})
  abschl: string;

  @Property({targetClass: QualiKeys, refMembers: 'abint', localMembers: 'abschl'})
  abschlRef: QualiKeys;



}
