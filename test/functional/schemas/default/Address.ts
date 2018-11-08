import {Entity, Property} from "../../../../src";

@Entity()
export class Address {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type:'string'})
  street:string;

  @Property({type:'string'})
  postalcode:string;

}
