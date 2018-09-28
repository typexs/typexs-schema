import {ClassRef} from "../registry/ClassRef";
import {IObject} from "../registry/IObject";


export function CObject(options:IObject = {}) {
  return function (object: Function) {
    ClassRef.get(object).setOptions(options)
  };
}

