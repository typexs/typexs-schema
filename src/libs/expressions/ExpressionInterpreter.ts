import * as _ from 'lodash';
import {And, ExprDesc, EntityDef, Eq, Ge, GroupDesc, Key, Le, Or, Value} from "../..";
import {Like} from "../descriptors/LikeDesc";
import {Lt} from "../descriptors/LtDesc";
import {Gt} from "../descriptors/GtDesc";
import {In} from "../descriptors/InDesc";
import {Neq} from "../descriptors/NeqDesc";


export class ExpressionInterpreter {

  //rootEntityDef:EntityDef;

  groupLevel: number = 0;

  ops: any[] = [
    {
      name: 'visitGroup',
      regex: /\(/,
      method: this.visitGroup,
      after: [null, 'visitGroup', 'onBool']
    },
    {
      name: 'leaveGroup',
      regex: /\)/,
      method: this.leaveGroup,
      condition: () => {
        return this.groupLevel > 0;
      },
      after: ['onValue', 'leaveGroup']
    },
    {
      name: 'onKey',
      regex: /('[^']+')|("[^"]+")|(\w|\.|\d)+/,
      method: this.onKey,
      skipIndex: 3,
      after: [null, 'visitGroup', 'onBool']
    },
    {
      name: 'onBool',
      regex: / (and|AND|or|OR) /,
      method: this.onBool,
      skipIndex: 1,
      after: ['leaveGroup', 'onValue']
    },
    {
      name: 'onOperator',
      regex: /(>=|<=|<>|>|<|=| in | IN | like | LIKE )/,
      method: this.onOperator,
      skipIndex: 1,
      after: ['onKey']
    },
    {
      name: 'onValue',
      regex: /('[^']*')|("[^"]*")|\d+|\d+.\d+|(\(((('[^']*')|("[^"]*")|\d+|\d+.\d+)\s*,?\s*)+\))/,
      method: this.onValue,
      skipIndex: 7,
      after: ['onOperator']
    },
  ];

  res: ExprDesc[] = [];

  queue: any[] = [];

  regex: RegExp;

  constructor() {
    //this.rootEntityDef = entityDef;
  }


  interprete(str: string) {
    this.fragmentize(str);
    return _.first(this.res);
  }


  fragmentize(str: string) {
    let lastState = _.last(this.queue);

    let currentOps = this.ops.filter(x => {
      let _true = true;
      if (x.condition) {
        _true = x.condition();
      }
      if (_.isEmpty(x.after)) {
        return _true;
      }

      if (!lastState) {
        return _true && x.after.indexOf(null) > -1
      } else {
        return _true && x.after.indexOf(lastState.state) > -1
      }

    });
    //console.log(currentOps.map(x => x.name));
    let inc = 0;
    let map: any = {};
    currentOps.map((x, index) => {
      map[inc] = index;
      inc = x.skipIndex ? inc + x.skipIndex : inc + 1;
    });

    const regex = new RegExp('^\\s*' + currentOps.map(x => '(' + x.regex.source + ')').join('|'), 'gim');
    let arr = regex.exec(str);
    if (arr) {
      let index = _.findIndex(arr, x => !_.isUndefined(x), 1) - 1;

      if (index > -1) {
        let opId = map[index]
        let op = currentOps[opId];
        // console.log(map, regex, arr, regex.lastIndex,op.name);
        op.method.apply(this, [arr[index + 1], str]);
        const nextStr = str.substring(regex.lastIndex);
        if (!_.isEmpty(nextStr)) {
          this.fragmentize(nextStr);
        }
      } else {
        throw new Error('no match found at "' + JSON.stringify(arr) + '"');
      }
    } else {
      throw new Error('nothing found at "' + str + '" with regex '+regex.source);
    }
  }

  /*
    escape(x: string) {
      const specials = [
        '/', '.', '*', '+', '?', '|',
        '(', ')', '[', ']', '{', '}', '\\'
      ];
      const regex = new RegExp('(\\' + specials.join('|\\') + ')', 'gim');
      return x.replace(regex, '\\$1');
    }
  */

