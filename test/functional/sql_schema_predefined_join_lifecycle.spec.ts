import {suite,test} from 'mocha-typescript';
import {IStorageOptions} from 'typexs-base';
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import {TestHelper} from "./TestHelper";
import * as _ from "lodash";
import {expect} from 'chai';
import {inspect} from "util";


export const TEST_STORAGE_OPTIONS: IStorageOptions = <SqliteConnectionOptions>{
  name: 'default',
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  logger: 'simple-console',
  logging: 'all'
  // tablesPrefix: ""

};


@suite('functional/sql_schema_predefined_join_lifecycle')
class Sql_schema_predefined_join_lifecycleSpec {


  before() {
    TestHelper.resetTypeorm();
  }

  @test
  async 'E-P-E[] over defined join'() {
    const Lecture = require('./schemas/join/Lecture').Lecture;
    const RBelongsTo = require('./schemas/join/RBelongsTo').RBelongsTo;
    const Teacher = require('./schemas/join/Teacher').Teacher;

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'join';
    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();


    /**
     * create person and course at same time
     */
    let person_save_1 = new Teacher();
    person_save_1.name = 'Robert Kania';

    let person_save_2 = new Teacher();
    person_save_2.name = 'Hans Schmidt';


    let person_save_3 = new Teacher();
    person_save_3.name = 'Böser Wolf';

    let course_save_1 = new Lecture();
    course_save_1.persons = [person_save_1];

    course_save_1 = await xsem.save(course_save_1);
    console.log(course_save_1);

    let courses_found  = await xsem.find(Lecture, {veranstid: 1});
    let course_find_1 = courses_found.shift();
    console.log(course_find_1);
    expect(course_find_1).to.deep.eq(course_save_1);

    /**
     * use existsing person and  create course
     */
    let course_save_2 = new Lecture();
    course_save_2.persons = [person_save_1];
    course_save_2 = await xsem.save(course_save_2);
    console.log(course_save_2);

    courses_found  = await xsem.find(Lecture, {veranstid: 2});
    let course_find_2 = courses_found.shift();
    console.log(course_find_2);
    expect(course_find_2).to.deep.eq(course_save_2);

    /**
     * use existsing person and create new and  create course
     */
    let course_save_3 = new Lecture();
    course_save_3.persons = [person_save_1,person_save_3,person_save_2];
    course_save_3 = await xsem.save(course_save_3);
    console.log(course_save_3);

    courses_found  = await xsem.find(Lecture, {veranstid: 3});
    let course_find_3 = courses_found.shift();
    console.log(course_find_3);
    expect(course_find_3).to.deep.eq(course_save_3);

    courses_found  = await xsem.find(Lecture, [{veranstid:1},{veranstid:2},{veranstid:3}]);
    console.log(inspect(courses_found,false,10));
    expect(courses_found).to.have.length(3);
    expect(_.concat([],... _.map(courses_found,f => f['persons']))).to.have.length(5);


  }


}

