import {Personnn} from './Personnn';
import {Entity, IProperty, Property} from "../../../../../../src";

@Entity()
export class Bookkk {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  title: string;

  @Property(<IProperty & any>{type: Personnn, form: 'select', enum: 'EntityOptionsService'})
  author: Personnn;

  label() {
    return this.title;
  }
}
