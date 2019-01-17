import {IDesc} from "./IDesc";
import {NotYetImplementedError} from "@typexs/base";
import {ClassRef} from "../registry/ClassRef";

import {PropertyDef} from "../registry/PropertyDef";
import {EntityRegistry} from "../EntityRegistry";
import * as _ from 'lodash';
import {CondDesc} from "./CondDesc";
import {OrderDesc} from "./OrderDesc";
import {ConditionValidationError} from "../exceptions/ConditionValidationError";
import {And} from "./AndDesc";

export type KeyMapType = 'from' | 'to';

export class KeyMapDesc implements IDesc {
  cond: CondDesc;
  type: KeyMapType;

  constructor(cond: CondDesc, type: KeyMapType = 'from') {
    this.cond = cond;
    this.type = type;
  }
}

export class JoinDesc implements IDesc {
  readonly type:string = 'join';
  readonly joinRef: ClassRef;

  readonly keyMaps: KeyMapDesc[] = [];

  readonly condition: CondDesc;

  readonly order: OrderDesc[] = [];

  constructor(base: string | Function, keyMaps: KeyMapDesc[], conditions?: CondDesc, order?: OrderDesc | OrderDesc[]) {
    if (_.isString(base)) {
      throw new NotYetImplementedError()
    }
    this.joinRef = ClassRef.get(base);
    this.keyMaps = keyMaps;
    this.condition = conditions;
    if (order) {
      this.order = !_.isArray(order) ? [order] : order;
    }


  }

  getFrom() {
    return _.find(this.keyMaps, k => k.type == 'from');
  }

  getTo() {
    return _.find(this.keyMaps, k => k.type == 'to');
  }

  validate(sourceDef: ClassRef, propertyDef: PropertyDef, targetDef: ClassRef, throwing: boolean = true) {
    this.condition.validate(this.joinRef);
    this.getFrom().cond.validate(this.joinRef, sourceDef);
    this.getTo().cond.validate(targetDef, this.joinRef);
    const props = EntityRegistry.getPropertyDefsFor(this.joinRef).map(p => p.name);
    this.order.forEach(o => {
      if (props.indexOf(o.key.key) == -1) {
        throw new ConditionValidationError('no property with order key ' + o.key.key + ' found.');
      }
    })
  }

  for(source: any, keyMap: any = {}) {
    if (this.condition) {
      return And(this.getFrom().cond, this.condition).for(source, keyMap);
    }
    return this.getFrom().cond.for(source, keyMap);
  }


  lookup(source: any) {
    if (this.condition) {
      return And(this.getFrom().cond, this.condition).lookup(source);
    }
    return this.getFrom().cond.lookup(source);
  }
}


export function Join(base: Function, keyMaps: KeyMapDesc[], conditions?: CondDesc, order?: OrderDesc | OrderDesc[]) {
  return new JoinDesc(base, keyMaps, conditions, order);
}

export function To(cond: CondDesc) {
  return new KeyMapDesc(cond, 'to')
}

export function From(cond: CondDesc) {
  return new KeyMapDesc(cond, 'from')
}
