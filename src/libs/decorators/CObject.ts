import {ClassRef} from "../ClassRef";
import {IObject} from "../IObject";


export function CObject(options:IObject = {}) {
  return function (object: Function) {
    ClassRef.get(object).setOptions(options)
  };
}

