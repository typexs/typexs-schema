import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';
import {IStorageOptions, SqliteSchemaHandler, StorageRef} from "typexs-base";
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import {getMetadataArgsStorage} from 'typeorm';
import {PlatformTools} from 'typeorm/platform/PlatformTools';
import {inspect} from 'util';
import {EntityRegistry, FrameworkFactory} from "../../src";
import {EntityController} from "../../src/libs/EntityController";
import {TestHelper} from "./TestHelper";

export const TEST_STORAGE_OPTIONS: IStorageOptions = <SqliteConnectionOptions>{
  name: 'default',
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  logger: 'simple-console',
  logging: 'all'
  // tablesPrefix: ""

};


@suite('functional/scenario_01_direct_referencing')
class Scenario_01_direct_referencingSpec {

  before() {
    PlatformTools.getGlobalVariable().typeormMetadataArgsStorage = null;
  }

  async connect(options: any): Promise<{ ref: StorageRef, controller: EntityController }> {
    return TestHelper.connect(options);
  }

  @test
  async 'entity lifecycle for entity referencing property E-P-E'() {
    let options = _.clone(TEST_STORAGE_OPTIONS);
//    (<any>options).name = 'direct_property';

    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    let connect = await this.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
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

  }


  @test
  async 'entity lifecycle for entity referencing property E-P-E[]'() {
    let options = _.clone(TEST_STORAGE_OPTIONS);

    const Author = require('./schemas/default/Author').Author;
    const Book2 = require('./schemas/default/Book2').Book2;

    let connect = await this.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let a = new Author();
    a.firstName = 'Robert';
    a.lastName = 'Kania';

    let a2 = new Author();
    a2.firstName = 'Josef';
    a2.lastName = 'Bania';

    let a3 = new Author();
    a3.firstName = 'Andi';
    a3.lastName = 'Müller';

    let a4 = new Author();
    a4.firstName = 'Hans';
    a4.lastName = 'Schmidt';

    let book_save_1 = new Book2();
    book_save_1.content = 'This is a good book';
    book_save_1.authors = [a, a2];

    book_save_1 = await xsem.save(book_save_1);
    console.log(book_save_1);
    expect(book_save_1.id).to.be.eq(1);
    expect(book_save_1.authors).to.have.length(2);
    expect(_.find(book_save_1.authors, {lastName: 'Bania', id: 2})).to.deep.include({lastName: 'Bania', id: 2});
    expect(_.find(book_save_1.authors, {lastName: 'Kania', id: 1})).to.deep.include({lastName: 'Kania', id: 1});

    let books: any[] = await xsem.find(Book2, {id: 1});
    console.log(books);
    expect(books).to.have.length(1);
    let book_find_1 = books.shift();
    expect(book_find_1.id).to.be.eq(1);
    expect(book_find_1.authors).to.have.length(2);
    expect(_.find(book_find_1.authors, {lastName: 'Bania', id: 2})).to.deep.include({lastName: 'Bania', id: 2});
    expect(_.find(book_find_1.authors, {lastName: 'Kania', id: 1})).to.deep.include({lastName: 'Kania', id: 1});

    let book_save_2 = new Book2();
    book_save_2.content = 'Robi tobi und das Fliwatüt';
    book_save_2.authors = [a];
    book_save_2 = await xsem.save(book_save_2);
    console.log(book_save_2);
    expect(book_save_2.id).to.be.eq(2);
    expect(book_save_2.authors).to.have.length(1);
    expect(_.find(book_save_2.authors, {lastName: 'Kania', id: 1})).to.deep.include({lastName: 'Kania', id: 1});

    books = await xsem.find(Book2, {id: 2});
    console.log(books);
    expect(books).to.have.length(1);
    let book_find_3 = books.shift();
    expect(book_find_3.id).to.be.eq(2);
    expect(book_find_3.authors).to.have.length(1);
    expect(_.find(book_find_3.authors, {lastName: 'Kania', id: 1})).to.deep.include({lastName: 'Kania', id: 1});

    // save multiple books

    let book_save_3 = new Book2();
    book_save_3.content = 'Mittelalter';
    book_save_3.authors = [a3, a2];

    let book_save_4 = new Book2();
    book_save_4.content = 'Kurz Geschichte der Zeit';
    book_save_4.authors = [a3, a4];


    let books_saved = await xsem.save([book_save_3, book_save_4]);
    console.log(inspect(books_saved, false, 10));
    expect(books_saved).to.have.length(2);

    let books_found = await xsem.find(Book2, [{id: 3}, {id: 4}]);
    console.log(inspect(books_found, false, 10));
    expect(books_found).to.have.length(2);
    expect(books_saved).to.deep.eq(books_found);

    // book without author
    let book_save_5 = new Book2();
    book_save_5.content = 'Karate';

    books_saved = await xsem.save([book_save_5]);
    console.log(inspect(books_saved, false, 10));
    expect(books_saved).to.have.length(1);

    books_found = await xsem.find(Book2, [{id: 5}]);
    console.log(inspect(books_found, false, 10));
    expect(books_found).to.have.length(1);
    expect(books_saved).to.deep.eq(books_found);

    // book empty author
    let book_save_6 = new Book2();
    book_save_6.content = 'Karate';
    book_save_6.authors = [];

    books_saved = await xsem.save([book_save_6]);
    console.log(inspect(books_saved, false, 10));

    books_found = await xsem.find(Book2, [{id: 6}]);
    console.log(inspect(books_found, false, 10));
    expect(books_found).to.have.length(1);
    expect(books_saved).to.deep.eq(books_found);

    await c.close();

  }


