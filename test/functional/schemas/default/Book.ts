import {Author} from './Author';
import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';

import {IsDefined} from 'class-validator';


@Entity()
export class Book {

  @Property({type: 'number', auto: true})
  id: number;

  @IsDefined()
  @Property({type: 'string', nullable: true})
  label: string;

  @Property({type: 'string', nullable: true})
  content: string;

  @Property({type: Author, nullable: true})
  author: Author;

}
