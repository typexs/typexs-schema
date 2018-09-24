import {IDesc} from "./IDesc";


export const K_HINT_DATEFORMAT = 'dateformat';

export class CondDesc implements IDesc {

}


export class OpDesc extends CondDesc {

}

export class EqDesc extends OpDesc {

  constructor(key: string, value: CondDesc) {
    super();
  }
}

export class LeDesc extends OpDesc {

  constructor(key: string, value: CondDesc) {
    super();
  }
}

export class GeDesc extends OpDesc {

  constructor(key: string, value: CondDesc) {
    super();
  }
}


export class AndDesc extends CondDesc {

  constructor(...value: CondDesc[]) {
    super();
  }
}

export class OrDesc extends CondDesc {

  constructor(...value: CondDesc[]) {
    super();
  }
}


export function Eq() {
}

export function Ge() {
}

export function Le() {
}

export function And() {
}

export function Or() {
}

/**
 * Key
 */
export function K() {
}

/**
 * Value
 *
 */
export function V() {
}
