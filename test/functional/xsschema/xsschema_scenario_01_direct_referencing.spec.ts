import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';
import {XsRegistry} from '../../../src/libs/xsschema/XsRegistry';
import {XsEntityManager} from '../../../src/libs/xsschema/XsEntityManager';
import {IStorageOptions, StorageRef} from 'typexs-base';
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import {inspect} from 'util';

export const TEST_STORAGE_OPTIONS: IStorageOptions = <SqliteConnectionOptions>{
  name: 'default',
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  logger: 'simple-console',
  logging: 'all'
  // tablesPrefix: ""

};


@suite('functional/xsschema/xsschema_scenario_01_direct_referencing')
class Xsschema_scenario_01_direct_referencingSpec {


  static before() {
    XsRegistry.reset();
  }

  static after() {
    XsRegistry.reset();
  }

  @test
  async 'initializing a schema with entity referencing property'() {
    XsRegistry.reset();

    require('./schemas/default/Author');
    require('./schemas/default/Book');

    let ref = new StorageRef(TEST_STORAGE_OPTIONS);
    await ref.prepare();
    let schemaDef = XsRegistry.getSchema(TEST_STORAGE_OPTIONS.name);

    let xsem = new XsEntityManager(schemaDef, ref);
    await xsem.initialize();

    let c = await ref.connect();
    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    let tableNames = tables.map(x => x.name);
    expect(tableNames).to.have.length(4);
    expect(tableNames).to.contain('p_author_author');

    let data_author = await c.connection.query('PRAGMA table_info(\'author\')');
    let data_book = await c.connection.query('PRAGMA table_info(\'book\')');
    let data_relations = await c.connection.query('PRAGMA table_info(\'p_author_author\')');

    expect(data_author).to.have.length(3);
    expect(data_book).to.have.length(3);
    expect(data_relations).to.have.length(4);

    await c.close();
    XsRegistry.reset();
  }


  @test
  async 'entity lifecycle for entity referencing property E-P-E'() {
    XsRegistry.reset();
    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    let ref = new StorageRef(TEST_STORAGE_OPTIONS);
    await ref.prepare();
    let schemaDef = XsRegistry.getSchema(TEST_STORAGE_OPTIONS.name);

    let xsem = new XsEntityManager(schemaDef, ref);
    await xsem.initialize();

    let c = await ref.connect();

    let a = new Author();
    a.firstName = 'Robert';
    a.lastName = 'Kania';


    let book = new Book();
    book.content = 'This is a good book';
    book.author = a;

    book = await xsem.save(book);
    expect(book.id).to.be.eq(1);
    expect(book.author.id).to.be.eq(1);


    let data = await c.connection.query('select * from author');
    expect(data).to.have.length(1);
    expect(data[0].id).to.eq(1);

    data = await c.connection.query('select * from book');
    expect(data).to.have.length(1);
    expect(data[0].id).to.eq(1);

    data = await c.connection.query('select * from p_author_author');
    expect(data).to.have.length(1);
    expect(data[0].source_id).to.eq(1);
    expect(data[0].target_id).to.eq(1);

    let book2 = await xsem.find<any>(Book, {id: 1});
    expect(book2).to.have.length(1);
    expect(book).to.deep.eq(book2.shift());

    // TODO delete

    await c.close();
    XsRegistry.reset();
  }


  @test
  async 'entity lifecycle for entity referencing property E-P-E[]'() {
    XsRegistry.reset();
    const Author = require('./schemas/default/Author').Author;
    const Book2 = require('./schemas/default/Book2').Book2;

    let ref = new StorageRef(TEST_STORAGE_OPTIONS);
    await ref.prepare();
    let schemaDef = XsRegistry.getSchema(TEST_STORAGE_OPTIONS.name);

    let xsem = new XsEntityManager(schemaDef, ref);
    await xsem.initialize();

    let c = await ref.connect();

    let a = new Author();
    a.firstName = 'Robert';
    a.lastName = 'Kania';

    let a2 = new Author();
    a2.firstName = 'Josef';
    a2.lastName = 'Bania';

    let book = new Book2();
    book.content = 'This is a good book';
    book.authors = [a, a2];

    book = await xsem.save(book);
    expect(book.id).to.be.eq(1);
    expect(book.authors).to.have.length(2);
    expect(_.find(book.authors, {lastName: 'Bania', id: 2})).to.deep.include({lastName: 'Bania', id: 2});
    expect(_.find(book.authors, {lastName: 'Kania', id: 1})).to.deep.include({lastName: 'Kania', id: 1});

    let books: any[] = await xsem.find(Book2, {id: 1});
    expect(books).to.have.length(1);
    let book2 = books.shift();
    expect(book2.id).to.be.eq(1);
    expect(book2.authors).to.have.length(2);
    expect(_.find(book2.authors, {lastName: 'Bania', id: 2})).to.deep.include({lastName: 'Bania', id: 2});
    expect(_.find(book2.authors, {lastName: 'Kania', id: 1})).to.deep.include({lastName: 'Kania', id: 1});

    await c.close();
    XsRegistry.reset();
  }


