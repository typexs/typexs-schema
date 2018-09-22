import {Property, Schema} from "../../../../src";

@Schema({name: 'complex_entity'})
export class Language {

  @Property({type: 'string', length: 2})
  code: string;

  @Property({type: 'string'})
  label: string;

}
