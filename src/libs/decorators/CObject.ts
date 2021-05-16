import './register';
import {IObject} from '../registry/IObject';
import {Embeddable as _Embeddable} from '@allgemein/schema-api';
import {NAMESPACE_BUILT_ENTITY} from '../Constants';
import {defaults} from 'lodash';

export function CObject(options: IObject = {}) {
  return function (object: Function) {
    _Embeddable(defaults(options, {namespace: NAMESPACE_BUILT_ENTITY}))(object);
    // classRefGet
  };
}

