import {PropertyDef} from "../../registry/PropertyDef";
import {INameResolver} from "../INameResolver";

export class SqlHelper {

  static getEmbeddedPropertyIds(propertyDef: PropertyDef) {
    let refProps: string[] = [];
    if (propertyDef.hasIdKeys()) {
      refProps = propertyDef.getIdKeys();
    } else {
      refProps = [propertyDef.storingName];
    }
    return refProps;
  }

  static resolveNameForEmbeddedIds(n: INameResolver, name: string, propertyDef: PropertyDef, prop: PropertyDef) {
    let targetName, targetId;
    if (propertyDef.hasIdKeys()) {
      [targetId, targetName] = n.for(name);
    } else {
      [targetId, targetName] = n.for(name, prop);
    }
    return [targetId, targetName]
  }

}
