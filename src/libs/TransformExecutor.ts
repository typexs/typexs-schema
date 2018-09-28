import {EntityDef} from "./registry/EntityDef";
import {NotYetImplementedError} from "typexs-base/libs/exceptions/NotYetImplementedError";
import * as _ from "./LoDash";


export class TransformExecutor {

  transform(entityDef: EntityDef, data: any) {
    let object = entityDef.new();
    for (let p of entityDef.getPropertyDefs()) {
      if (p.isReference()) {
        if (p.isEntityReference()) {
          let refEntityDef = p.getEntity();
          if (p.isCollection()) {
            for (let n of data[p.name]) {
              object[p.name] = refEntityDef.build(n);
            }
          } else {
            object[p.name] = refEntityDef.build(data[p.name]);
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
    return object;

  }
}
