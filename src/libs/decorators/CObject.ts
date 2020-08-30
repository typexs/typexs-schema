import {IObject} from '../registry/IObject';
import {classRefGet} from '../Helper';


export function CObject(options: IObject = {}) {
  return function (object: Function) {
    classRefGet(object).setOptions(options);
  };
}

