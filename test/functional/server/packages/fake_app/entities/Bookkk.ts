import {Personnn} from './Personnn';
import {Entity} from '../../../../../../src/libs/decorators/Entity';
import {Property} from '../../../../../../src/libs/decorators/Property';
import {IProperty} from '../../../../../../src/libs/registry/IProperty';

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
