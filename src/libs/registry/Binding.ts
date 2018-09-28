import {XS_TYPE} from "../Constants";

export class Binding {

  bindingType: XS_TYPE;

  sourceType: XS_TYPE;
  source: any;

  targetType: XS_TYPE;
  target: any;

  static create(sType: XS_TYPE, sName: any, tType: XS_TYPE, tName: any) {
    let b = new Binding();
    b.bindingType = <XS_TYPE>[sType, tType].join('_');
    b.sourceType = sType;
    b.targetType = tType;
    b.source = sName;
    b.target = tName;
    return b;
  }
}

