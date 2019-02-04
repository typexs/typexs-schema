//import {XS_TYPE_BINDING_SCHEMA_CLASS_REF, XS_TYPE_PROPERTY} from './../Constants';
import {EntityRef} from './EntityRef';
import {ISchema} from './ISchema';
import {PropertyRef} from './PropertyRef';
import {
  AbstractRef,
  Binding, ClassRef,
  LookupRegistry,
  XS_TYPE_BINDING_SCHEMA_CLASS_REF,
  XS_TYPE_PROPERTY
} from "commons-schema-api/browser";


export class SchemaRef extends AbstractRef {


  constructor(options: ISchema = {name: 'default'}) {
    super('schema', options.name);
  }

  id() {
    return this.name.toLowerCase();
  }


  getEntity(name: string): EntityRef {
    // TODO cache?
    let binding: Binding = LookupRegistry.$()
      .find<Binding>(XS_TYPE_BINDING_SCHEMA_CLASS_REF, (b: Binding) => b.source == this.name && b.target.className == name && b.target.isEntity);
    if (binding) {
      return binding.target.getEntityRef();
    }
    return null;
  }


  getEntities(): EntityRef[] {
    return LookupRegistry.$()
      .filter(XS_TYPE_BINDING_SCHEMA_CLASS_REF, (b: Binding) => {
        return b.source == this.name && (<ClassRef>b.target).isEntity;
      })
      .map((b: Binding) => <EntityRef>(<ClassRef>b.target).getEntityRef());
    //return LookupRegistry.$().filter(XS_TYPE_ENTITY, (x:EntityDef) => x.schemaName == this.name);
  }

  getStoreableEntities(): EntityRef[] {
    return this.getEntities().filter((x: EntityRef) => x.isStoreable());
  }


  getPropertiesFor(fn: Function): PropertyRef[] {
    return LookupRegistry.$().filter(XS_TYPE_PROPERTY, (p: PropertyRef) => p.getSourceRef().getClass() == fn);
  }


  toJson(withEntities: boolean = true, withProperties: boolean = true) {
    let o = super.toJson();
    if (withEntities) {
      o.entities = this.getEntities().map(p => p.toJson(withProperties));
    }
    return o;
  }


}