  onKey(match: string, str: string) {
    let key = match.replace(/^('|")|('|")$/g, '');
    this.queue.push({
      group: this.groupLevel,
      value: key,
      state: 'onKey'
    });

  }


  onOperator(match: string, str: string) {
    this.queue.push({
      group: this.groupLevel,
      value: match,
      state: 'onOperator'
    });
  }


  onValue(match: string, str: string) {
    let value: any;
    if (/^('|")|('|")$/.test(match)) {
      value = match.replace(/^('|")|('|")$/g, '');
    } else if (/^\d+$/.test(match)) {
      value = parseInt(match);
    } else if (/^\d+\.\d+$/.test(match)) {
      value = parseFloat(match);
    } else if (/^\(.*\)$/.test(match)) {
      value = match.replace(/^\(|\)$/g, '').split(',').map(x => x.trim())
        .map(x => {
          let value2: any = x;
          if (/^('|")|('|")$/.test(x)) {
            value2 = x.replace(/^('|")|('|")$/g, '');
          } else if (/^\d+$/.test(x)) {
            value2 = parseInt(x);
          } else if (/^\d+\.\d+$/.test(x)) {
            value2 = parseFloat(x);
          }
          return value2;
        });
    }


    let op = this.queue.pop();
    let key = this.queue.pop();


    let erg: ExprDesc;
    if (op.state == 'onOperator' && key && key.state == 'onKey') {
      switch (op.value.trim().toLowerCase()) {
        case '=':
          erg = Eq(Key(key.value), Value(value));
          break;
        case 'like':
          erg = Like(Key(key.value), Value(value));
          break;
        case '<=':
          erg = Le(Key(key.value), Value(value));
          break;
        case '>=':
          erg = Ge(Key(key.value), Value(value));
          break;
        case '<':
          erg = Lt(Key(key.value), Value(value));
          break;
        case '>':
          erg = Gt(Key(key.value), Value(value));
          break;
        case 'in':
          erg = In(Key(key.value), Value(value));
          break;
        case '<>':
          erg = Neq(Key(key.value), Value(value));
          break;
        default:
          throw new Error('operator not found');
      }
    } else {
      throw new Error('operator not found');
    }


    this.queue.push({
      group: this.groupLevel,
      value: value,
      state: 'onValue',
      op: op,
      key: key,
      desc: erg
    });


    let res = _.last(this.res);
    if (res instanceof GroupDesc) {
      res.values.push(erg);
    } else {
      this.res.push(erg);
    }
  }


  visitGroup() {
    this.groupLevel++;


    let groupDesc = new GroupDesc();
    groupDesc.id = this.groupLevel;
    this.res.push(groupDesc);

    this.queue.push({
      group: this.groupLevel,
      desc: groupDesc,
      state: 'visitGroup'
    });
  }


  leaveGroup() {

    let group = _.find(this.res, g => g instanceof GroupDesc ? g.id == this.groupLevel : false);
    if (group && group.type == 'group') {
      _.remove(this.res, g => g instanceof GroupDesc ? g.id == this.groupLevel : false)
      // embedded withotu bool
      let prevGid = this.groupLevel - 1;
      let prevGroup = _.find(this.res, g => g instanceof GroupDesc ? g.id == prevGid : false);
      if (prevGroup) {
        group.values.forEach((v: ExprDesc) => prevGroup.values.push(v));
        group.values = [];
      } else {
        throw new Error('cant find previous group to move values to ... ');
      }
    }

    this.queue.push({
      group: this.groupLevel,
      state: 'leaveGroup',
      desc: group
    });


    //this.

    this.groupLevel--;
  }

  onBool(match: string) {
    let bool = match.trim().toLocaleUpperCase();
    let last = this.res.pop();
    let group: GroupDesc;

    if (last instanceof GroupDesc && last.id == this.groupLevel && last.type.toLowerCase() == bool.toLowerCase()) {
      // DO NOTTING
      group = last;
      this.res.push(group);
    } else if (last instanceof GroupDesc && last.type == 'group') {
      // undefined
      switch (bool) {
        case 'AND':
          group = And(...last.values);
          break;
        case 'OR':
          group = Or(...last.values);
          break;
      }
      group.id = this.groupLevel;
      this.res.push(group);
    } else {
      switch (bool) {
        case 'AND':
          group = And(last);
          break;
        case 'OR':
          group = Or(last);
          break;
      }
      group.id = this.groupLevel;
      this.res.push(group);
    }

    this.queue.push({
      group: this.groupLevel,
      value: match.trim().toLocaleUpperCase(),
      state: 'onBool',
      desc: group
    });

  }


}
