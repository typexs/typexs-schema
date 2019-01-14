import {suite, test} from 'mocha-typescript';
import {IStorageOptions} from '@typexs/base';
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import * as _ from "lodash";
import {TestHelper} from "./TestHelper";

import {expect} from 'chai';
import {inspect} from "util";
import {TEST_STORAGE_OPTIONS} from "./config";
import {CondEntityHolder} from "./schemas/conditions/CondEntityHolder";

@suite('functional/scenario_06_conditions')
class Scenario_06_conditions {


  before() {
    TestHelper.resetTypeorm();
  }

  @test.skip()
  async 'entity lifecycle for conditional properties of type E-P-E'() {
  }

  @test
  async 'entity lifecycle for conditional properties of type E-P-E[]'() {
    const ConditionHolder = require('./schemas/default/ConditionHolder').ConditionHolder;
    const ConditionKeeper = require('./schemas/default/ConditionKeeper').ConditionKeeper;

    let options = _.clone(TEST_STORAGE_OPTIONS);

    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    // condition holder without condition setted fields
    let holder_01 = new ConditionHolder();
    let holder_02 = new ConditionHolder();

    let keeper_save_01 = new ConditionKeeper();
    keeper_save_01.holders = [holder_01, holder_02];
    keeper_save_01 = await xsem.save(keeper_save_01, {validate: false});
    console.log(keeper_save_01);

    let keeper_found = await xsem.find(ConditionKeeper, {id: 1});
    let keeper_find_01 = keeper_found.shift();
    console.log(keeper_find_01);
    expect(keeper_save_01).to.deep.eq(keeper_find_01);

    // condition holder with condition setted fields


  }

  @test.skip()
  async 'entity lifecycle for conditional properties of type E-P-O'() {
  }


  @test
  async 'entity lifecycle for conditional properties of type E-P-O[]'() {
    const ConditionObjectHolder = require('./schemas/default/ConditionObjectHolder').ConditionObjectHolder;
    const ConditionObjectKeeper = require('./schemas/default/ConditionObjectKeeper').ConditionObjectKeeper;

    let options = _.clone(TEST_STORAGE_OPTIONS);

    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    // condition holder without condition setted fields
    let holder_01 = new ConditionObjectHolder();
    let holder_02 = new ConditionObjectHolder();

    let keeper_save_01 = new ConditionObjectKeeper();
    keeper_save_01.objects = [holder_01, holder_02];
    keeper_save_01 = await xsem.save(keeper_save_01, {validate: false});
    console.log(keeper_save_01);

    let keeper_found = await xsem.find(ConditionObjectKeeper, {id: 1});
    let keeper_find_01 = keeper_found.shift();
    console.log(keeper_find_01);
    expect(keeper_save_01).to.deep.eq(keeper_find_01);

    // condition holder with condition setted fields


  }

  @test
  async 'entity lifecycle for conditional properties of type E-P-O[] with order '() {
    const CondEntityHolder = require('./schemas/conditions/CondEntityHolder').CondEntityHolder;
    const CondObjectContent = require('./schemas/conditions/CondObjectContent').CondObjectContent;

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'conditions';

    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    // condition holder without condition setted fields
    let holder_01 = new CondEntityHolder();
    holder_01.mynr = 2;
    holder_01.contents = []

    let content_01 = new CondObjectContent();
    ;
    content_01.nickname = 'Robert';
    content_01.somenr = holder_01.mynr;
    content_01.subnr = 1;

    let content_02 = new CondObjectContent();
    ;
    content_02.nickname = 'Franz';
    content_02.somenr = holder_01.mynr;
    content_02.subnr = 2;

    holder_01.contents = [content_01, content_02];
    holder_01 = await xsem.save(holder_01);
    expect(holder_01).to.exist;
    expect(holder_01.id).to.be.gt(0);
    expect(holder_01.contents).to.have.length(2);
    expect(holder_01.contents[0]).to.deep.eq(content_01);
    expect(holder_01.contents[1]).to.deep.eq(content_02);

    let holders = await xsem.find(CondEntityHolder,{id:holder_01.id});
    let holder_res:any = holders.shift();
    // should be ordered by nickname asc
    expect(holder_res.contents[0]).to.deep.eq(content_02);
    expect(holder_res.contents[1]).to.deep.eq(content_01);


  }

  @test
  async 'entity lifecycle for conditional properties of type E-P-O[]-P-O[]'() {
    const ConditionObjBase = require('./schemas/default/ConditionObjBase').ConditionObjBase;
    const ConditionObjKeeper = require('./schemas/default/ConditionObjKeeper').ConditionObjKeeper;
    const conditionObjectHolder = require('./schemas/default/ConditionObjectHolder').ConditionObjectHolder;

    let options = _.clone(TEST_STORAGE_OPTIONS);

    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    // condition holder without condition setted fields
    let holder_01 = new conditionObjectHolder();
    let holder_02 = new conditionObjectHolder();

    let keeper_01 = new ConditionObjKeeper();
    keeper_01.objects = [holder_01, holder_02];

    let holder_03 = new conditionObjectHolder();
    let holder_04 = new conditionObjectHolder();

    let keeper_02 = new ConditionObjKeeper();
    keeper_02.objects = [holder_03, holder_04];

    let base_save_01 = new ConditionObjBase();
    base_save_01.objects = [keeper_01, keeper_02];


    base_save_01 = await xsem.save(base_save_01, {validate: false});
    console.log(inspect(base_save_01, false, 10));

    let bases_found = await xsem.find(ConditionObjBase, {id: 1});
    let base_find_01 = bases_found.shift();
    console.log(inspect(base_find_01, false, 10));
    expect(base_find_01).to.deep.eq(base_save_01);

    // condition holder with condition setted fields


  }

}

