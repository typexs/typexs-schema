import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import {TestHelper} from './TestHelper';
import {StorageRef} from '@typexs/base';
import {ExpressionInterpreter} from '@allgemein/expressions';
import {EntityController} from '../../src/libs/EntityController';


@suite('functional/conditions_interpreter')
class ExpressionsInterpreterSpec {

  before() {
    TestHelper.resetTypeorm();
  }

  async connect(options: any): Promise<{ ref: StorageRef, controller: EntityController }> {
    return TestHelper.connect(options);
  }

  @test
  async 'simple string equal condition'() {
    const conditions_string = '\'test\' = \'searchfor\'';
    const interpreter = new ExpressionInterpreter();
    const cond = interpreter.interprete(conditions_string);
    const json = cond.toJson();
    expect(json).to.deep.eq({
      'test': {'$eq': 'searchfor'}
    });
  }

  @test
  async 'simple numeric equal condition'() {
    const conditions_string = '\'testnr\' = 1';

    const interpreter = new ExpressionInterpreter();
    const cond = interpreter.interprete(conditions_string);
    const json = cond.toJson();
    expect(json).to.deep.eq({
      'testnr': {$eq: 1}
    });
  }


  @test
  async '"and" boolean grouping'() {
    const conditions_string = '\'testnr\' = 1 AND \'test\' = \'searchfor\'';
    const interpreter = new ExpressionInterpreter();
    const cond = interpreter.interprete(conditions_string);
    // console.log(interpreter.queue)
    const json = cond.toJson();
    expect(json).to.deep.eq({
      '$and': [
        {testnr: {$eq: 1}},
        {test: {$eq: 'searchfor'}},
      ]
    });
  }

  @test
  async '"or" boolean grouping'() {
    const conditions_string = '\'testnr\' = 1 OR \'test\' = \'searchfor\'';
    const interpreter = new ExpressionInterpreter();
    const cond = interpreter.interprete(conditions_string);
    // console.log(interpreter.queue)
    const json = cond.toJson();
    expect(json).to.deep.eq({
      '$or': [
        {testnr: {$eq: 1}},
        {test: {$eq: 'searchfor'}},
      ]
    });
  }

  @test
  async 'multiple "and" boolean grouping'() {
    const conditions_string = '\'testnr\' = 1 AND \'test\' = \'searchfor\' AND adc.def=1';
    const interpreter = new ExpressionInterpreter();
    const cond = interpreter.interprete(conditions_string);
    // console.log(interpreter.queue)
    const json = cond.toJson();
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
    const conditions_string = '\'testnr\' = 1 OR \'test\' = \'searchfor\' OR adc.def=1';
    const interpreter = new ExpressionInterpreter();
    const cond = interpreter.interprete(conditions_string);
    // console.log(interpreter.queue)
    const json = cond.toJson();
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
    const conditions_string = '\'testnr\' = 1 AND \'test\' = \'searchfor\' OR adc.def=1';
    const interpreter = new ExpressionInterpreter();
    const cond = interpreter.interprete(conditions_string);
    // console.log(interpreter.queue)
    const json = cond.toJson();
    expect(json).to.deep.eq({
      '$or': [
        {
          '$and': [
            {'testnr': {'$eq': 1}},
            {'test': {'$eq': 'searchfor'}}
          ]
        },
        {'adc.def': {'$eq': 1}}
      ]
    });
  }


  @test
  async 'full expression brackets'() {
    const conditions_string = '(\'testnr\' = 1 AND \'test\' = \'searchfor\')';
    const interpreter = new ExpressionInterpreter();
    const cond = interpreter.interprete(conditions_string);
    // console.log(interpreter.queue);

    const json = cond.toJson();
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
    let interpreter = new ExpressionInterpreter();
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
    interpreter = new ExpressionInterpreter();
    cond = interpreter.interprete(conditions_string);
    // console.log(inspect(interpreter.queue,false,10));

    json = cond.toJson();
    expect(json).to.deep.eq({
      '$and': [
        {testnr: {$eq: 1}},
        {test: {$eq: 'searchfor'}},
      ]
    });

    conditions_string = '(\'testnr\' = 1 AND (\'test\' = \'searchfor\'))';
    interpreter = new ExpressionInterpreter();
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
    const conditions_string = 'test like \'searchfor\'';
    const interpreter = new ExpressionInterpreter();
    const cond = interpreter.interprete(conditions_string);
    // console.log(interpreter.queue);

    const json = cond.toJson();
    expect(json).to.deep.eq(
      {test: {$like: 'searchfor'}}
    );
  }


  @test
  async '"in" expression'() {
    let conditions_string = 'test in (\'searchfor\')';
    let interpreter = new ExpressionInterpreter();
    let cond = interpreter.interprete(conditions_string);
    // console.log(interpreter.queue);

    let json = cond.toJson();
    expect(json).to.deep.eq(
      {test: {$in: ['searchfor']}}
    );

    // let obj = {test:'searchfor'};
    // let erg = cond.lookup(obj);


    conditions_string = 'test in (\'searchfor\', 3)';
    interpreter = new ExpressionInterpreter();
    cond = interpreter.interprete(conditions_string);
    // console.log(interpreter.queue);

    json = cond.toJson();
    expect(json).to.deep.eq(
      {test: {$in: ['searchfor', 3]}}
    );


  }


}

