import {NestedException} from "commons-base/libs/exceptions/NestedException";

import {IDesc} from "./IDesc";
import _ = require("lodash");
import {ClassRef} from "../ClassRef";
import {EntityRegistry} from "../EntityRegistry";


export const K_HINT_DATEFORMAT = 'dateformat';

export class CondDesc implements IDesc {

  getSourceKeys(): string[] {
    let keys: string[] = [];
    if (this instanceof OpDesc) {
      keys.push(this.key);
      /*
      let childKeys = this.value.getSourceKeys();
      if(!_.isEmpty(childKeys)){
        keys = _.concat(keys, childKeys);
      }*/
    } else if (this instanceof GroupDesc) {
      keys = _.concat(keys, ... _.map(this.values, v => v.getSourceKeys()));
    }
    return keys;
  }


  getTargetKeys() {
    let keys: string[] = [];
    if (this instanceof OpDesc) {
      if (this.value instanceof KeyDesc) {
        keys.push(this.value.key);
      }
    } else if (this instanceof GroupDesc) {
      keys = _.concat(keys, ... _.map(this.values, v => v.getTargetKeys()));
    }
    return keys;
  }

  /**
   * Validate if defined keys match source and target element
   * - target = referred
   * - source = referrer
   */
  validate(targetRef: ClassRef, sourceRef: ClassRef, throwing: boolean = true) {
    let sourceKeys = this.getSourceKeys();
    let targetKeys = this.getTargetKeys();

    let targetProps = EntityRegistry.getPropertyDefsFor(targetRef).map(p => p.name).filter(pn => sourceKeys.indexOf(pn) !== -1);
    let sourceProps = EntityRegistry.getPropertyDefsFor(sourceRef).map(p => p.name).filter(pn => targetKeys.indexOf(pn) !== -1);
    if (sourceKeys.length != targetProps.length) {
      if (throwing) {
        throw new ValidationException('referred key(s) ' + sourceKeys.filter(k => targetProps.indexOf(k) === -1).join(',') + ' not in sourceRef')
      }
      return false;
    }
    if (targetKeys.length != sourceProps.length) {
      if (throwing) {
        throw new ValidationException('referrer key(s) ' + targetKeys.filter(k => sourceProps.indexOf(k) === -1).join(',') + ' not in targetRef')
      }
      return false;
    }
    return true;
  }

}

export class ValidationException extends NestedException {

  constructor(msg: string) {
    super(new Error('validation error: ' + msg), "CONDITION_VALIDATION_ERROR");
  }
}


export class OpDesc extends CondDesc {

  key: string;

  value: Selector;

  constructor(key: string, value: Selector) {
    super();
    this.key = key;
    this.value = value;
  }


}

export class GroupDesc extends CondDesc {
  values: CondDesc[] = [];

  constructor(...values: CondDesc[]) {
    super();
    this.values = values;
  }
}


export class EqDesc extends OpDesc {

  constructor(key: string, value: Selector) {
    super(key, value);
  }
}

export class LeDesc extends OpDesc {

  constructor(key: string, value: Selector) {
    super(key, value);
  }
}

export class GeDesc extends OpDesc {

  constructor(key: string, value: Selector) {
    super(key, value);
  }
}


export class AndDesc extends GroupDesc {

  constructor(...values: CondDesc[]) {
    super(...values);
  }
}

export class OrDesc extends GroupDesc {

  constructor(...values: CondDesc[]) {
    super(...values);
  }
}

export class Selector implements IDesc {
}

export class KeyDesc extends Selector {
  readonly key: string;

  constructor(key: string) {
    super();
    this.key = key
  }

}

export class ValueDesc extends Selector {
  readonly value: string;

  constructor(value: string) {
    super();
    this.value = value;
  }
}

export function Eq(key: string, value: Selector) {
  return new EqDesc(key, value);
}

export function Ge(key: string, value: Selector) {
  return new GeDesc(key, value);
}

export function Le(key: string, value: Selector) {
  return new LeDesc(key, value);
}

export function And(...values: CondDesc[]) {
  return new AndDesc(...values);
}

export function Or(...values: CondDesc[]) {
  return new OrDesc(...values);
}

/**
 * Key
 */
export function Key(k: string) {
  return new KeyDesc(k);
}

/**
 * Value
 *
 */
export function Value(v: string) {
  return new ValueDesc(v);
}
