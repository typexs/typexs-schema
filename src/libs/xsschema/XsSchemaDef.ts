import {XsDef} from './XsDef';
import {XsLookupRegistry} from './XsLookupRegistry';
import {XS_TYPE_ENTITY, XS_TYPE_PROPERTY} from './Constants';
import {XsEntityDef} from './XsEntityDef';
import {IXsSchema} from './IXsSchema';
import {XsPropertyDef} from './XsPropertyDef';


export class XsSchemaDef extends XsDef {


  constructor(options: IXsSchema = {name: 'default'}) {
    super('schema', options.name);
  }


  getEntity(name: string): XsEntityDef {
    return XsLookupRegistry.$().find(XS_TYPE_ENTITY, {schemaName: this.name, name: name});
  }


  getEntities(): XsEntityDef[] {
    return XsLookupRegistry.$().filter(XS_TYPE_ENTITY, {schemaName: this.name});
  }


  getPropertiesFor(fn: Function): XsPropertyDef[] {
    return XsLookupRegistry.$().filter(XS_TYPE_PROPERTY, {entityName: fn.name});
  }


}
