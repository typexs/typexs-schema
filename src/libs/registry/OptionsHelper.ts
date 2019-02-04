import * as _ from "lodash";
import {MetaArgs} from "@typexs/base/base/MetaArgs";
import {XS_ANNOTATION_OPTIONS_CACHE} from "../Constants";

import {EntityRegistry} from "../EntityRegistry";
import {ClassRef, XS_TYPE, XS_TYPE_ENTITY, XS_TYPE_PROPERTY} from "commons-schema-api/browser";
import {EntityRef} from "./EntityRef";


export interface IPropertyExtentions {
  type: XS_TYPE,
  object: ClassRef,
  property?: string,
  options: any

}

export class OptionsHelper {

  static forPropertyOn(object: ClassRef, property: string, options: any) {

    let prop = EntityRegistry.getPropertyRefsFor(object).find(p => p.name == property);
    if(prop){
      let pOptions = prop.getOptions();
      _.defaults(pOptions,options);
    }else{
      // cache for use by property constructor
      MetaArgs.key(XS_ANNOTATION_OPTIONS_CACHE).push(<IPropertyExtentions>{
        type: XS_TYPE_PROPERTY,
        object: object,
        property: property,
        options: options
      })
    }
  }

  static forEntityOn(object: ClassRef, options: any) {
    let ent = <EntityRef>object.getEntityRef();
    if(ent){
      let pOptions = ent.getOptions();
      _.defaults(pOptions,options);
    }else{
      // cache for use by entity constructor
      MetaArgs.key(XS_ANNOTATION_OPTIONS_CACHE).push(<IPropertyExtentions>{
        type: XS_TYPE_ENTITY,
        object: object,
        options: options
      })
    }
  }

  static merge(object: ClassRef, options: any, property: string = null) {
    let addOns = _.remove(MetaArgs.key(XS_ANNOTATION_OPTIONS_CACHE), (x: IPropertyExtentions) =>
      property ?
        x.object === object && x.property === property && x.type == XS_TYPE_PROPERTY :
        x.object === object && x.type == XS_TYPE_ENTITY
    );

    if (addOns) {
      addOns.forEach(addOn => {
        _.defaults(options, addOn.options)
      })
    }
  }
}
