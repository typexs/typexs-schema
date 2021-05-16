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

@suite('functional/sql_schema_basic_generations')
class SqlSchemaBasicGenerationsSpec {


  static before() {
    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
  }

  static after() {
    RegistryFactory.reset();
  }

  before() {
    TestHelper.resetTypeorm();
  }

  //
  // static before() {
  //   RegistryFactory.register(REGISTRY_TYPEORM, TypeOrmEntityRegistry);
  //   RegistryFactory.register(/^typeorm\..*/, TypeOrmEntityRegistry);
  //
  //   // TypeOrmEntityRegistry.reset();
  //   // TestHelper.resetTypeorm();
  //
  //
  // }
  //
  // static after() {
  //   RegistryFactory.reset();
  // }
  //
  //
  // before() {
  //   TestHelper.resetTypeorm();
  //   registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
  // }
  //
  // after() {
  //   RegistryFactory.reset();
  // }

  @test
  async 'simple schema with one entity'() {
    const Author = require('./schemas/default/Author').Author;

    registry.reload([Author]);

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    const connect = await TestHelper.connect(options);
    // const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    const tableNames = tables.map(x => x.name);
    expect(tableNames).to.contain('author');
    const data = await c.connection.query('PRAGMA table_info(\'author\')');
    expect(data).to.have.length(3);
    expect(_.find(data, {name: 'last_name'})).to.deep.include({name: 'last_name', type: 'varchar'});
    await c.close();

    const props = [];
    const entity = ref.getClassRef('Author');
    // const entity = registry.getEntityRefByName('Author');
    expect(entity.name).to.be.eq('Author');
    const properties = entity.getPropertyRefs();
    expect(properties).to.have.length(3);
    for (const p of properties) {
      const pname = p.name;
      props.push(pname);
    }
    expect(props).to.be.deep.eq(['id', 'firstName', 'lastName']);

  }


  @test
  async 'simple schema with one entity and json properties'() {
    const ObjectWithJson = require('./schemas/default/ObjectWithJson').ObjectWithJson;

    registry.reload([ObjectWithJson]);

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    const connect = await TestHelper.connect(options);
    // const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    const tableNames = tables.map(x => x.name);
    expect(tableNames).to.contain('object_with_json');
    const data = await c.connection.query('PRAGMA table_info(\'object_with_json\')');
    expect(data).to.have.length(2);
    expect(_.find(data, {name: 'json'})).to.deep.include({name: 'json', type: 'varchar'});
    await c.close();

    const props = [];
    const entity = ref.getClassRef('ObjectWithJson');
    // const entity = registry.getEntityRefByName('ObjectWithJson');
    expect(entity.name).to.be.eq('ObjectWithJson');
    const properties = entity.getPropertyRefs();
    expect(properties).to.have.length(2);
    for (const p of properties) {
      const pname = p.name;
      props.push(pname);
    }
    expect(props).to.be.deep.eq(['id', 'json']);

  }


  @test
  async 'simple schema with one entity but use other names'() {

    const AuthorRename = require('./schemas/default/AuthorRename').AuthorRename;
    registry.reload([AuthorRename]);

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');

    const tableNames = tables.map(x => x.name);
    expect(tableNames).to.contain('author_with_new_name');
    const data = await c.connection.query('PRAGMA table_info(\'author_with_new_name\')');
    expect(data).to.have.length(3);

    expect(_.find(data, {name: 'id_new_name'})).to.deep.include({type: 'integer', pk: 1});
    await c.close();

  }


  @test
  async 'entity referencing property E-P-E (2 entities over join table)'() {

    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    registry.reload([Author, Book]);

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tableNames = await ref.getSchemaHandler().getCollectionNames();
    expect(tableNames).to.have.length.greaterThan(1);
    expect(tableNames).to.contain('p_book_author');

    const data_author = await c.connection.query('PRAGMA table_info(\'author\')');
    const data_book = await c.connection.query('PRAGMA table_info(\'book\')');
    const data_relations = await c.connection.query('PRAGMA table_info(\'p_book_author\')');

    expect(data_author).to.have.length(3);
    expect(data_book).to.have.length(3);
    expect(data_relations).to.have.length(5);

    await c.close();

  }

  @test
  async 'entity referencing property E-P-E (2 entities over embedded id)'() {

    const Course = require('./schemas/default/Course').Course;
    const Periode = require('./schemas/default/Periode').Periode;
    registry.reload([Course, Periode]);
    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();


    const tableNames = await ref.getSchemaHandler().getCollectionNames();
    expect(tableNames).to.have.include.members(['course', 'periode']);

    const data_course = await c.connection.query('PRAGMA table_info(\'course\')');
    expect(_.map(data_course, c => c.name)).to.have.include.members(['periode_perid', 'periode_otherid']);

    await c.close();

  }


