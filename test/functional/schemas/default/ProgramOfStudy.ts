import {QualiKeys} from './QualiKeys';
import {Entity, Key, Property} from "../../../../src";


@Entity()
export class ProgramOfStudy {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', length: 2})
  abschl: string;

  @Property({type: QualiKeys, idKey: Key('abschl')})
  abschlRef: QualiKeys;


}
