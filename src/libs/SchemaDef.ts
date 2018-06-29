import {AbstractDef} from './AbstractDef';
import {LookupRegistry} from './LookupRegistry';
import {XS_TYPE_ENTITY, XS_TYPE_PROPERTY} from './Constants';
import {EntityDef} from './EntityDef';
import {ISchema} from './ISchema';
import {PropertyDef} from './PropertyDef';


export class SchemaDef extends AbstractDef {


  constructor(options: ISchema = {name: 'default'}) {
    super('schema', options.name);
  }


  getEntity(name: string): EntityDef {
    return LookupRegistry.$().find(XS_TYPE_ENTITY, {schemaName: this.name, name: name});
  }


  getEntities(): EntityDef[] {
    return LookupRegistry.$().filter(XS_TYPE_ENTITY, {schemaName: this.name});
  }


  getPropertiesFor(fn: Function): PropertyDef[] {
    return LookupRegistry.$().filter(XS_TYPE_PROPERTY, {entityName: fn.name});
  }


}
