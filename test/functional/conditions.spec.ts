import {suite, test} from 'mocha-typescript';

import {expect} from 'chai';
import {And, ClassRef, ConditionValidationError, Eq, Key, Value} from "../../src";
import {TestHelper} from "./TestHelper";


@suite('functional/conditions')
class ConditionsSpec {


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
  async 'get map'() {
    const cond_02 = And(Eq('tableNameWrong', Value('condition_keeper')), Eq('tableId', Key('id')));
    let map = cond_02.getMap();
    expect(map).to.be.deep.eq({ tableNameWrong: '\'condition_keeper\'', tableId: 'id' });
  }
}

