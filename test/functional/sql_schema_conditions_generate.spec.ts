import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import * as _ from 'lodash';
import {TestHelper} from './TestHelper';
import {TEST_STORAGE_OPTIONS} from './config';
import {RegistryFactory} from '@allgemein/schema-api';
import {NAMESPACE_BUILT_ENTITY} from '../../src/libs/Constants';
import {EntityRegistry} from '../../src/libs/EntityRegistry';


let registry: EntityRegistry;

@suite('functional/sql_schema_conditions_generate')
class SchemaSpec {

  static before() {
    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
  }

  static after() {
    RegistryFactory.reset();
  }

  before() {
    TestHelper.resetTypeorm();
  }


  @test
  async 'conditional properties use for E-P-E[]'() {

    const ConditionHolder = require('./schemas/default/ConditionHolder').ConditionHolder;
    const ConditionKeeper = require('./schemas/default/ConditionKeeper').ConditionKeeper;
    registry.reload([ConditionHolder, ConditionKeeper]);

    const options = _.clone(TEST_STORAGE_OPTIONS);

    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members(['condition_holder', 'condition_keeper']);

    const cols_condition_holder = await c.connection.query('PRAGMA table_info(\'condition_holder\')');
    expect(_.map(cols_condition_holder, t => t.name)).to.have.members(['id', 'table_name', 'table_id']);

    const cols_condition_keeper = await c.connection.query('PRAGMA table_info(\'condition_keeper\')');
    expect(_.map(cols_condition_keeper, t => t.name)).to.have.members(['id']);


    await c.close();

  }


  @test
  async 'conditional properties use for E-P-O[]'() {

    const ConditionHolder = require('./schemas/default/ConditionObjectHolder').ConditionObjectHolder;
    const ConditionKeeper = require('./schemas/default/ConditionObjectKeeper').ConditionObjectKeeper;
    registry.reload([ConditionHolder, ConditionKeeper]);

    const options = _.clone(TEST_STORAGE_OPTIONS);

    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members(['condition_object_holder', 'condition_object_keeper']);

    const cols_condition_holder = await c.connection.query('PRAGMA table_info(\'condition_object_holder\')');
    expect(_.map(cols_condition_holder, t => t.name)).to.have.members(['id', 'table_name', 'table_id']);

    const cols_condition_keeper = await c.connection.query('PRAGMA table_info(\'condition_object_keeper\')');
    expect(_.map(cols_condition_keeper, t => t.name)).to.have.members(['id']);


    await c.close();

  }


  @test
  async 'conditional properties use for E-P-O[]-P-O[]'() {

    const ConditionObjBase = require('./schemas/default/ConditionObjBase').ConditionObjBase;
    const ConditionObjKeeper = require('./schemas/default/ConditionObjKeeper').ConditionObjKeeper;
    const ConditionObjectHolder = require('./schemas/default/ConditionObjectHolder').ConditionObjectHolder;
    registry.reload([ConditionObjBase, ConditionObjKeeper, ConditionObjectHolder]);


    const options = _.clone(TEST_STORAGE_OPTIONS);

    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');

    expect(_.map(tables, t => t.name)).to.have.include.members([
      'condition_obj_base', 'p_condition_obj_base_objects', 'condition_obj_keeper', 'condition_object_holder'
    ]);

    let cols = await c.connection.query('PRAGMA table_info(\'condition_obj_base\')');
    expect(_.map(cols, t => t.name)).to.have.members(['id']);

    cols = await c.connection.query('PRAGMA table_info(\'condition_obj_keeper\')');
    expect(_.map(cols, t => t.name)).to.have.members(['id']);

    cols = await c.connection.query('PRAGMA table_info(\'p_condition_obj_base_objects\')');
    expect(_.map(cols, t => t.name)).to.have.members(['id', 'source_type', 'source_id', 'source_seq_nr', 'target_id']);

    cols = await c.connection.query('PRAGMA table_info(\'condition_object_holder\')');
    expect(_.map(cols, t => t.name)).to.have.members(['id', 'table_name', 'table_id']);


    await c.close();

  }

}

