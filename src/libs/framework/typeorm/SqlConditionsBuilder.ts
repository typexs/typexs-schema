import {SelectQueryBuilder} from 'typeorm';
import * as _ from 'lodash';
import {NameResolver} from '../../../libs/framework/typeorm/NameResolver';
import {NotYetImplementedError} from '@typexs/base';
import {ClassRef, IClassRef} from 'commons-schema-api/browser';
import {TypeOrmSqlConditionsBuilder} from '@typexs/base/libs/storage/framework/typeorm/TypeOrmSqlConditionsBuilder';
import {PropertyRef} from '../../registry/PropertyRef';
//
// export interface IConditionJoin {
//   alias: string;
//   table: string;
//   condition: string;
// }


export interface ISqlBuilderOptions {
  skipNull?: boolean;
}

export class SqlConditionsBuilder<T> extends TypeOrmSqlConditionsBuilder<T> {

  options: ISqlBuilderOptions = {};

  private nameResolver: NameResolver = new NameResolver();


  skipNull() {
    this.options.skipNull = true;
  }


  lookupKeys(key: string) {
    switch (this.type) {
      case 'delete':
      case 'update':
        return key;
    }

    if (this.mode === 'having') {
      return key;
    }

    const joins = [];
    const arrJoins = key.split('.');
    let tmp: IClassRef = this.entityRef.getClassRef();



    const alias = this.alias ? this.alias : this.baseQueryBuilder ? this.baseQueryBuilder.alias : null;
    let names: string[] = alias ? [alias] : [];
    let rootAlias = alias;
    for (const _join of arrJoins) {
      const prop = <PropertyRef>tmp.getPropertyRef(_join);
      if (prop.isReference()) {
        const from = tmp;
        tmp = prop.getTargetRef() ? <ClassRef>prop.getTargetRef() : null;
        let join: any = null;

        if (prop.hasConditions()) {
          join = {
            alias: this.createAlias(tmp),
            table: tmp.storingName,
            condition: null
          };

          const _condition = prop.getCondition();
          const conditions: string[] = [];

          const map = _condition.getMap();
          _.keys(map).forEach(targetKey => {
            // let c =
            const sourceKey = /\'/.test(map[targetKey]) ? map[targetKey] : rootAlias + '.' + map[targetKey];
            // this.baseQueryBuilder.escape()
            conditions.push([join.alias + '.' + targetKey, sourceKey].join(' = '));
          });
          join.condition = conditions.join(' AND ');
          joins.push(join);
          rootAlias = join.alias;
          names = [rootAlias];
        } else if (prop.hasJoin()) {
          throw new NotYetImplementedError();
        } else if (prop.hasIdKeys()) {
          throw new NotYetImplementedError();
        } else if (prop.isEmbedded()) {
          throw new NotYetImplementedError();
        } else if (prop.hasJoinRef()) {
          const joinRef = prop.joinRef;
          const sourceIds = from.getPropertyRefs().filter(x => x.isIdentifier());
          const targetIds = tmp.getPropertyRefs().filter(x => x.isIdentifier());

          let conditions: string[] = [];
          join = {
            alias: this.createAlias(joinRef),
            table: joinRef.storingName,
            condition: null
          };
          joins.push(join);
          sourceIds.forEach(x => {
            const [targetId, targetName] = this.nameResolver.forSource(<PropertyRef>x);
            conditions.push(join.alias + '.' + targetName + ' = ' + rootAlias + '.' + x.storingName);
          });
          join.condition = conditions.join(' AND ');
          rootAlias = join.alias;

          if (targetIds.length > 0) {
            // not an join over reference
            conditions = [];
            join = {
              alias: this.createAlias(tmp),
              table: tmp.storingName,
              condition: null
            };
            joins.push(join);

            targetIds.forEach(x => {
              const [targetId, targetName] = this.nameResolver.forTarget(<PropertyRef>x);
              conditions.push(join.alias + '.' + x.storingName + ' = ' + rootAlias + '.' + targetName);
            });
            join.condition = conditions.join(' AND ');
            rootAlias = join.alias;
          }
          names = [rootAlias];
        } else {
          join = {
            alias: this.createAlias(tmp),
            table: tmp.storingName,
            condition: null
          };
          joins.push(join);
          const conditions: string[] = [];
          from.getPropertyRefs().filter(x => x.isIdentifier()).forEach(property => {
            const [targetId, targetName] = this.nameResolver.forSource(<PropertyRef>property);
            conditions.push([join.alias + '.' + targetName, rootAlias + '.' + property.storingName].join(' = '));
          });
          join.condition = conditions.join(' AND ');
          rootAlias = join.alias;
          names = [rootAlias];
        }

      } else {
        names.push(prop.name);
      }
    }

    for (const _join of joins) {
      if (this.baseQueryBuilder instanceof SelectQueryBuilder) {
        this.baseQueryBuilder.leftJoin(_join.table, _join.alias, _join.condition);
      }
    }

    return names.join('.');
  }

}