  // TODO NULLABLE!!!

  @test
  async 'entity lifecycle for referencing property E-P-SP-E'() {
    XsRegistry.reset();
    const Car = require('./schemas/direct_property/Car').Car;
    const Skil = require('./schemas/direct_property/Skil').Skil;
    const Driver = require('./schemas/direct_property/Driver').Driver;

    let ref = new StorageRef(TEST_STORAGE_OPTIONS);
    await ref.prepare();
    let schemaDef = XsRegistry.getSchema('direct_property');

    let xsem = new XsEntityManager(schemaDef, ref);
    await xsem.initialize();

    let c = await ref.connect();

    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    console.log(tables);

    let car = new Car();
    car.producer = 'Volvo';
    car.driver = new Driver();
    car.driver.age = 30;
    car.driver.nickName = 'Fireball';
    car.driver.skill = new Skil();
    car.driver.skill.label = 'ASD';
    car.driver.skill.quality = 123;

    car = await xsem.save(car);
    console.log(car);

    let car2 = await xsem.find(Car, {id: 1});
    console.log(inspect(car2, false, 10));

    await c.close();
    XsRegistry.reset();
  }

  @test
  async 'entity lifecycle for referencing property E-P-SP[]-E'() {
    XsRegistry.reset();
    const Car = require('./schemas/direct_property/Car').Car;
    const Skil = require('./schemas/direct_property/Skil').Skil;
    const Driver = require('./schemas/direct_property/Driver').Driver;

    let ref = new StorageRef(TEST_STORAGE_OPTIONS);
    await ref.prepare();
    let schemaDef = XsRegistry.getSchema('direct_property');

    let xsem = new XsEntityManager(schemaDef, ref);
    await xsem.initialize();

    let c = await ref.connect();

    //let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    //console.log(tables);

    let car = new Car();
    car.producer = 'Volvo';
    let driver1 = new Driver();
    driver1.age = 30;
    driver1.nickName = 'Fireball';
    driver1.skill = new Skil();
    driver1.skill.label = 'won';
    driver1.skill.quality = 123;

    let driver2 = new Driver();
    driver2.age = 29;
    driver2.nickName = 'Thunder';
    driver2.skill = new Skil();
    driver2.skill.label = 'lose';
    driver2.skill.quality = 12;

    car.drivers = [driver1, driver2];

    car = await xsem.save(car);

    let car2 = await xsem.find(Car, {id: 1});
    let car3 = car2.shift();
    expect(car).to.deep.eq(car3);

    await c.close();
    XsRegistry.reset();
  }


  @test
  async 'saving multiple entities with and without refrences'() {
    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    let ref = new StorageRef(TEST_STORAGE_OPTIONS);
    await ref.prepare();
    let schemaDef = XsRegistry.getSchema(TEST_STORAGE_OPTIONS.name);

    let xsem = new XsEntityManager(schemaDef, ref);
    await xsem.initialize();

    let c = await ref.connect();

    let a = new Author();
    a.firstName = 'Robert';
    a.lastName = 'Kania';

    let a2 = new Author();
    a2.firstName = 'Josef';
    a2.lastName = 'Bania';

    let book = new Book();
    book.label = 'This is a good book';
    book.author = a;

    let book2 = new Book();
    book2.label = 'Best book ever';
    book2.author = a2;

    let booksToSave = [book, book2];
    let books = await xsem.save(booksToSave);


    let booksFound = await xsem.find(Book);

    expect(books).to.be.deep.eq(booksFound);

    // TODO delete

    await c.close();

  }

  @test
  async 'saving multiple entities with shared entity refrences'() {
    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    let ref = new StorageRef(TEST_STORAGE_OPTIONS);
    await ref.prepare();
    let schemaDef = XsRegistry.getSchema(TEST_STORAGE_OPTIONS.name);

    let xsem = new XsEntityManager(schemaDef, ref);
    await xsem.initialize();

    let c = await ref.connect();

    let a = new Author();
    a.firstName = 'Robert';
    a.lastName = 'Kania';
    a = await xsem.save(a);

    let book = new Book();
    book.label = 'This is a good book';
    book.author = a;

    let book2 = new Book();
    book2.label = 'Best book ever';
    book2.author = a;

    let booksToSave = [book, book2];
    let books = await xsem.save(booksToSave);
    let booksFound = await xsem.find(Book);

    expect(books).to.be.deep.eq(booksFound);

    // TODO delete

    await c.close();
  }


  @test.skip()
  async 'must throw error variant E-P-SP[]-E[] or E-P-SP-E[] not implemented'() {
  }


  @test.skip()
  async 'entity lifecycle for multiple direct entity referencing E-P-SP[]-E'() {
  }


  @test.skip()
  async 'error on referencing sub-property with multiple entity references E-P-SP-E[]'() {
  }

}
