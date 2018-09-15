import {Entity, Property} from "../../../../../../src";


@Entity()
export class Book {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', nullable: true})
  label: string;

  @Property({type: 'string', nullable: true})
  content: string;

}