  @test
  async 'entity referencing property E-P-O (entity to object over embedded id)'() {

    const Course2 = require('./schemas/default/Course2').Course2;
    const Literatur = require('./schemas/default/Literatur').Literatur;
    registry.reload([Course2, Literatur]);

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

//    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    //  console.log(tables);

    const tableNames = await ref.getSchemaHandler().getCollectionNames();
    expect(tableNames).to.have.include.members(['course_2', 'o_literatur']);

    const data_course = await c.connection.query('PRAGMA table_info(\'course_2\')');
    expect(_.map(data_course, c => c.name)).to.have.include.members(['literatur_titelid']);

    const cols_literatur = await c.connection.query('PRAGMA table_info(\'o_literatur\')');
    expect(_.map(cols_literatur, c => c.name)).to.have.include.members(['titel', 'titelid']);

    await c.close();

  }

  @test
  async 'entity referencing property E-P-O-P-O (entity to object and again to object over embedded ids)'() {

    const EDR = require('./schemas/default/EDR').EDR;
    const EDR_Object_DR = require('./schemas/default/EDR_Object_DR').EDR_Object_DR;
    const EDR_Object = require('./schemas/default/EDR_Object').EDR_Object;

    registry.reload([EDR, EDR_Object_DR, EDR_Object]);

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

//    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
//    console.log(tables);

    const tableNames = await ref.getSchemaHandler().getCollectionNames();
    expect(tableNames).to.have.include.members(['level_one', 'object_level_two', 'object_level_three']);

    const cols_level_one = await c.connection.query('PRAGMA table_info(\'level_one\')');
    expect(_.map(cols_level_one, c => c.name)).to.have.include.members(['object_id']);

    const cols_obj_level_two = await c.connection.query('PRAGMA table_info(\'object_level_two\')');
    expect(_.map(cols_obj_level_two, c => c.name)).to.have.include.members(['object_id']);


    await c.close();

  }

  @test
  async 'entity referencing property E-P-O-P-O (entity to object and again to object over embedded objects)'() {

    const EntityWithEmbedded = require('./schemas/embedded/EntityWithEmbedded').EntityWithEmbedded;
    const EmbeddedObject = require('./schemas/embedded/EmbeddedObject').EmbeddedObject;
    const EmbeddedSubObject = require('./schemas/embedded/EmbeddedSubObject').EmbeddedSubObject;

    registry.reload([EntityWithEmbedded, EmbeddedObject, EmbeddedSubObject]);

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'embedded';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

//    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
//    console.log(tables);

    const tableNames = await ref.getSchemaHandler().getCollectionNames();
    expect(tableNames).to.have.include.members([
        'entity_with_embedded',
        'p_entity_with_embedded_obj'
      ]
    );

    const cols_level_one = await c.connection.query('PRAGMA table_info(\'entity_with_embedded\')');
    expect(_.map(cols_level_one, c => c.name)).to.have.include.members(['id']);

    const cols_obj_level_two = await c.connection.query('PRAGMA table_info(\'p_entity_with_embedded_obj\')');
    expect(_.map(cols_obj_level_two, c => c.name)).to.have.include.members([
      'id',
      'source_type',
      'source_id',
      'source_seq_nr',
      'inner_name',
      'inner_sub_name',
      'inner_sub_other_var'
    ]);


    await c.close();

  }

  @test
  async 'schema with integrated property'() {

    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;
    const Summary = require('./schemas/default/Summary').Summary;

    registry.reload([Author, Book, Summary]);

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    // let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    // console.log(tables);

    const data_author = await c.connection.query('PRAGMA table_info(\'author\')');
    const data_book = await c.connection.query('PRAGMA table_info(\'book\')');
    const data_author_author = await c.connection.query('PRAGMA table_info(\'p_book_author\')');
    const data_summary = await c.connection.query('PRAGMA table_info(\'p_summary\')');


    expect(data_author).to.have.length(3);
    expect(data_author_author).to.have.length(5);
    expect(data_book).to.have.length(3);
    expect(data_summary).to.have.length(6);

    await c.close();

  }


  @test
  async 'schema with property in property'() {

    const PathFeatureCollection = require('./schemas/features/PathFeatureCollection').PathFeatureCollection;
    registry.reload([PathFeatureCollection]);

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'default';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    expect(_.map(tables, t => t.name)).to.have.include.members(['path_feature_collection', 'p_path_feature_collection_features']);
    // console.log(tables);

    await c.close();

  }

  @test
  async 'complex entity with multiple object integrations E-P-O[]-P-O[]'() {

    const Person = require('./schemas/complex_entity/Person').Person;
    registry.reload([Person]);

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'complex_entity';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');

    expect(_.map(tables, t => t.name)).to.have.include.members(['person', 'p_person_jobs', 'i_job_languages']);

    await c.close();

  }


}