  // TODO NULLABLE!!!

  @test
  async 'entity lifecycle for referencing property E-P-SP-E'() {

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'direct_property';

    const Car = require('./schemas/direct_property/Car').Car;
    const Skil = require('./schemas/direct_property/Skil').Skil;
    const Driver = require('./schemas/direct_property/Driver').Driver;

    let connect = await this.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    expect(tables).to.have.length(5);
    expect(_.map(tables, table => table.name)).to.have.include.members(['car', 'skil', 'p_driver_driver', 'p_drivers_driver']);

    let car_save_1 = new Car();
    car_save_1.producer = 'Volvo';
    car_save_1.driver = new Driver();
    car_save_1.driver.age = 30;
    car_save_1.driver.nickName = 'Fireball';
    car_save_1.driver.skill = new Skil();
    car_save_1.driver.skill.label = 'ASD';
    car_save_1.driver.skill.quality = 123;

    car_save_1 = await xsem.save(car_save_1);
    console.log(car_save_1);

    let cars_found = await xsem.find(Car, {id: 1});
    console.log(inspect(cars_found, false, 10));

    let car_find_1 = cars_found.shift();
    expect(car_save_1).to.deep.eq(car_find_1);

    await c.close();


  }

  @test
  async 'entity lifecycle for referencing property E-P-SP[]-E'() {

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'direct_property';

    const Car = require('./schemas/direct_property/Car').Car;
    const Skil = require('./schemas/direct_property/Skil').Skil;
    const Driver = require('./schemas/direct_property/Driver').Driver;


    let connect = await this.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();


    let car_save_1 = new Car();
    car_save_1.producer = 'Volvo';

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

    car_save_1.drivers = [driver1, driver2];
    car_save_1 = await xsem.save(car_save_1);
    expect(car_save_1.drivers).to.have.length(2);
    console.log(inspect(car_save_1, false, 10));

    let cars_found = await xsem.find(Car, {id: 1});
    let car_find_1 = cars_found.shift();
    console.log(inspect(car_find_1, false, 10));
    expect(car_save_1).to.deep.eq(car_find_1);

    await c.close();

  }


  @test
  async 'saving multiple entities with and without refrences'() {

    let options = _.clone(TEST_STORAGE_OPTIONS);

    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    let connect = await this.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
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

    let options = _.clone(TEST_STORAGE_OPTIONS);

    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    let connect = await this.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
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
    let booksFound = await xsem.find(Book, []);

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
