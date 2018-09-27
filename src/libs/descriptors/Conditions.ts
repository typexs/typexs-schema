import {NestedException} from "commons-base/libs/exceptions/NestedException";

import {IDesc} from "./IDesc";
import _ = require("lodash");
import {ClassRef} from "../ClassRef";
import {EntityRegistry} from "../EntityRegistry";
import {NotYetImplementedError} from "typexs-base/libs/exceptions/NotYetImplementedError";


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
  validate(targetRef: ClassRef, sourceRef?: ClassRef, throwing: boolean = true) {
    let sourceKeys = this.getSourceKeys();
    let targetKeys = this.getTargetKeys();

    let targetProps = EntityRegistry.getPropertyDefsFor(targetRef).map(p => p.name).filter(pn => sourceKeys.indexOf(pn) !== -1);
    let sourceProps = sourceRef ? EntityRegistry.getPropertyDefsFor(sourceRef).map(p => p.name).filter(pn => targetKeys.indexOf(pn) !== -1) : [];
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


  applyOn(target: any, source: any, force: boolean = false) {
    if (this instanceof EqDesc) {
      if (!_.has(target, this.key) || false) {
        if (this.value instanceof ValueDesc) {
          target[this.key] = this.value.value;
        } else if (this.value instanceof KeyDesc) {
          target[this.key] = source[this.value.key];
        } else {
          throw new NotYetImplementedError()
        }
      }
    } else if (this instanceof AndDesc) {
      _.map(this.values, v => v.applyOn(target, source, force))
    } else if (this instanceof OrDesc) {
      _.map(this.values, v => v.applyOn(target, source, force))
    } else {
      throw new NotYetImplementedError();
    }
  }


  applyReverseOn(target: any, source: any, force: boolean = false) {
    if (this instanceof EqDesc) {
      if (!_.has(target, this.key) || false) {
        if (this.value instanceof KeyDesc) {
          target[this.value.key] = source[this.key];
        } else {
          throw new NotYetImplementedError()
        }
      }
    } else if (this instanceof AndDesc) {
      _.map(this.values, v => v.applyReverseOn(target, source, force))
    } else if (this instanceof OrDesc) {
      _.map(this.values, v => v.applyReverseOn(target, source, force))
    } else {
      throw new NotYetImplementedError();
    }
  }


  lookup(source: any): (target: any) => boolean {
    throw new NotYetImplementedError()
  }

  for(target: any, keyMap: any = {}): any {
    throw new NotYetImplementedError()
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

  lookup(source: any): (target: any) => boolean {
    const value = this.value instanceof KeyDesc ? source[this.value.key] : _.clone((<ValueDesc>this.value).value);
    const key = this.key;
    return function (target: any) {
      return target[key] == value;
    }
  }

  for(source: any, keyMap: any = {}): any {
    const value = this.value instanceof KeyDesc ? source[this.value.key] : _.clone((<ValueDesc>this.value).value);
    const key = _.get(keyMap, this.key, this.key);
    let c: any = {};
    c[key] = value;
    return c;
  }

}

export class LeDesc extends OpDesc {

  constructor(key: string, value: Selector) {
    super(key, value);
  }

  lookup(source: any): (target: any) => boolean {
    const value = this.value instanceof KeyDesc ? source[this.value.key] : _.clone((<ValueDesc>this.value).value);
    const key = this.key;
    return function (target: any) {
      return target[key] <= value;
    }
  }
}

export class GeDesc extends OpDesc {

  constructor(key: string, value: Selector) {
    super(key, value);
  }

  lookup(source: any): (target: any) => boolean {
    const value = this.value instanceof KeyDesc ? source[this.value.key] : _.clone((<ValueDesc>this.value).value);
    const key = this.key;
    return function (target: any) {
      return target[key] >= value;
    }
  }
}


export class AndDesc extends GroupDesc {

  constructor(...values: CondDesc[]) {
    super(...values);
  }

  lookup(source: any): (target: any) => boolean {
    const checks = _.map(this.values, v => v.lookup(source));
    return function (target: any): boolean {
      for (let fn of checks) {
        if (!fn(target)) {
          return false;
        }
      }
      return true;
    }
  }

  for(source: any, keyMap: any = {}): any {
    const checks = _.map(this.values, v => v.for(source, keyMap));
    let c: any = {};
    c['$and'] = checks;
    return c;
  }

}

export class OrDesc extends GroupDesc {

  constructor(...values: CondDesc[]) {
    super(...values);
  }

  lookup(source: any): (target: any) => boolean {
    const checks = _.map(this.values, v => v.lookup(source));
    return function (target: any): boolean {
      for (let fn of checks) {
        if (fn(target)) {
          return true;
        }
      }
      return false;
    }
  }

  for(source: any, keyMap: any = {}): any {
    const checks = _.map(this.values, v => v.for(source, keyMap));
    let c: any = {};
    c['$or'] = checks;
    return c;
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


export class OrderDesc implements IDesc {
  readonly key: KeyDesc;
  readonly asc: boolean;

  constructor(key: KeyDesc, direction: boolean = true) {
    this.key = key
    this.asc = direction;
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

/**
 * Asc
 */
export function Asc(k: KeyDesc) {
  return new OrderDesc(k, true)
}

/**
 * Asc
 */
export function Desc(k: KeyDesc) {
  return new OrderDesc(k, false)
}
