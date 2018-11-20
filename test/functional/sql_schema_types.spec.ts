import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';
import {TestHelper} from "./TestHelper";
import {TEST_STORAGE_OPTIONS} from "./config";
import {DateType} from "./schemas/default/DateType";


@suite('functional/sql_schema_types')
class Sql_schema_typesSpec {


  before() {
    TestHelper.resetTypeorm();
  }


  @test
  async 'date type with created and updated variant'() {

    require('./schemas/default/DateType').DateType;

    let options = _.clone(TEST_STORAGE_OPTIONS);

    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members(['date_type']);

    let cols_condition_holder = await c.connection.query('PRAGMA table_info(\'date_type\')');
    expect(_.map(cols_condition_holder, t => t.name)).to.have.members([
      "id",
      "date",
      "created_at",
      "updated_at"
    ]);
    expect(_.map(cols_condition_holder, t => t.dflt_value)).to.have.members([
      null,
      null,
      "datetime('now')",
      "datetime('now')"
    ]);


    let test01 = new DateType();
    test01.date = new Date();

    let test_save_01 = await xsem.save(test01, {validate: false});
    let clone = _.clone(test_save_01);

    await TestHelper.wait(1000);
    test_save_01.date = new Date();

    let test_save_02 = await xsem.save(test_save_01, {validate: false});

    expect(clone.created_at).to.be.eq(test_save_02.created_at);
    expect(clone.updated_at).to.be.lessThan(test_save_02.updated_at);

    await c.close();

  }

}

