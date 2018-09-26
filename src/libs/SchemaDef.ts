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
    return LookupRegistry.$().find(XS_TYPE_ENTITY, (x:EntityDef) => x.schemaName == this.name && x.name == name);
  }


  getEntities(): EntityDef[] {
    return LookupRegistry.$().filter(XS_TYPE_ENTITY, (x:EntityDef) => x.schemaName == this.name);
  }

  getStoreableEntities(): EntityDef[] {
    return LookupRegistry.$().filter(XS_TYPE_ENTITY, (x:EntityDef) => x.schemaName == this.name && x.isStoreable());
  }


  getPropertiesFor(fn: Function): PropertyDef[] {
    return LookupRegistry.$().filter(XS_TYPE_PROPERTY, {entityName: fn.name});
  }


  toJson(withEntities: boolean = true, withProperties: boolean = true) {
    let o = super.toJson();
    if (withEntities) {
      o.entities = this.getEntities().map(p => p.toJson(withProperties));
    }
    return o;
  }


}
