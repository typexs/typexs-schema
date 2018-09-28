import {AbstractDef} from './AbstractDef';
import {LookupRegistry} from './../LookupRegistry';
import {XS_TYPE_BINDING_SCHEMA_CLASS_REF, XS_TYPE_PROPERTY} from './../Constants';
import {EntityDef} from './EntityDef';
import {ISchema} from './ISchema';
import {PropertyDef} from './PropertyDef';
import {Binding} from "./Binding";
import {ClassRef} from "./ClassRef";


export class SchemaDef extends AbstractDef {


  constructor(options: ISchema = {name: 'default'}) {
    super('schema', options.name);
  }

  id() {
    return this.name.toLowerCase();
  }


  getEntity(name: string): EntityDef {
    // TODO cache?
    let binding: Binding = LookupRegistry.$()
      .find<Binding>(XS_TYPE_BINDING_SCHEMA_CLASS_REF, (b: Binding) => b.source == this.name && b.target.className == name && b.target.isEntity);
    if (binding) {
      return binding.target.getEntity();
    }
    return null;
  }


  getEntities(): EntityDef[] {
    return LookupRegistry.$()
      .filter(XS_TYPE_BINDING_SCHEMA_CLASS_REF, (b: Binding) => {
        return b.source == this.name && b.target.isEntity;
      })
      .map((b: Binding) => b.target.getEntity());
    //return LookupRegistry.$().filter(XS_TYPE_ENTITY, (x:EntityDef) => x.schemaName == this.name);
  }

  getStoreableEntities(): EntityDef[] {
    return this.getEntities().filter((x: EntityDef) => x.isStoreable());
  }


  getPropertiesFor(fn: Function): PropertyDef[] {
    return LookupRegistry.$().filter(XS_TYPE_PROPERTY, (p: PropertyDef) => p.object.getClass() == fn);
  }


  toJson(withEntities: boolean = true, withProperties: boolean = true) {
    let o = super.toJson();
    if (withEntities) {
      o.entities = this.getEntities().map(p => p.toJson(withProperties));
    }
    return o;
  }


}
