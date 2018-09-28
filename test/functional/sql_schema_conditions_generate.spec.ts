import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';
import {IStorageOptions} from 'typexs-base';
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import {TestHelper} from "./TestHelper";


export const TEST_STORAGE_OPTIONS: IStorageOptions = <SqliteConnectionOptions>{
  name: 'default',
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  logger: 'simple-console',
  logging: 'all'
  // tablesPrefix: ""

};


@suite('functional/schemas')
class SchemaSpec {


  before() {
    TestHelper.resetTypeorm();
  }


  @test
  async 'conditional properties use for E-P-E[]'() {

    require('./schemas/default/ConditionHolder').ConditionHolder;
    require('./schemas/default/ConditionKeeper').ConditionKeeper;

    let options = _.clone(TEST_STORAGE_OPTIONS);

    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members(['condition_holder', 'condition_keeper']);

    let cols_condition_holder = await c.connection.query('PRAGMA table_info(\'condition_holder\')');
    expect(_.map(cols_condition_holder, t => t.name)).to.have.members(['id', 'table_name', 'table_id']);

    let cols_condition_keeper = await c.connection.query('PRAGMA table_info(\'condition_keeper\')');
    expect(_.map(cols_condition_keeper, t => t.name)).to.have.members(['id']);


    await c.close();

  }


  @test
  async 'conditional properties use for E-P-O[]'() {

    require('./schemas/default/ConditionObjectHolder');
    require('./schemas/default/ConditionObjectKeeper');

    let options = _.clone(TEST_STORAGE_OPTIONS);

    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members(['condition_object_holder', 'condition_object_keeper']);

    let cols_condition_holder = await c.connection.query('PRAGMA table_info(\'condition_object_holder\')');
    expect(_.map(cols_condition_holder, t => t.name)).to.have.members(['id', 'table_name', 'table_id']);

    let cols_condition_keeper = await c.connection.query('PRAGMA table_info(\'condition_object_keeper\')');
    expect(_.map(cols_condition_keeper, t => t.name)).to.have.members(['id']);


    await c.close();

  }


  @test
  async 'conditional properties use for E-P-O[]-P-O[]'() {

    require('./schemas/default/ConditionObjBase');
    require('./schemas/default/ConditionObjKeeper');
    require('./schemas/default/ConditionObjectHolder');

    let options = _.clone(TEST_STORAGE_OPTIONS);

    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    console.log(tables)
    expect(_.map(tables, t => t.name)).to.have.include.members([
      'condition_obj_base', 'p_objects_condition_obj_keeper', 'condition_obj_keeper', 'condition_object_holder'
    ]);

    let cols = await c.connection.query('PRAGMA table_info(\'condition_obj_base\')');
    expect(_.map(cols, t => t.name)).to.have.members(['id']);

    cols = await c.connection.query('PRAGMA table_info(\'condition_obj_keeper\')');
    expect(_.map(cols, t => t.name)).to.have.members(['id']);

    cols = await c.connection.query('PRAGMA table_info(\'p_objects_condition_obj_keeper\')');
    expect(_.map(cols, t => t.name)).to.have.members(['id', 'source_type', 'source_id', 'source_seq_nr', 'target_id']);

    cols = await c.connection.query('PRAGMA table_info(\'condition_object_holder\')');
    expect(_.map(cols, t => t.name)).to.have.members(['id', 'table_name', 'table_id']);


    await c.close();

  }

}

