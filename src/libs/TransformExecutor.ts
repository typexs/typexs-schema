import {EntityDef} from "./registry/EntityDef";
import {NotYetImplementedError} from "typexs-base/libs/exceptions/NotYetImplementedError";
import * as _ from "./LoDash";


export interface IBuildOptions {
  beforeBuild?: (entityDef: EntityDef, from: any, to: any) => void
  afterBuild?: (entityDef: EntityDef, from: any, to: any) => void
}

export class TransformExecutor {

  transform(entityDef: EntityDef, data: any, options: IBuildOptions = {}) {
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
        if (p.isEntityReference()) {
          let refEntityDef = p.getEntity();
          if (p.isCollection()) {
            for (let n of data[p.name]) {
              object[p.name] = refEntityDef.build(n, options);
            }
          } else {
            object[p.name] = refEntityDef.build(data[p.name], options);
          }
        } else {
          throw new NotYetImplementedError()
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
          if (data[p.name]) {
            // set correct value
            object[p.name] = p.convert(data[p.name]);
          } else {
            // set default
            object[p.name] = null;
          }
        }
      }
    }
    if (options.afterBuild) {
      options.afterBuild(entityDef, data, object)
    }
    return object;

  }
}
