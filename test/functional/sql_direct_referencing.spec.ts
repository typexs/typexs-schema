// process.env['SQL_LOG'] = '1';
import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import * as _ from 'lodash';
import {StorageRef, TypeOrmConnectionWrapper} from '@typexs/base';
import {EntityController} from '../../src/libs/EntityController';
import {TestHelper} from './TestHelper';
import {TEST_STORAGE_OPTIONS} from './config';
import {ILookupRegistry, RegistryFactory} from '@allgemein/schema-api';
import {NAMESPACE_BUILT_ENTITY} from '../../src/libs/Constants';


const FINDOPT = {
  hooks: {
    abortCondition: (entityRef: any, propertyDef: any, results: any, op: any) => {
      return op.entityDepth > 1;
    }
  }
};


let registry: ILookupRegistry;

@suite('functional/sql_direct_referencing')
class SqlDirectReferencingSpec {

  static before() {
    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
  }

  static after() {
    RegistryFactory.reset();
  }

  before() {
    TestHelper.resetTypeorm();
  }



  async connect(options: any): Promise<{ ref: StorageRef, controller: EntityController }> {
    return TestHelper.connect(options);
  }

  @test
  async 'entity referencing property E-P-E over property table'() {
    const options = _.clone(TEST_STORAGE_OPTIONS);
//    (<any>options).name = 'direct_property';

    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    const authorRef = registry.getEntityRefFor(Author);
    const bookRef = registry.getEntityRefFor(Book);


    const connect = await this.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect() as TypeOrmConnectionWrapper;

    const a = new Author();
    a.firstName = 'Robert';
    a.lastName = 'Kania';


    let book = new Book();
    book.content = 'This is a good book';
    book.author = a;

    book = await xsem.save(book, {validate: false});
    expect(book.id).to.be.eq(1);
    expect(book.author.id).to.be.eq(1);


    let data = await c.connection.query('select * from author');
    expect(data).to.have.length(1);
    expect(data[0].id).to.eq(1);

    data = await c.connection.query('select * from book');
    expect(data).to.have.length(1);
    expect(data[0].id).to.eq(1);

    data = await c.connection.query('select * from p_book_author');
    expect(data).to.have.length(1);
    expect(data[0].source_id).to.eq(1);
    expect(data[0].target_id).to.eq(1);

    const books_found = await xsem.find<any>(Book, {id: 1}, FINDOPT);
    expect(books_found).to.have.length(1);

    const book_find_01 = books_found.shift();
    expect(book).to.deep.eq(book_find_01);

    // TODO delete


    await c.close();

  }


  @test
  async 'entity referencing through embedded mode E-P-E (test embed and idKey)'() {
    const options = _.clone(TEST_STORAGE_OPTIONS);
//    (<any>options).name = 'direct_property';

    const Course = require('./schemas/default/Course').Course;
    const Periode = require('./schemas/default/Periode').Periode;
    const authorRef = registry.getEntityRefFor(Course);
    const bookRef = registry.getEntityRefFor(Periode);

    const connect = await this.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    let course_save_1 = new Course();
// embed test
    course_save_1.periode = new Periode();
    course_save_1.periode.year = 2018;
// idKey test
    course_save_1.periode_alt = new Periode();
    course_save_1.periode_alt.year = 2019;
    course_save_1 = await xsem.save(course_save_1, {validate: false});

    const courses_found = await xsem.find(Course, {id: 1}, FINDOPT);
    const course_find_1 = courses_found.shift();

    expect(course_find_1).to.deep.eq(course_save_1);
    await c.close();
  }

  @test
  async 'entity referencing through embedded mode E-P-O'() {
    const options = _.clone(TEST_STORAGE_OPTIONS);
//    (<any>options).name = 'direct_property';

    const Course2 = require('./schemas/default/Course2').Course2;
    const Literatur = require('./schemas/default/Literatur').Literatur;

    const connect = await this.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    let course2_save_1 = new Course2();
    course2_save_1.literatur = new Literatur();
    course2_save_1.literatur.titel = 'Bürgeliches Gesetzbuch';
    course2_save_1.literatur.titelid = 'BGB';
    course2_save_1 = await xsem.save(course2_save_1, {validate: false});
    //// console.log(course2_save_1);

    const courses_found = await xsem.find(Course2, {id: 1}, FINDOPT);
    const course2_find_1 = courses_found.shift();
    //// console.log(course2_find_1);

    expect(course2_find_1).to.deep.eq(course2_save_1);
    await c.close();
  }

