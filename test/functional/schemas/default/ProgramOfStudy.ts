import {QualiKeys} from './QualiKeys';
import {Entity,  Property} from "../../../../src";
import {Key} from "commons-expressions";


@Entity()
export class ProgramOfStudy {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', length: 2})
  abschl: string;

  @Property({type: QualiKeys, idKey: Key('abschl')})
  abschlRef: QualiKeys;


}
