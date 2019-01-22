import {suite, test} from 'mocha-typescript';

import {expect} from 'chai';
import {And, ClassRef, ConditionValidationError, Eq, Key, Value} from "../../src";
import {TestHelper} from "./TestHelper";
import {inspect} from "util";
import {Expressions} from "../../src/libs/expressions/Expressions";


@suite('functional/expressions')
class ExpressionsSpec {


  before() {
    TestHelper.resetTypeorm();
  }

  @test
  async 'source and target keys'() {

    const cond_01 = And(Eq('tableName', Value('condition_keeper')), Eq('tableId', Key('id')));
    let source_keys = cond_01.getSourceKeys();
    expect(source_keys).to.deep.eq(['tableName', 'tableId']);

    let target_keys = cond_01.getTargetKeys();
    expect(target_keys).to.deep.eq(['id']);


  }

  @test
  async 'validate against source and target class'() {

    const cond_01 = And(Eq('tableName', Value('condition_keeper')), Eq('tableId', Key('id')));

    const ConditionHolder = require('./schemas/default/ConditionHolder').ConditionHolder;
    const ConditionKeeper = require('./schemas/default/ConditionKeeper').ConditionKeeper;

    let referred = ClassRef.get(ConditionHolder);
    let referrer = ClassRef.get(ConditionKeeper);

    const isValid_01 = cond_01.validate(referred, referrer);
    expect(isValid_01).to.be.true;

    const cond_02 = And(Eq('tableNameWrong', Value('condition_keeper')), Eq('tableId', Key('id')));
    const isValid_02 = cond_02.validate(referred, referrer, false);
    expect(isValid_02).to.be.false;
    expect(function () {
      cond_02.validate(referred, referrer)
    }).to.throw(ConditionValidationError);
    expect(function () {
      cond_02.validate(referred, referrer)
    }).to.throw('validation error: referred key(s) tableNameWrong not in sourceRef');

    const cond_03 = Eq('tableId', Key('ids'));
    const isValid_03 = cond_03.validate(referred, referrer, false);
    expect(isValid_03).to.be.false;
    expect(function () {
      cond_03.validate(referred, referrer)
    }).to.throw(ConditionValidationError);
    expect(function () {
      cond_03.validate(referred, referrer)
    }).to.throw('validation error: referrer key(s) ids not in targetRef');
  }


  @test
  async 'test on class reference'() {
    const cond_01 = And(Eq('holders.tableName', Value('condition_keeper')), Eq('holders.tableId', Value(23)));
    let log: string[] = [];
    const ConditionHolder = require('./schemas/default/ConditionHolder').ConditionHolder;
    const ConditionKeeper = require('./schemas/default/ConditionKeeper').ConditionKeeper;

    let referrer = ClassRef.get(ConditionKeeper);
    let test = cond_01.test(referrer);
    expect(test).to.be.true;

    const cond_02 = Eq('tableName', Value('condition_keeper'));
    referrer = ClassRef.get(ConditionKeeper);
    test = cond_02.test(referrer, log);
    expect(test).to.be.false;
    expect(log.shift()).to.be.eq('key tableName is no property of ConditionKeeper');

    referrer = ClassRef.get(ConditionHolder);
    test = cond_02.test(referrer, log);
    expect(test).to.be.true;
  }

  @test
  async 'get map'() {
    const cond_02 = And(Eq('tableNameWrong', Value('condition_keeper')), Eq('tableId', Key('id')));
    let map = cond_02.getMap();
    expect(map).to.be.deep.eq({tableNameWrong: '\'condition_keeper\'', tableId: 'id'});
  }


  @test
  async 'to and from json for "and" expression'() {
    const cond_02 = And(Eq('tableNameWrong', Value('condition_keeper')), Eq('tableId', Key('id')));
    let json = cond_02.toJson();
    let cond_parsed = Expressions.fromJson(json);
    let json2 = cond_parsed.toJson();
    expect(json).to.deep.eq(json2);

  }

  @test
  async 'from json for simple equal expression'() {
    const json_src_full = {
      test: {$eq: 'hallo'}
    };
    const json_src = {
      test: 'hallo'
    };
    let cond_parsed = Expressions.fromJson(json_src);
    let json2 = cond_parsed.toJson();
    expect(json2).to.deep.eq(json_src_full);

    cond_parsed = Expressions.fromJson(json_src_full);
    json2 = cond_parsed.toJson();
    expect(json2).to.deep.eq(json_src_full);

  }


  @test
  async 'from json for implicit and expression'() {
    const json_src_full = {
      $and: [
        {test: {$eq: 'hallo'}},
        {test2: {$eq: 2}},
      ]

    };
    const json_src = {
      test: 'hallo',
      test2: 2
    };
    let cond_parsed = Expressions.fromJson(json_src);
    let json2 = cond_parsed.toJson();
    expect(json2).to.deep.eq(json_src_full);

    cond_parsed = Expressions.fromJson(json_src_full);
    json2 = cond_parsed.toJson();
    expect(json2).to.deep.eq(json_src_full);

  }


  @test
  async 'from json for multiple and | or combined expression'() {
    const json_src_full = {
      $and: [
        {test: {$eq: 'hallo'}},
        {test2: {$eq: 2}},
        {
          $or: [
            {welt: {$eq: 'test'}}, {welt: {$eq: 2}}
          ]
        }
      ]
    };


    let cond_parsed = Expressions.fromJson(json_src_full);
    let json2 = cond_parsed.toJson();
    expect(json2).to.deep.eq(json_src_full);

    const json_src_full2 = {
      $and: [
        {
          $or: [
            {welt: {$eq: 'test'}}, {welt: {$eq: '2'}}
          ]
        },
        {
          $or: [
            {welt2: {$eq: 'test'}}, {welt2: {$eq: 2}}
          ]
        }

      ]
    };


    cond_parsed = Expressions.fromJson(json_src_full2);
    json2 = cond_parsed.toJson();
    expect(json2).to.deep.eq(json_src_full2);

  }


  @test
  async 'from json support for "in" expression'() {
    const json_src_full2 = {
      welt: {$in: ['test', 2]}
    };


    let cond_parsed = Expressions.fromJson(json_src_full2);
    let json2 = cond_parsed.toJson();
    expect(json2).to.deep.eq(json_src_full2);
  }
}