  @test
  async 'entity referencing through embedded mode E-P-O-P-O'() {
    const options = _.clone(TEST_STORAGE_OPTIONS);
//    (<any>options).name = 'direct_property';

    const EDR = require('./schemas/default/EDR').EDR;
    const EDR_Object_DR = require('./schemas/default/EDR_Object_DR').EDR_Object_DR;
    const EDR_Object = require('./schemas/default/EDR_Object').EDR_Object;
    // const authorRef = registry.getEntityRefFor(EDR);
    // const bookRef = registry.getEntityRefFor(EDR_Object_DR);
    // const bookRef2 = registry.getEntityRefFor(EDR_Object);

    const connect = await this.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    let edr_save_1 = new EDR();
    edr_save_1.object = new EDR_Object_DR();
    edr_save_1.object.object = new EDR_Object();
    edr_save_1 = await xsem.save(edr_save_1, {validate: false});
    // console.log(edr_save_1);

    const edrs_found = await xsem.find(EDR, {id: 1}, FINDOPT);
    const edr_find_1 = edrs_found.shift();
    // console.log(edr_find_1);

    expect(edr_find_1).to.deep.eq(edr_save_1);
    await c.close();
  }


  @test
  async 'entity referencing property E-P-E[]'() {
    const options = _.clone(TEST_STORAGE_OPTIONS);

    const Author = require('./schemas/default/Author').Author;
    const Book2 = require('./schemas/default/Book2').Book2;

    const connect = await this.connect(options);
    const entityController = connect.controller;
    const storageRef = connect.ref;
    const c = await storageRef.connect();

    const a = new Author();
    a.firstName = 'Robert';
    a.lastName = 'Kania';

    const a2 = new Author();
    a2.firstName = 'Josef';
    a2.lastName = 'Bania';

    const a3 = new Author();
    a3.firstName = 'Andi';
    a3.lastName = 'Müller';

    const a4 = new Author();
    a4.firstName = 'Hans';
    a4.lastName = 'Schmidt';

    let book_save_1 = new Book2();
    book_save_1.content = 'This is a good book';
    book_save_1.authors = [a, a2];

    book_save_1 = await entityController.save(book_save_1, {validate: false});
    // console.log(book_save_1);
    expect(book_save_1.id).to.be.eq(1);
    expect(book_save_1.authors).to.have.length(2);
    expect(_.find(book_save_1.authors, {lastName: 'Bania', id: 2})).to.deep.include({lastName: 'Bania', id: 2});
    expect(_.find(book_save_1.authors, {lastName: 'Kania', id: 1})).to.deep.include({lastName: 'Kania', id: 1});

    const connection = await storageRef.connect() as TypeOrmConnectionWrapper; // getController().find(Author, {$and: [{id: 1}, {id: 2}]});
    const authorsFound = await connection.manager.find(Author, [{id: 1}, {id: 2}]);
    expect(authorsFound).to.have.length(2);
    await connection.close();


    let books: any[] = await entityController.find(Book2, {id: 1}, FINDOPT);
    // console.log(books);
    expect(books).to.have.length(1);
    const book_find_1 = books.shift();
    expect(book_find_1.id).to.be.eq(1);
    expect(book_find_1.authors).to.have.length(2);
    expect(_.find(book_find_1.authors, {lastName: 'Bania', id: 2})).to.deep.include({lastName: 'Bania', id: 2});
    expect(_.find(book_find_1.authors, {lastName: 'Kania', id: 1})).to.deep.include({lastName: 'Kania', id: 1});

    let book_save_2 = new Book2();
    book_save_2.content = 'Robi tobi und das Fliwatüt';
    book_save_2.authors = [a];
    book_save_2 = await entityController.save(book_save_2, {validate: false});
    // console.log(book_save_2);
    expect(book_save_2.id).to.be.eq(2);
    expect(book_save_2.authors).to.have.length(1);
    expect(_.find(book_save_2.authors, {lastName: 'Kania', id: 1})).to.deep.include({lastName: 'Kania', id: 1});

    books = await entityController.find(Book2, {id: 2}, FINDOPT);
    // console.log(books);
    expect(books).to.have.length(1);
    const book_find_3 = books.shift();
    expect(book_find_3.id).to.be.eq(2);
    expect(book_find_3.authors).to.have.length(1);
    expect(_.find(book_find_3.authors, {lastName: 'Kania', id: 1})).to.deep.include({lastName: 'Kania', id: 1});

    // save multiple books

    const book_save_3 = new Book2();
    book_save_3.content = 'Mittelalter';
    book_save_3.authors = [a3, a2];

    const book_save_4 = new Book2();
    book_save_4.content = 'Kurz Geschichte der Zeit';
    book_save_4.authors = [a3, a4];


    let books_saved = await entityController.save([book_save_3, book_save_4], {validate: false});
    // console.log(inspect(books_saved, false, 10));
    expect(books_saved).to.have.length(2);

    let books_found = await entityController.find(Book2, {$or: [{id: 3}, {id: 4}]}, FINDOPT);
    // console.log(inspect(books_found, false, 10));
    expect(books_found).to.have.length(2);
    expect(books_saved).to.deep.eq(books_found);

    // book without author
    const book_save_5 = new Book2();
    book_save_5.content = 'Karate';

    books_saved = await entityController.save([book_save_5], {validate: false});
    // console.log(inspect(books_saved, false, 10));
    expect(books_saved).to.have.length(1);

    books_found = await entityController.find(Book2, [{id: 5}], FINDOPT);
    // console.log(inspect(books_found, false, 10));
    expect(books_found).to.have.length(1);
    expect(books_saved).to.deep.eq(books_found);

    // book empty author
    const book_save_6 = new Book2();
    book_save_6.content = 'Karate';
    book_save_6.authors = [];

    books_saved = await entityController.save([book_save_6], {validate: false});
    // console.log(inspect(books_saved, false, 10));

    books_found = await entityController.find(Book2, [{id: 6}], FINDOPT);
    // console.log(inspect(books_found, false, 10));
    expect(books_found).to.have.length(1);
    expect(books_saved).to.deep.eq(books_found);

    await c.close();

  }


