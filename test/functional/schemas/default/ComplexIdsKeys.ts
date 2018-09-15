import {Entity, Property} from "../../../../src";

@Entity()
export class ComplexIdsKeys {

  @Property({type: 'number', id: true})
  inc: number;

  @Property({type: 'string', id: true})
  code: string;

}
