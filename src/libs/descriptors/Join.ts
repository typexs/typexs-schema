import {IDesc} from "./IDesc";


export class FromDesc implements IDesc {

}

export class ToDesc implements IDesc {

}

export class JoinDesc {

  constructor(base: string, ...desc: IDesc[]) {
  }
}


export function Join(base: string, ...desc: IDesc[]) {
  return new JoinDesc(base,...desc);
}

export function To(source: string, target: string) {
  return new ToDesc()
}

export function From(target: string, source: string) {
  return new FromDesc()
}
