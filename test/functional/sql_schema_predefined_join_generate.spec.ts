import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';
import {TestHelper} from './TestHelper';
import {TEST_STORAGE_OPTIONS} from './config';


@suite('functional/sql_schema_predefined_join_generate')
class Sql_schema_predefined_join_generateSpec {


  before() {
    TestHelper.resetTypeorm();
  }

  @test.skip()
  async 'create E-P-E over predefined join tables'() {
  }

  @test
  async 'create E-P-E[] over predefined join tables'() {
    require('./schemas/join/Lecture');
    require('./schemas/join/RBelongsTo');
    require('./schemas/join/Teacher');

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'join';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members(['personal', 'veranstaltung', 'r_belongsto']);

    const cols = await c.connection.query('PRAGMA table_info(\'r_belongsto\')');
    expect(_.map(cols, t => t.name)).to.have.members(['beltoid', 'ownertab', 'ownerid', 'tabelle', 'tabpk', 'sortierung', 'zeitstempel']);

    await c.close();
  }


  @test
  async 'create E-P-O schema with predefined join tables'() {
    require('./schemas/join/Candidate');
    require('./schemas/join/IdentityRole');
    require('./schemas/join/Identity');

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'join';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members([
      'bew',
      'identroll',
      'ident'
    ]);

    const cols = await c.connection.query('PRAGMA table_info(\'identroll\')');
    expect(_.map(cols, t => t.name)).to.have.members([
      'identnr',
      'rolle',
      'verbindung_integer',
      'verbindung_char',
      'anschrkz'
    ]);

    await c.close();
  }


  @test
  async 'create E-P-O[] over predefined join tables'() {
    require('./schemas/join/ContentHolder');
    require('./schemas/join/Content');
    require('./schemas/join/ContentRef');

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'join';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members(['r_blobs', 'blobs', 'content_holder']);

    const cols = await c.connection.query('PRAGMA table_info(\'r_blobs\')');
    expect(_.map(cols, t => t.name)).to.have.members(['rblobid', 'table_name', 'table_id', 'blobid']);

    await c.close();

  }

  @test.skip()
  async 'create E-P-O[]-P-O[] over predefined join tables'() {

  }

  @test.skip()
  async 'create E-P-O[]-P-E[] over predefined join tables'() {

  }

}

