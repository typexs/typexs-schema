import {ClassRef} from "../ClassRef";
import {IObject} from "../IObject";


export function Object(options:IObject = {}) {
  return function (object: Function) {
    ClassRef.get(object).setOptions(options)
  };
}

