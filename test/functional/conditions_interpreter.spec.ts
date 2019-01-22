import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {EntityController} from "../../src";
import {TestHelper} from "./TestHelper";
import {StorageRef} from "@typexs/base";
import {ConditionsInterpreter} from "../../src/libs/conditions/ConditionsInterpreter";


@suite('functional/conditions_interpreter')
class Conditions_interpreterSpec {

  before() {
    TestHelper.resetTypeorm();
  }

  async connect(options: any): Promise<{ ref: StorageRef, controller: EntityController }> {
    return TestHelper.connect(options);
  }

  @test
  async 'simple string equal condition'() {
    let conditions_string = '\'test\' = \'searchfor\'';
    let interpreter = new ConditionsInterpreter();
    let cond = interpreter.interprete(conditions_string);
    let json = cond.toJson();
    expect(json).to.deep.eq({
      'test': {'$eq': 'searchfor'}
    });
  }

  @test
  async 'simple numeric equal condition'() {
    let conditions_string = '\'testnr\' = 1';

    let interpreter = new ConditionsInterpreter();
    let cond = interpreter.interprete(conditions_string);
    let json = cond.toJson();
    expect(json).to.deep.eq({
      'testnr': {$eq: 1}
    });
  }


  @test
  async '"and" boolean grouping'() {
    let conditions_string = '\'testnr\' = 1 AND \'test\' = \'searchfor\'';
    let interpreter = new ConditionsInterpreter();
    let cond = interpreter.interprete(conditions_string);
    console.log(interpreter.queue)
    let json = cond.toJson();
    expect(json).to.deep.eq({
      '$and': [
        {testnr: {$eq: 1}},
        {test: {$eq: 'searchfor'}},
      ]
    });
  }

  @test
  async '"or" boolean grouping'() {
    let conditions_string = '\'testnr\' = 1 OR \'test\' = \'searchfor\'';
    let interpreter = new ConditionsInterpreter();
    let cond = interpreter.interprete(conditions_string);
    //console.log(interpreter.queue)
    let json = cond.toJson();
    expect(json).to.deep.eq({
      '$or': [
        {testnr: {$eq: 1}},
        {test: {$eq: 'searchfor'}},
      ]
    });
  }

  @test
  async 'multiple "and" boolean grouping'() {
    let conditions_string = '\'testnr\' = 1 AND \'test\' = \'searchfor\' AND adc.def=1';
    let interpreter = new ConditionsInterpreter();
    let cond = interpreter.interprete(conditions_string);
    //console.log(interpreter.queue)
    let json = cond.toJson();
    expect(json).to.deep.eq({
      '$and': [
        {testnr: {$eq: 1}},
        {test: {$eq: 'searchfor'}},
        {'adc.def': {$eq: 1}},
      ]
    });
  }


  @test
  async 'multiple "or" boolean grouping'() {
    let conditions_string = '\'testnr\' = 1 OR \'test\' = \'searchfor\' OR adc.def=1';
    let interpreter = new ConditionsInterpreter();
    let cond = interpreter.interprete(conditions_string);
    //console.log(interpreter.queue)
    let json = cond.toJson();
    expect(json).to.deep.eq({
      '$or': [
        {testnr: {$eq: 1}},
        {test: {$eq: 'searchfor'}},
        {'adc.def': {$eq: 1}},
      ]
    });
  }

  @test
  async 'combination of "and" and "or" expressions'() {
    let conditions_string = '\'testnr\' = 1 AND \'test\' = \'searchfor\' OR adc.def=1';
    let interpreter = new ConditionsInterpreter();
    let cond = interpreter.interprete(conditions_string);
    //console.log(interpreter.queue)
    let json = cond.toJson();
    expect(json).to.deep.eq({
      "$or": [
        {
          "$and": [
            {"testnr": {"$eq": 1}},
            {"test": {"$eq": "searchfor"}}
          ]
        },
        {"adc.def": {"$eq": 1}}
      ]
    });
  }


  @test
  async 'full expression brackets'() {
    let conditions_string = '(\'testnr\' = 1 AND \'test\' = \'searchfor\')';
    let interpreter = new ConditionsInterpreter();
    let cond = interpreter.interprete(conditions_string);
    //console.log(interpreter.queue);

    let json = cond.toJson();
    expect(json).to.deep.eq({
      '$and': [
        {testnr: {$eq: 1}},
        {test: {$eq: 'searchfor'}},
      ]
    });
  }


  @test
  async 'single expression brackets without boolean operator'() {
    let conditions_string = '\'testnr\' = 1 AND (\'test\' = \'searchfor\')';
    let interpreter = new ConditionsInterpreter();
    let cond = interpreter.interprete(conditions_string);
    // console.log(inspect(interpreter.queue,false,10));

    let json = cond.toJson();
    expect(json).to.deep.eq({
      '$and': [
        {testnr: {$eq: 1}},
        {test: {$eq: 'searchfor'}},
      ]
    });

    conditions_string = '\'testnr\' = 1 AND ((\'test\' = \'searchfor\'))';
    interpreter = new ConditionsInterpreter();
    cond = interpreter.interprete(conditions_string);
    //console.log(inspect(interpreter.queue,false,10));

    json = cond.toJson();
    expect(json).to.deep.eq({
      '$and': [
        {testnr: {$eq: 1}},
        {test: {$eq: 'searchfor'}},
      ]
    });

    conditions_string = '(\'testnr\' = 1 AND (\'test\' = \'searchfor\'))';
    interpreter = new ConditionsInterpreter();
    cond = interpreter.interprete(conditions_string);

    json = cond.toJson();
    expect(json).to.deep.eq({
      '$and': [
        {testnr: {$eq: 1}},
        {test: {$eq: 'searchfor'}},
      ]
    });
  }


  @test
  async '"like" expression'() {
    let conditions_string = 'test like \'searchfor\'';
    let interpreter = new ConditionsInterpreter();
    let cond = interpreter.interprete(conditions_string);
    //console.log(interpreter.queue);

    let json = cond.toJson();
    expect(json).to.deep.eq(
      {test: {$like: 'searchfor'}}
    );
  }


  @test
  async '"in" expression'() {
    let conditions_string = 'test in (\'searchfor\')';
    let interpreter = new ConditionsInterpreter();
    let cond = interpreter.interprete(conditions_string);
    //console.log(interpreter.queue);

    let json = cond.toJson();
    expect(json).to.deep.eq(
      {test: {$in: ['searchfor']}}
    );

    //let obj = {test:'searchfor'};
    //let erg = cond.lookup(obj);


    conditions_string = 'test in (\'searchfor\', 3)';
    interpreter = new ConditionsInterpreter();
    cond = interpreter.interprete(conditions_string);
    //console.log(interpreter.queue);

    json = cond.toJson();
    expect(json).to.deep.eq(
      {test: {$in: ['searchfor', 3]}}
    );



  }


}