  // TODO NULLABLE!!!

  @test
  async 'referencing property E-P-SP-E'() {

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'direct_property';

    const Car = require('./schemas/direct_property/Car').Car;
    const Skil = require('./schemas/direct_property/Skil').Skil;
    const Driver = require('./schemas/direct_property/Driver').Driver;
    registry.getEntityRefFor(Car);
    registry.getEntityRefFor(Skil);
    // registry.getEntityRefFor(Driver);


    const connect = await this.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect() as TypeOrmConnectionWrapper;

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    expect(tables).to.have.length(5);
    expect(_.map(tables, table => table.name)).to.have.include.members(['car', 'skil', 'p_car_driver', 'p_car_drivers']);

    let car_save_1 = new Car();
    car_save_1.producer = 'Volvo';
    car_save_1.driver = new Driver();
    car_save_1.driver.age = 30;
    car_save_1.driver.nickName = 'Fireball';
    car_save_1.driver.skill = new Skil();
    car_save_1.driver.skill.label = 'ASD';
    car_save_1.driver.skill.quality = 123;

    car_save_1 = await xsem.save(car_save_1, {validate: false});
    // console.log(car_save_1);

    const cars_found = await xsem.find(Car, {id: 1}, FINDOPT);
    // console.log(inspect(cars_found, false, 10));

    const car_find_1 = cars_found.shift();
    expect(car_save_1).to.deep.eq(car_find_1);

    await c.close();


  }

  @test
  async 'referencing property E-P-SP[]-E'() {

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'direct_property';

    const Car = require('./schemas/direct_property/Car').Car;
    const Skil = require('./schemas/direct_property/Skil').Skil;
    const Driver = require('./schemas/direct_property/Driver').Driver;


    const connect = await this.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();


    let car_save_1 = new Car();
    car_save_1.producer = 'Volvo';

    const driver1 = new Driver();
    driver1.age = 30;
    driver1.nickName = 'Fireball';
    driver1.skill = new Skil();
    driver1.skill.label = 'won';
    driver1.skill.quality = 123;

    const driver2 = new Driver();
    driver2.age = 29;
    driver2.nickName = 'Thunder';
    driver2.skill = new Skil();
    driver2.skill.label = 'lose';
    driver2.skill.quality = 12;

    car_save_1.drivers = [driver1, driver2];
    car_save_1 = await xsem.save(car_save_1, {validate: false});
    expect(car_save_1.drivers).to.have.length(2);
    // console.log(inspect(car_save_1, false, 10));

    const cars_found = await xsem.find(Car, {id: 1}, FINDOPT);
    const car_find_1 = cars_found.shift();
    // console.log(inspect(car_find_1, false, 10));
    expect(car_save_1).to.deep.eq(car_find_1);

    await c.close();

  }


