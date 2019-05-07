import * as _ from 'lodash';
import {EntityRef} from "../../registry/EntityRef";
import {NameResolver} from "../../../libs/framework/typeorm/NameResolver";
import {NotYetImplementedError} from "@typexs/base/browser";
import {ClassRef} from "commons-schema-api/browser";
import {PropertyRef} from "../../..";
import {AbstractSqlConditionsBuilder} from "@typexs/base/libs/storage/framework/AbstractSqlConditionsBuilder";

export interface IConditionJoin {
  alias: string;
  table: string;
  condition: string;
}


export interface ISqlBuilderOptions {
  skipNull?: boolean;
}

export class SqlConditionsBuilder extends AbstractSqlConditionsBuilder {

  options: ISqlBuilderOptions = {};

  private nameResolver: NameResolver = new NameResolver();

  constructor(entityDef: EntityRef, alias: string = null) {
    super(entityDef, alias);
    this.inc = 1;
    this.options.skipNull = false;
  }

  skipNull() {
    this.options.skipNull = true;
  }


  lookupKeys(key: string) {
    let joins = key.split('.');
    let tmp = this.entityDef.getClassRef();
    let names: string[] = [this.alias];
    let rootAlias = this.alias;
    for (let _join of joins) {
      let prop = <PropertyRef>tmp.getPropertyRef(_join);
      if (prop.isReference()) {
        let from = tmp;
        tmp = prop.getTargetRef() ? <ClassRef>prop.getTargetRef() : null;
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
          });
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
          let sourceIds = from.getPropertyRefs().filter(x => x.isIdentifier());
          let targetIds = tmp.getPropertyRefs().filter(x => x.isIdentifier());

          let conditions: string[] = [];
          join = {
            alias: this.createAlias(joinRef),
            //      from: from,
            //    ref: prop,
            table: joinRef.storingName,
            condition: null
          };
          this.joins.push(join);
          sourceIds.forEach(x => {
            let [targetId, targetName] = this.nameResolver.forSource(<PropertyRef>x);
            conditions.push(join.alias + '.' + targetName + ' = ' + rootAlias + '.' + x.storingName);
          });
          join.condition = conditions.join(' AND ');
          rootAlias = join.alias;

          if (targetIds.length > 0) {
            // not an join over reference
            conditions = [];
            join = {
              alias: this.createAlias(tmp),
              //      from: from,
              //    ref: prop,
              table: tmp.storingName,
              condition: null
            };
            this.joins.push(join);

            targetIds.forEach(x => {
              let [targetId, targetName] = this.nameResolver.forTarget(<PropertyRef>x);
              conditions.push(join.alias + '.' + x.storingName + ' = ' + rootAlias + '.' + targetName);
            });
            join.condition = conditions.join(' AND ');
            rootAlias = join.alias;
          }
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
          from.getPropertyRefs().filter(x => x.isIdentifier()).forEach(property => {
            let [targetId, targetName] = this.nameResolver.forSource(<PropertyRef>property);
            conditions.push([join.alias + '.' + targetName, rootAlias + '.' + property.storingName].join(' = '))
          });
          join.condition = conditions.join(' AND ');
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
        return this[control](condition, k, condition[control]);
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
        } else if (_.isNull(value)) {
          if (this.options.skipNull) {
            return null;
          }
          return `${key} is NULL`
        } else {
          throw new Error(`SQL.build not a plain type ${key} = ${JSON.stringify(value)} (${typeof value})`);
          //return null;
        }

      }).filter(c => !_.isNull(c)).join(' AND ');
    }
  }

  escape(str: any) {
    if (_.isString(str)) {
      str = str.replace(/'/g, "\\'");
    }
    return str;
  }

  $eq(condition: any, key: string = null, value: any = null) {
    let _key = this.lookupKeys(key);
    return `${_key} = '${this.escape(value)}'`
  }

  $ne(condition: any, key: string = null, value: any = null) {
    let _key = this.lookupKeys(key);
    return `${_key} <> '${this.escape(value)}'`
  }

  $lt(condition: any, key: string = null, value: any = null) {
    let _key = this.lookupKeys(key);
    return `${_key} < ${this.escape(value)}`
  }

  $le(condition: any, key: string = null, value: any = null) {
    let _key = this.lookupKeys(key);
    return `${_key} <= ${this.escape(value)}`
  }

  $gt(condition: any, key: string = null, value: any = null) {
    let _key = this.lookupKeys(key);
    return `${_key} > ${this.escape(value)}`
  }

  $ge(condition: any, key: string = null, value: any = null) {
    let _key = this.lookupKeys(key);
    return `${_key} >= ${this.escape(value)}`
  }

  $like(condition: any, key: string = null, value: any = null) {
    let _key = this.lookupKeys(key);
    return `${_key} LIKE '${this.escape(value).replace(/%/g, '%%').replace(/\*/g, '%')}'`
  }

  $in(condition: any, key: string = null, value: any = null) {
    let _key = this.lookupKeys(key);
    return `${_key} IN (${value.map((x: any) => this.escape(x)).join(',')})`
  }

  $isNull(condition: any, key: string = null, value: any = null) {
    let _key = this.lookupKeys(key);
    return `${_key} IS NULL`
  }

  $isNotNull(condition: any, key: string = null, value: any = null) {
    let _key = this.lookupKeys(key);
    return `${_key} IS NOT NULL`
  }

  $and(condition: any, key: string = null): string {
    let x = _.map(condition['$and'], c => this.build(c, null)).filter(x => !_.isEmpty(x));
    if(_.isEmpty(x)){
      return ''
    }else{
      return '(' + x.join(') AND (') + ')';
    }
  }

  $or(condition: any, key: string = null): string {
    let x = _.map(condition['$or'], c => this.build(c, null)).filter(x => !_.isEmpty(x));
    if(_.isEmpty(x)){
      return ''
    }else{
      return '(' + x.join(') OR (') + ')';
    }
  }

}
