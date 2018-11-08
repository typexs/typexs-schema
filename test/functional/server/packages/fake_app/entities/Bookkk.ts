import {Personnn} from './Personnn';
import {Entity, IProperty, Property} from "../../../../../../src";

@Entity()
export class Bookkk {

  @Property({type: 'number', form: 'readonly', auto: true})
  id: number;

  @Property({type: 'string', form: 'text'})
  title: string;

  @Property(<IProperty & any>{type: Personnn, form: 'select', enum: 'EntityOptionsService'})
  author: Personnn;

  label() {
    return this.title;
  }
}