  @test
  async 'saving multiple entities with and without refrences'() {

    const options = _.clone(TEST_STORAGE_OPTIONS);

    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    const connect = await this.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const a = new Author();
    a.firstName = 'Robert';
    a.lastName = 'Kania';

    const a2 = new Author();
    a2.firstName = 'Josef';
    a2.lastName = 'Bania';

    const book = new Book();
    book.label = 'This is a good book';
    book.author = a;

    const book2 = new Book();
    book2.label = 'Best book ever';
    book2.author = a2;

    const booksToSave = [book, book2];
    const books = await xsem.save(booksToSave, {validate: false});


    const booksFound = await xsem.find(Book, null, FINDOPT);

    expect(books).to.be.deep.eq(booksFound);

    // TODO delete

    await c.close();

  }

  @test
  async 'saving multiple entities with shared entity refrences'() {
    const options = _.clone(TEST_STORAGE_OPTIONS);

    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    const connect = await this.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    let a = new Author();
    a.firstName = 'Robert';
    a.lastName = 'Kania';
    a = await xsem.save(a, {validate: false});


    const book = new Book();
    book.label = 'This is a good book';
    book.author = a;

    const book2 = new Book();
    book2.label = 'Best book ever';
    book2.author = a;

    const booksToSave = [book, book2];
    const books = await xsem.save(booksToSave, {validate: false});
    const booksFound = await xsem.find(Book, null, FINDOPT);

    expect(books).to.be.deep.eq(booksFound);

    // TODO delete

    await c.close();
  }


  @test
  async 'find multiple entities with limit, offset, sort'() {
    const options = _.clone(TEST_STORAGE_OPTIONS);

    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;

    const connect = await this.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const books = [];

    for (let i = 0; i < 30; i++) {
      let a = new Author();
      a.firstName = 'Robert';
      a.lastName = 'Kania' + i;
      a = await xsem.save(a, {validate: false});

      const book = new Book();
      book.label = 'Book' + i;
      book.author = a;
      books.push(book);
    }

    await xsem.save(books, {validate: false});

    let booksFound = await xsem.find(Book, {$or: [{label: 'Book5'}, {label: 'Book10'}]}, FINDOPT);
    expect(booksFound).to.have.length(2);
    expect(booksFound['$count']).to.eq(2);
    // TODO delete

    booksFound = await xsem.find(Book, {label: {$like: 'Book1%'}}, FINDOPT);
    expect(booksFound).to.have.length(11);
    expect(booksFound['$count']).to.eq(11);

    booksFound = await xsem.find(Book, {label: {$like: 'Book1%'}}, {limit: 5, ...FINDOPT});
    expect(booksFound).to.have.length(5);
    expect(booksFound['$count']).to.eq(11);

    booksFound = await xsem.find(Book, {label: {$like: 'Book1%'}}, {limit: 5, offset: 7, ...FINDOPT});
    expect(booksFound).to.have.length(4);
    expect(booksFound['$count']).to.eq(11);
    expect(booksFound['$offset']).to.eq(7);
    expect(booksFound['$limit']).to.eq(5);
    expect(_.map(booksFound, (b: any) => b.label)).to.deep.eq(['Book16', 'Book17', 'Book18', 'Book19']);

    booksFound = await xsem.find(Book, {label: {$like: 'Book1%'}}, {limit: 5, offset: 7, sort: {id: 'desc'}, ...FINDOPT});
    expect(booksFound).to.have.length(4);
    expect(booksFound['$count']).to.eq(11);
    expect(booksFound['$offset']).to.eq(7);
    expect(booksFound['$limit']).to.eq(5);
    expect(_.map(booksFound, (b: any) => b.label)).to.deep.eq(['Book12', 'Book11', 'Book10', 'Book1']);


    booksFound = await xsem.find(Book, {'author.lastName': 'Kania5'}, {limit: 5, sort: {id: 'desc'}, ...FINDOPT});
    expect(booksFound).to.have.length(1);
    expect(booksFound['$count']).to.eq(1);
    expect(_.map(booksFound, (b: any) => b.label)).to.deep.eq(['Book5']);


    booksFound = await xsem.find(Book, {$or: [{label: 'Book5'}, {label: 'Book10'}]}, {
      hooks: {
        afterEntity: (entityDef, entities) => {
          if (entityDef.name === 'Book') {
            entities.forEach(entity => {
              entity['$fullname'] = entity.author.firstName + ' ' + entity.author.lastName;
            });
          }
        }
      },

    });
    expect(booksFound).to.have.length(2);
    expect(_.map(booksFound, (b: any) => b['$fullname'])).to.deep.eq(['Robert Kania5', 'Robert Kania10']);


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
