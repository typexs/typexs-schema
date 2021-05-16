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

@suite('functional/sql_schema_predefined_join_generate')
class SqlSchemaPredefinedJoinGenerateSpec {

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
  async 'create E-P-E[] over predefined join tables'() {
    const Lecture = require('./schemas/join/Lecture').Lecture;
    const RBelongsTo = require('./schemas/join/RBelongsTo').RBelongsTo;
    const Teacher = require('./schemas/join/Teacher').Teacher;
    registry.reload([Lecture, RBelongsTo, Teacher]);

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
  async 'create E-P-O[] over predefined join tables'() {
    const ContentHolder = require('./schemas/join/ContentHolder').ContentHolder;
    const Content = require('./schemas/join/Content').Content;
    const ContentRef = require('./schemas/join/ContentRef').ContentRef;
    registry.reload([ContentHolder, Content, ContentRef]);


    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'join';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query(
      'SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';'
    );
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

