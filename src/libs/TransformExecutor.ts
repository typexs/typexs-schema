import {EntityDef} from "./registry/EntityDef";
import {NotYetImplementedError} from "@typexs/base/libs/exceptions/NotYetImplementedError";
import * as _ from "./LoDash";
import {ClassRef} from "./registry/ClassRef";


export interface IBuildOptions {
  beforeBuild?: (entityDef: EntityDef | ClassRef, from: any, to: any) => void
  afterBuild?: (entityDef: EntityDef | ClassRef, from: any, to: any) => void
}

export class TransformExecutor {

  transform(entityDef: EntityDef | ClassRef, data: any, options: IBuildOptions = {}) {
    let object = entityDef.new();
    if (options.beforeBuild) {
      options.beforeBuild(entityDef, data, object)
    }
    for (let p of entityDef.getPropertyDefs()) {
      if ((_.isNull(data[p.name]) || _.isUndefined(data[p.name]))) {
        //object[p.name] = null;
        continue;
      }
      if (p.isReference()) {
        let ref = p.isEntityReference() ? p.getEntity() : p.targetRef;
        if (p.isCollection()) {
          object[p.name] = [];
          for (let i = 0; i < data[p.name].length; i++) {
            object[p.name][i] = ref.build(data[p.name][i], options);
          }
        } else {
          object[p.name] = ref.build(data[p.name], options);
        }
      } else {
        if (p.isCollection() && (_.isArray(data[p.name]) || _.isSet(data[p.name]))) {
          object[p.name] = [];
          for (let i = 0; i < data[p.name].length; i++) {
            let v = data[p.name][i];
            if (v) {
              object[p.name][i] = p.convert(v);
            } else {
              object[p.name][i] = null;
            }
          }
        } else if (p.isCollection() && !(_.isArray(data[p.name]) || _.isSet(data[p.name]))) {
          throw new NotYetImplementedError();
        } else {
          object[p.name] = p.convert(data[p.name]);
        }
      }
    }
    if (options.afterBuild) {
      options.afterBuild(entityDef, data, object)
    }
    return object;

  }
}
