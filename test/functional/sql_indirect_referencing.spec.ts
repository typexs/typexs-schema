import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';
import {TestHelper} from './TestHelper';
import {TEST_STORAGE_OPTIONS} from './config';


const FINDOPT = {
  hooks: {
    abortCondition: (entityRef: any, propertyDef: any, results: any, op: any) => {
      return op.entityDepth > 1;
    }
  }
};


@suite('functional/sql_indirect_referencing')
class Sql_indirect_referencingSpec {


  before() {
    TestHelper.resetTypeorm();
  }

  after() {

  }


  @test
  async 'entity lifecycle for integrated property'() {

    const options = _.clone(TEST_STORAGE_OPTIONS);
//    (<any>options).name = 'direct_property';


    const Author = require('./schemas/default/Author').Author;
    const Book = require('./schemas/default/Book').Book;
    const Summary = require('./schemas/default/Summary').Summary;

    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();



    const a = new Author();
    a.firstName = 'Robert';
    a.lastName = 'Kania';

    let book_save_1 = new Book();
    book_save_1.content = 'This is a good book';
    book_save_1.author = a;

    const summary = new Summary();
    summary.size = 1000;
    summary.content = 'This is a good summary';
    book_save_1.summary = summary;

    book_save_1 = await xsem.save(book_save_1, {validate: false});

    // console.log(book_save_1)

    // let data2 = await c.connection.query('SELECT name FROM sqlite_master WHERE type=\'table\';');
    // expect(data2).to.have.length(5);

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
    expect(data[0].source_seq_nr).to.eq(0);

    data = await c.connection.query('select * from p_summary');
    expect(data).to.have.length(1);
    expect(data[0].source_id).to.eq(1);
    expect(data[0].source_seq_nr).to.eq(0);


    const books_found = await xsem.find(Book, {id: 1}, FINDOPT);
    expect(books_found).to.have.length(1);
    const book_find_1 = books_found.shift();
    // console.log(book_find_1);
    expect((book_find_1 as any).summary.size).to.be.eq(summary.size);
    expect(book_save_1).to.deep.eq(book_find_1);

    await c.close();

  }


  @test
  async 'entity lifecycle for integrated property with multiple references'() {


    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'integrated_property';


    const Room = require('./schemas/integrated_property/Room').Room;
    const Equipment = require('./schemas/integrated_property/Equipment').Equipment;

    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    let room_save_1 = new Room();
    room_save_1.number = 123;
    room_save_1.equipment = [];

    let s = new Equipment();
    s.label = 'Seats';
    s.amount = 100;
    room_save_1.equipment.push(s);

    s = new Equipment();
    s.label = 'Beamer';
    s.amount = 2;
    room_save_1.equipment.push(s);

    room_save_1 = await xsem.save(room_save_1, {validate: false});
    // console.log(room_save_1);
    const data = await c.connection.query('select * from p_equipment');
    expect(data).to.have.length(2);

    const room_found = await xsem.find(Room, {id: 1});
    expect(room_found).to.have.length(1);

    const room_find_1 = room_found.shift();
    // console.log(room_find_1);
    expect(room_find_1).to.deep.eq(room_save_1);

    await c.close();

  }


  /**
   * TODO think over same properties for multiple entities which have different pk's
   */
}

