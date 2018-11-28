import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';
import {IStorageOptions} from '@typexs/base';
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import {TestHelper} from "./TestHelper";
import {TEST_STORAGE_OPTIONS} from "./config";
import {EntityRegistry} from "../../src";
import {inspect} from "util";


@suite('functional/sql_schema_predefined_join_bidirect')
class Sql_schema_predefined_join_bidirectSpec {


  before() {
    TestHelper.resetTypeorm();
  }


  @test
  async 'create E-P-E[] over predefined join tables'() {
    require('./schemas/role_permissions/Role');
    require('./schemas/role_permissions/Permission');
// TODO reverse join!

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'role_permissions';

    let schema = EntityRegistry.$().getSchemaDefByName(options.name);
    console.log(inspect(schema.toJson(), false, 10));

    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members([
      "role",
      "r_belongsto_2",
      "permission"
    ]);

    let cols = await c.connection.query('PRAGMA table_info(\'r_belongsto_2\')');
    expect(_.map(cols, t => t.name)).to.have.members(['id',
      'ownertab', 'ownerid',
      "reftab",
      "refid",
      "sort",
      "updated_at"
    ]);

    await c.close();
  }


}

