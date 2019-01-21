import * as _ from 'lodash';
import {EntityDef} from "../../registry/EntityDef";
import {ClassRef, NameResolver} from "../../..";
import {Log, NotYetImplementedError} from "@typexs/base";

export interface IConditionJoin {
  alias: string;
  table: string;
  condition: string;
}

interface WalkValues {
  value: any,
  key: string,
  index: number,
  location: any
  parent: any
  isLeaf: boolean
}

export class SqlConditionsBuilder {

  private inc: number = 1;

  private entityDef: EntityDef;

  private alias: string;

  private joins: IConditionJoin[] = [];

  private nameResolver: NameResolver = new NameResolver();

  constructor(entityDef: EntityDef, alias: string = null) {
    this.entityDef = entityDef;
    this.alias = alias ? alias : this.entityDef.storingName;
  }


  getJoins() {
    return this.joins;
  }


  private createAlias(tmp: ClassRef) {
    let name = _.snakeCase(tmp.storingName);
    name += '_' + (this.inc++);
    return name;
  }


  lookupKeys(key: string) {
    let joins = key.split('.');
    let tmp: ClassRef = this.entityDef.getClassRef();
    let names: string[] = [this.alias];
    let rootAlias = this.alias;
    for (let _join of joins) {
      let prop = tmp.getPropertyDefs().find(x => x.name == _join);

      if (prop.isReference()) {
        let from = tmp;
        tmp = prop.targetRef ? prop.targetRef : null;
        let join: IConditionJoin = null;

        if (prop.hasConditions()) {
          join = {
            alias: this.createAlias(tmp),
            //      from: from,
            //    ref: prop,
            table: tmp.storingName,
            condition: null
          };

          let _condition = prop.getCondition();
          let conditions: string[] = [];

          let map = _condition.getMap();
          _.keys(map).forEach(targetKey => {
            // let c =
            let sourceKey = /\'/.test(map[targetKey]) ? map[targetKey] : rootAlias + '.' + map[targetKey];
            conditions.push([join.alias + '.' + targetKey, sourceKey].join(' = '))
          })
          join.condition = conditions.join(' AND ');
          this.joins.push(join);
          rootAlias = join.alias;
          names = [rootAlias];
        } else if (prop.hasJoin()) {
          //join.condition = prop.getJoin();
          throw new NotYetImplementedError();
        } else if (prop.hasIdKeys()) {
          throw new NotYetImplementedError();
        } else if (prop.isEmbedded()) {
          throw new NotYetImplementedError();
        } else if (prop.hasJoinRef()) {
          let joinRef = prop.joinRef;
          let sourceIds = from.getPropertyDefs().filter(x => x.identifier);

          let conditions:string[] = [];
          join = {
            alias: this.createAlias(joinRef),
            //      from: from,
            //    ref: prop,
            table: joinRef.storingName,
            condition: null
          };
          this.joins.push(join);
          sourceIds.forEach(x => {
            let [targetId, targetName] = this.nameResolver.forSource(x);
            conditions.push(join.alias + '.'+targetName+' = '+rootAlias+'.'+x.storingName);
          });
          join.condition = conditions.join(' AND ');
          rootAlias = join.alias;

          conditions = [];
          join = {
            alias: this.createAlias(tmp),
            //      from: from,
            //    ref: prop,
            table: tmp.storingName,
            condition: null
          };
          this.joins.push(join);
          let targetIds = tmp.getPropertyDefs().filter(x => x.identifier);
          targetIds.forEach(x => {
            let [targetId, targetName] = this.nameResolver.forTarget(x);
            conditions.push(join.alias + '.'+x.storingName+' = '+rootAlias+'.'+targetName);
          });
          join.condition = conditions.join(' AND ');
          rootAlias = join.alias;
          names = [rootAlias];
        } else {
          join = {
            alias: this.createAlias(tmp),
            //      from: from,
            //    ref: prop,
            table: tmp.storingName,
            condition: null
          };
          this.joins.push(join);
          let conditions: string[] = [];
          from.getPropertyDefs().filter(x => x.identifier).forEach(property => {
            let [targetId, targetName] = this.nameResolver.forSource(property);
            conditions.push([join.alias + '.' + targetName, rootAlias + '.' + property.storingName].join(' = '))
          });
          join.condition = conditions.join(' AND ')
          rootAlias = join.alias;
          names = [rootAlias];
        }

      } else {
        names.push(prop.storingName);
      }
    }
    return names.join('.')
  }

  build(condition: any, k: string = null): string {
    if (_.isEmpty(condition)) {
      return null;
    }
    let control: any = _.keys(condition).filter(k => k.startsWith('$'));
    if (!_.isEmpty(control)) {
      control = control.shift();
      if (this[control]) {
        return this[control](condition, k);
      } else {
        throw new NotYetImplementedError()
      }
    } else if (_.isArray(condition)) {
      return this.$or({'$or': condition}, k);
    } else {
      return _.keys(condition).map(k => {
        if (_.isPlainObject(condition[k])) {
          return this.build(condition[k], k);
        }
        let key = this.lookupKeys(k);
        let value = condition[k];
        if (_.isString(value) || _.isNumber(value) || _.isDate(value)) {
          return `${key} = '${value}'`
        } else {
          Log.warn(`SQL.conditionToString not a plain type ${key} = ${JSON.stringify(value)} (${typeof value})`);
          return null;
        }

      }).filter(c => !_.isNull(c)).join(' AND ');
    }
    /*
    Helper.walk(condition, (x: WalkValues) => {
      console.log(x);

      if (/^$/.test(x.key)) {

      } else if (x.key) {
        // is object
        let mappedKey = this.lookupKeys(x.key);


        this.wheres.push(mappedKey)
      }
    })*/
  }


  $like(condition: any, key: string = null) {
    let _key = this.lookupKeys(key);
    return `${_key} LIKE '${condition['$like']}'`
  }

  $in(condition: any, key: string = null) {
    let _key = this.lookupKeys(key);
    return `${_key} IN (${condition['$in'].join(',')})`
  }

  $and(condition: any, key: string = null): string {
    return '(' + _.map(condition['$and'], c => this.build(c, null)).join(') AND (') + ')';
  }

  $or(condition: any, key: string = null): string {
    return '(' + _.map(condition['$or'], c => this.build(c, null)).join(') OR (') + ')';
  }

}
