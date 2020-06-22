import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';

@Entity()
export class DateType {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'date'})
  date: Date;

  @Property({type: 'date:created'})
  created_at: Date;

  @Property({type: 'date:updated'})
  updated_at: Date;

}
