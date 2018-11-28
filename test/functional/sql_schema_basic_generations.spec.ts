import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';
import {TestHelper} from "./TestHelper";
import {TEST_STORAGE_OPTIONS} from "./config";


@suite('functional/sql_schema_basic_generations')
class Sql_schema_basic_generationsSpec {


  before() {
    TestHelper.resetTypeorm();
  }

  @test
  async 'simple schema with one entity'() {
    require('./schemas/default/Author');

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
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

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
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
  async 'entity referencing property E-P-E (2 entities over join table)'() {

    require('./schemas/default/Author');
    require('./schemas/default/Book');

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let tableNames = await ref.getSchemaHandler().getCollectionNames();
    expect(tableNames).to.have.length.greaterThan(1);
    expect(tableNames).to.contain('p_book_author');

    let data_author = await c.connection.query('PRAGMA table_info(\'author\')');
    let data_book = await c.connection.query('PRAGMA table_info(\'book\')');
    let data_relations = await c.connection.query('PRAGMA table_info(\'p_book_author\')');

    expect(data_author).to.have.length(3);
    expect(data_book).to.have.length(3);
    expect(data_relations).to.have.length(5);

    await c.close();

  }

  @test
  async 'entity referencing property E-P-E (2 entities over embedded id)'() {

    require('./schemas/default/Course');
    require('./schemas/default/Periode');

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();


    let tableNames = await ref.getSchemaHandler().getCollectionNames();
    expect(tableNames).to.have.include.members(['course', 'periode']);

    let data_course = await c.connection.query('PRAGMA table_info(\'course\')');
    expect(_.map(data_course, c => c.name)).to.have.include.members(['periode_perid', 'periode_otherid']);

    await c.close();

  }


  @test
  async 'entity referencing property E-P-O (entity to object over embedded id)'() {

    require('./schemas/default/Course2');
    require('./schemas/default/Literatur');

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

//    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    //  console.log(tables);

    let tableNames = await ref.getSchemaHandler().getCollectionNames();
    expect(tableNames).to.have.include.members(['course_2', 'o_literatur']);

    let data_course = await c.connection.query('PRAGMA table_info(\'course_2\')');
    expect(_.map(data_course, c => c.name)).to.have.include.members(['literatur_titelid']);

    let cols_literatur = await c.connection.query('PRAGMA table_info(\'o_literatur\')');
    expect(_.map(cols_literatur, c => c.name)).to.have.include.members(['titel', 'titelid']);

    await c.close();

  }

  @test
  async 'entity referencing property E-P-O-P-O (entity to object and again to object over embedded ids)'() {

    require('./schemas/default/EDR');
    require('./schemas/default/EDR_Object_DR');
    require('./schemas/default/EDR_Object');

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

//    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
//    console.log(tables);

    let tableNames = await ref.getSchemaHandler().getCollectionNames();
    expect(tableNames).to.have.include.members(['level_one', 'object_level_two', 'object_level_three']);

    let cols_level_one = await c.connection.query('PRAGMA table_info(\'level_one\')');
    expect(_.map(cols_level_one, c => c.name)).to.have.include.members(['object_id']);

    let cols_obj_level_two = await c.connection.query('PRAGMA table_info(\'object_level_two\')');
    expect(_.map(cols_obj_level_two, c => c.name)).to.have.include.members(['object_id']);


    await c.close();

  }


  @test
  async 'schema with integrated property'() {

    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;
    const Summary = require('./schemas/default/Summary').Summary;

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    //let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    //console.log(tables);

    let data_author = await c.connection.query('PRAGMA table_info(\'author\')');
    let data_book = await c.connection.query('PRAGMA table_info(\'book\')');
    let data_author_author = await c.connection.query('PRAGMA table_info(\'p_book_author\')');
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

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    expect(_.map(tables, t => t.name)).to.have.include.members(['path_feature_collection', 'p_path_feature_collection_features']);
    console.log(tables);

    await c.close();

  }

  @test
  async 'complex entity with multiple object integrations E-P-O[]-P-O[]'() {

    const Person = require('./schemas/complex_entity/Person').Person;

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'complex_entity';
    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');

    expect(_.map(tables, t => t.name)).to.have.include.members(['person', 'p_person_jobs', 'i_job_languages']);

    await c.close();

  }


}

