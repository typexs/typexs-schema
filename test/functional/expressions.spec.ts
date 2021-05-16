import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import {TestHelper} from './TestHelper';
import {And, Eq, Expressions, ExpressionValidationError, Key, Value} from '@allgemein/expressions';
import {EntityRegistry} from '../../src/libs/EntityRegistry';
import {METATYPE_CLASS_REF} from '@allgemein/schema-api';


@suite('functional/expressions')
class ExpressionsSpec {


  before() {
    TestHelper.resetTypeorm();
  }

  @test
  async 'source and target keys'() {

    const cond_01 = And(Eq('tableName', Value('condition_keeper')), Eq('tableId', Key('id')));
    const source_keys = cond_01.getSourceKeys();
    expect(source_keys).to.deep.eq(['tableName', 'tableId']);

    const target_keys = cond_01.getTargetKeys();
    expect(target_keys).to.deep.eq(['id']);


  }

  @test
  async 'validate against source and target class'() {
    const registry = EntityRegistry.$();
    const cond_01 = And(Eq('tableName', Value('condition_keeper')), Eq('tableId', Key('id')));

    const ConditionHolder = require('./schemas/default/ConditionHolder').ConditionHolder;
    const ConditionKeeper = require('./schemas/default/ConditionKeeper').ConditionKeeper;

    const referred = registry.getClassRefFor(ConditionHolder, METATYPE_CLASS_REF);
    const referrer = registry.getClassRefFor(ConditionKeeper, METATYPE_CLASS_REF);

    const isValid_01 = cond_01.validate(registry, referred, referrer);
    expect(isValid_01).to.be.true;

    const cond_02 = And(Eq('tableNameWrong', Value('condition_keeper')), Eq('tableId', Key('id')));
    const isValid_02 = cond_02.validate(registry, referred, referrer, false);
    expect(isValid_02).to.be.false;
    expect(function () {
      cond_02.validate(registry, referred, referrer);
    }).to.throw(ExpressionValidationError);
    expect(function () {
      cond_02.validate(registry, referred, referrer); // TODO fix this message
    }).to.throw('referred key(s) tableNameWrong not in sourceRef');

    const cond_03 = Eq('tableId', Key('ids'));
    const isValid_03 = cond_03.validate(registry, referred, referrer, false);
    expect(isValid_03).to.be.false;
    expect(function () {
      cond_03.validate(registry, referred, referrer);
    }).to.throw(ExpressionValidationError);
    expect(function () {
      cond_03.validate(registry, referred, referrer);
    }).to.throw('referrer key(s) ids not in targetRef');
  }


  @test
  async 'test on class reference'() {
    const registry = EntityRegistry.$();
    const cond_01 = And(Eq('holders.tableName', Value('condition_keeper')), Eq('holders.tableId', Value(23)));
    const log: string[] = [];
    const ConditionHolder = require('./schemas/default/ConditionHolder').ConditionHolder;
    const ConditionKeeper = require('./schemas/default/ConditionKeeper').ConditionKeeper;

    let referrer = registry.getClassRefFor(ConditionKeeper, METATYPE_CLASS_REF);
    // let referrer = classRefGet(ConditionKeeper);
    let test = cond_01.test(referrer);
    expect(test).to.be.true;

    const cond_02 = Eq('tableName', Value('condition_keeper'));
    referrer = registry.getClassRefFor(ConditionKeeper, METATYPE_CLASS_REF);
    // referrer = classRefGet(ConditionKeeper);
    test = cond_02.test(referrer, log);
    expect(test).to.be.false;
    expect(log.shift()).to.be.eq('key tableName is no property of ConditionKeeper');

    referrer = registry.getClassRefFor(ConditionHolder, METATYPE_CLASS_REF);
    // referrer = classRefGet(ConditionHolder);
    test = cond_02.test(referrer, log);
    expect(test).to.be.true;
  }

  @test
  async 'get map'() {
    const cond_02 = And(Eq('tableNameWrong', Value('condition_keeper')), Eq('tableId', Key('id')));
    const map = cond_02.getMap();
    expect(map).to.be.deep.eq({tableNameWrong: '\'condition_keeper\'', tableId: 'id'});
  }


  @test
  async 'to and from json for "and" expression'() {
    const cond_02 = And(Eq('tableNameWrong', Value('condition_keeper')), Eq('tableId', Key('id')));
    const json = cond_02.toJson();
    const cond_parsed = Expressions.fromJson(json);
    const json2 = cond_parsed.toJson();
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


    const cond_parsed = Expressions.fromJson(json_src_full2);
    const json2 = cond_parsed.toJson();
    expect(json2).to.deep.eq(json_src_full2);
  }
}

