import {Entity, Property, Schema} from "../../../../../../src";

@Schema({name:'literature'})
@Entity()
export class Book3 {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', nullable: true})
  label: string;

  @Property({type: 'string', nullable: true})
  content: string;

}
