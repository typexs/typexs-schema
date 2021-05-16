import {QualiKeys} from './QualiKeys';
import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Key} from "@allgemein/expressions";


@Entity()
export class ProgramOfStudy {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', length: 2})
  abschl: string;

  @Property({type: QualiKeys, idKey: Key('abschl')})
  abschlRef: QualiKeys;


}
