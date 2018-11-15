import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';
import {IStorageOptions, StorageRef} from "@typexs/base";
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import {inspect} from 'util';
import {EntityController} from "../../src/libs/EntityController";
import {TestHelper} from "./TestHelper";
import {TEST_STORAGE_OPTIONS} from "./config";



@suite('functional/entity_lifecycle/direct_referencing')
class Scenario_01_direct_referencingSpec {

  before() {
    TestHelper.resetTypeorm();
  }

  async connect(options: any): Promise<{ ref: StorageRef, controller: EntityController }> {
    return TestHelper.connect(options);
  }

  @test
  async 'entity referencing property E-P-E over property table'() {
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

    let books_found = await xsem.find<any>(Book, {id: 1});
    expect(books_found).to.have.length(1);

    let book_find_01 = books_found.shift();
    expect(book).to.deep.eq(book_find_01);

    // TODO delete



    await c.close();

  }


  @test
  async 'entity referencing through embedded mode E-P-E (test embed and idKey)'() {
    let options = _.clone(TEST_STORAGE_OPTIONS);
//    (<any>options).name = 'direct_property';

    const Course = require('./schemas/default/Course').Course;
    const Periode = require('./schemas/default/Periode').Periode;

    let connect = await this.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let course_save_1 = new Course();
// embed test
    course_save_1.periode = new Periode();
    course_save_1.periode.year = 2018;
// idKey test
    course_save_1.periode_alt = new Periode();
    course_save_1.periode_alt.year = 2019;
    course_save_1 = await xsem.save(course_save_1);

    let courses_found = await xsem.find(Course, {id: 1});
    let course_find_1 = courses_found.shift();

    expect(course_find_1).to.deep.eq(course_save_1);
    await c.close();
  }

  @test
  async 'entity referencing through embedded mode E-P-O'() {
    let options = _.clone(TEST_STORAGE_OPTIONS);
//    (<any>options).name = 'direct_property';

    const Course2 = require('./schemas/default/Course2').Course2;
    const Literatur = require('./schemas/default/Literatur').Literatur;

    let connect = await this.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let course2_save_1 = new Course2();
    course2_save_1.literatur = new Literatur();
    course2_save_1.literatur.titel = 'Bürgeliches Gesetzbuch';
    course2_save_1.literatur.titelid = 'BGB';
    course2_save_1 = await xsem.save(course2_save_1);
    console.log(course2_save_1);

    let courses_found = await xsem.find(Course2, {id: 1});
    let course2_find_1 = courses_found.shift();
    console.log(course2_find_1);

    expect(course2_find_1).to.deep.eq(course2_save_1);
    await c.close();
  }

  @test
  async 'entity referencing through embedded mode E-P-O-P-O'() {
    let options = _.clone(TEST_STORAGE_OPTIONS);
//    (<any>options).name = 'direct_property';

    const EDR = require('./schemas/default/EDR').EDR;
    const EDR_Object_DR = require('./schemas/default/EDR_Object_DR').EDR_Object_DR;
    const EDR_Object = require('./schemas/default/EDR_Object').EDR_Object;

    let connect = await this.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let edr_save_1 = new EDR();
    edr_save_1.object = new EDR_Object_DR();
    edr_save_1.object.object = new EDR_Object();
    edr_save_1 = await xsem.save(edr_save_1);
    console.log(edr_save_1);

    let edrs_found = await xsem.find(EDR, {id: 1});
    let edr_find_1 = edrs_found.shift();
    console.log(edr_find_1);

    expect(edr_find_1).to.deep.eq(edr_save_1);
    await c.close();
  }


  @test
  async 'entity referencing property E-P-E[]'() {
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
  async 'referencing property E-P-SP-E'() {

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
  async 'referencing property E-P-SP[]-E'() {

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


  @test
  async 'find multiple entities with limit, offset, sort'() {
    let options = _.clone(TEST_STORAGE_OPTIONS);

    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    let connect = await this.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let books = [];

    for (let i = 0; i < 30; i++) {
      let a = new Author();
      a.firstName = 'Robert';
      a.lastName = 'Kania' + i;
      a = await xsem.save(a);

      let book = new Book();
      book.label = 'Book' + i;
      book.author = a;
      books.push(book)
    }

    await xsem.save(books);

    let booksFound = await xsem.find(Book, {$or: [{label: 'Book5'}, {label: 'Book10'}]});
    expect(booksFound).to.have.length(2);
    expect(booksFound['$count']).to.eq(2);
    // TODO delete

    booksFound = await xsem.find(Book, {label: {$like: 'Book1%'}});
    expect(booksFound).to.have.length(11);
    expect(booksFound['$count']).to.eq(11);

    booksFound = await xsem.find(Book, {label: {$like: 'Book1%'}}, {limit: 5});
    expect(booksFound).to.have.length(5);
    expect(booksFound['$count']).to.eq(11);

    booksFound = await xsem.find(Book, {label: {$like: 'Book1%'}}, {limit: 5, offset: 7});
    expect(booksFound).to.have.length(4);
    expect(booksFound['$count']).to.eq(11);
    expect(booksFound['$offset']).to.eq(7);
    expect(booksFound['$limit']).to.eq(5);
    expect(_.map(booksFound, (b: any) => b.label)).to.deep.eq(["Book16", "Book17", "Book18", "Book19"]);

    booksFound = await xsem.find(Book, {label: {$like: 'Book1%'}}, {limit: 5, offset: 7, sort: {id: "desc"}});
    expect(booksFound).to.have.length(4);
    expect(booksFound['$count']).to.eq(11);
    expect(booksFound['$offset']).to.eq(7);
    expect(booksFound['$limit']).to.eq(5);
    expect(_.map(booksFound, (b: any) => b.label)).to.deep.eq(["Book12", "Book11", "Book10", "Book1"]);

    booksFound = await xsem.find(Book, {$or: [{label: 'Book5'}, {label: 'Book10'}]}, {
      hooks: {
        afterEntity: (entityDef, entities) => {
          if(entityDef.name === 'Book'){
            entities.forEach(entity => {
              entity['$fullname'] = entity.author.firstName + ' ' + entity.author.lastName;
            })
          }
        }
      }
    });
    expect(booksFound).to.have.length(2);
    expect(_.map(booksFound, (b: any) => b['$fullname'])).to.deep.eq(["Robert Kania5", "Robert Kania10"]);


    await c.close();
  }

  @test.skip()
  async 'must throw error variant E-P-SP[]-E[] or E-P-SP-E[] not implemented'() {
  }


  @test.skip()
  async 'multiple direct entity referencing E-P-SP[]-E'() {
  }


  @test.skip()
  async 'error on referencing sub-property with multiple entity references E-P-SP-E[]'() {
  }

}
