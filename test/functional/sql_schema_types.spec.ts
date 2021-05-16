import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import * as _ from 'lodash';
import {TestHelper} from './TestHelper';
import {TEST_STORAGE_OPTIONS} from './config';
import {EntityRegistry} from '../../src/libs/EntityRegistry';
import {RegistryFactory} from '@allgemein/schema-api';
import {NAMESPACE_BUILT_ENTITY} from '../../src/libs/Constants';

let registry: EntityRegistry;

@suite('functional/sql_schema_types')
class SqlSchemaTypesSpec {


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
  async 'date type with created and updated variant'() {

    const DateType = require('./schemas/default/DateType').DateType;
    registry.reload([DateType]);
    const options = _.clone(TEST_STORAGE_OPTIONS);

    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members(['date_type']);

    const cols_condition_holder = await c.connection.query('PRAGMA table_info(\'date_type\')');
    expect(_.map(cols_condition_holder, t => t.name)).to.have.members([
      'id',
      'date',
      'created_at',
      'updated_at'
    ]);
    expect(_.map(cols_condition_holder, t => t.dflt_value)).to.have.members([
      null,
      null,
      'datetime(\'now\')',
      'datetime(\'now\')'
    ]);


    const test01 = new DateType();
    test01.date = new Date();

    const test_save_01 = await xsem.save(test01, {validate: false});
    const clone = _.clone(test_save_01);

    await TestHelper.wait(1000);
    test_save_01.date = new Date();

    const test_save_02 = await xsem.save(test_save_01, {validate: false});

    expect(clone.created_at).to.be.eq(test_save_02.created_at);
    expect(clone.updated_at).to.be.lessThan(test_save_02.updated_at);

    await c.close();

  }

}

