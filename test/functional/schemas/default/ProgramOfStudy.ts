
import {QualiKeys} from './QualiKeys';
import {Entity, Property} from "../../../../src";
@Entity()
export class ProgramOfStudy {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', length: 2})
  abschl: string;

  @Property({targetClass: QualiKeys, refMembers: 'abint', localMembers: 'abschl'})
  abschlRef: QualiKeys;



}
