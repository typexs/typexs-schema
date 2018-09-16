import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';
import {IStorageOptions, StorageRef} from 'typexs-base';
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { EntityRegistry} from "../../src";
import {EntityController} from "../../src/libs/EntityController";

export const TEST_STORAGE_OPTIONS: IStorageOptions = <SqliteConnectionOptions>{
  name: 'default',
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  //logger: 'simple-console',
  //logging: 'all'
  // tablesPrefix: ""

};


@suite('functional/scenario_00_simple')
class Scenario_00_simpleSpec {


  @test
  async 'initializing a simple schema'() {

    require('./schemas/default/Author');

    let ref = new StorageRef(TEST_STORAGE_OPTIONS);
    await ref.prepare();
    let schemaDef = EntityRegistry.getSchema(TEST_STORAGE_OPTIONS.name);

    let xsem = new EntityController(TEST_STORAGE_OPTIONS.name,schemaDef, ref);
    await xsem.initialize();


    // console.log(ref['options'],getMetadataArgsStorage());

    let c = await ref.connect();
    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    let tableNames = tables.map(x => x.name);
    expect(tableNames).to.contain('author');
    let data = await c.connection.query('PRAGMA table_info(\'author\')');
    expect(data).to.have.length(3);
    expect(_.find(data, {name: 'last_name'})).to.deep.include({name: 'last_name', type: 'text'});
    await c.close();

  }

  @test
  async 'initializing a simple schema but use other names'() {

    require('./schemas/default/AuthorRename');

    let ref = new StorageRef(TEST_STORAGE_OPTIONS);
    await ref.prepare();
    let schemaDef = EntityRegistry.getSchema(TEST_STORAGE_OPTIONS.name);
    let xsem = new EntityController(TEST_STORAGE_OPTIONS.name,schemaDef, ref);
    await xsem.initialize();
    let c = await ref.connect();
    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');

    let tableNames = tables.map(x => x.name);
    expect(tableNames).to.contain('author_with_new_name');
    let data = await c.connection.query('PRAGMA table_info(\'author_with_new_name\')');
    expect(data).to.have.length(3);

    expect(_.find(data, {name: 'id_new_name'})).to.deep.include({type: 'integer', pk: 1});
    await c.close();

  }

}

