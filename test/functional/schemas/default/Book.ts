
import {Author} from './Author';
import {Entity, Property, Schema} from "../../../../src";


@Entity()
export class Book {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', nullable: true})
  label: string;

  @Property({type: 'string', nullable: true})
  content: string;

  @Property({type: Author, nullable: true})
  author: Author;

}
