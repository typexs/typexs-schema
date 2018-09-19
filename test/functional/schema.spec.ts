import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';
import {IStorageOptions, SqliteSchemaHandler, StorageRef} from 'typexs-base';
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { EntityRegistry} from "../../src";
import {EntityController} from "../../src/libs/EntityController";

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


  @test
  async 'simple schema with one entity'() {

    require('./schemas/default/Author');

    let ref = new StorageRef(TEST_STORAGE_OPTIONS);
    await ref.prepare();

    let schemaDef = EntityRegistry.getSchema(TEST_STORAGE_OPTIONS.name);

    let xsem = new EntityController(TEST_STORAGE_OPTIONS.name,schemaDef, ref);
    await xsem.initialize();

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
  async 'simple schema with one entity but use other names'() {

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


  @test
  async 'schema with entity referencing property (2 entities)'() {

    require('./schemas/default/Author');
    require('./schemas/default/Book');

    let ref = new StorageRef(TEST_STORAGE_OPTIONS);

    ref.setSchemaHandler(new SqliteSchemaHandler(ref));

    await ref.prepare();
    let schemaDef = EntityRegistry.getSchema(TEST_STORAGE_OPTIONS.name);

    let xsem = new EntityController(TEST_STORAGE_OPTIONS.name,schemaDef, ref);
    await xsem.initialize();

    let c = await ref.connect();
    let tableNames = await ref.getSchemaHandler().getCollectionNames();
    expect(tableNames).to.have.length.greaterThan(1);
    expect(tableNames).to.contain('p_author_author');

    let data_author = await c.connection.query('PRAGMA table_info(\'author\')');
    let data_book = await c.connection.query('PRAGMA table_info(\'book\')');
    let data_relations = await c.connection.query('PRAGMA table_info(\'p_author_author\')');

    expect(data_author).to.have.length(3);
    expect(data_book).to.have.length(3);
    expect(data_relations).to.have.length(5);

    await c.close();

  }


  @test
  async 'schema with integrated property'() {

    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;
    const Summary = require('./schemas/default/Summary').Summary;

    let ref = new StorageRef(TEST_STORAGE_OPTIONS);
    await ref.prepare();
    let schemaDef = EntityRegistry.getSchema(TEST_STORAGE_OPTIONS.name);

    let xsem = new EntityController(TEST_STORAGE_OPTIONS.name, schemaDef, ref);
    await xsem.initialize();

    let c = await ref.connect();

    //let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    //console.log(tables);

    let data_author = await c.connection.query('PRAGMA table_info(\'author\')');
    let data_book = await c.connection.query('PRAGMA table_info(\'book\')');
    let data_author_author = await c.connection.query('PRAGMA table_info(\'p_author_author\')');
    let data_summary = await c.connection.query('PRAGMA table_info(\'p_summary\')');


    expect(data_author).to.have.length(3);
    expect(data_author_author).to.have.length(5);
    expect(data_book).to.have.length(3);
    expect(data_summary).to.have.length(6);

    await c.close();

  }


  @test
  async 'schema with property in property'() {

    const PathFeatureCollection = require('./schemas/features/PathFeatureCollection').PathFeatureCollection;

    let ref = new StorageRef(TEST_STORAGE_OPTIONS);
    await ref.prepare();
    let schemaDef = EntityRegistry.getSchema(TEST_STORAGE_OPTIONS.name);

    let xsem = new EntityController(TEST_STORAGE_OPTIONS.name, schemaDef, ref);
    await xsem.initialize();

    let c = await ref.connect();

    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    console.log(tables);

    await c.close();

  }
}

