import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import {TestHelper} from './TestHelper';
import * as _ from 'lodash';
import {expect} from 'chai';
import {TEST_STORAGE_OPTIONS} from './config';
import {EntityRegistry} from '../../src/libs/EntityRegistry';
import {RegistryFactory} from '@allgemein/schema-api';
import {NAMESPACE_BUILT_ENTITY} from '../../src/libs/Constants';


let registry: EntityRegistry;
const FINDOPT = {
  hooks: {
    abortCondition: (entityRef: any, propertyDef: any, results: any, op: any) => {
      return op.entityDepth > 1;
    }
  }
};


@suite('functional/sql_schema_predefined_join_lifecycle')
class SqlSchemaPredefinedJoinLifecycleSpec {


  static before() {
    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
  }

  static after() {
    RegistryFactory.reset();
  }

  before() {
    TestHelper.resetTypeorm();
  }


  @test
  async 'E-P-E[] over defined join'() {
    const Lecture = require('./schemas/join/Lecture').Lecture;
    const RBelongsTo = require('./schemas/join/RBelongsTo').RBelongsTo;
    const Teacher = require('./schemas/join/Teacher').Teacher;

    registry.reload([Lecture, RBelongsTo, Teacher]);

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'join';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();


    /**
     * create person and course at same time
     */
    const person_save_1 = new Teacher();
    person_save_1.name = 'Robert Kania';

    const person_save_2 = new Teacher();
    person_save_2.name = 'Hans Schmidt';


    const person_save_3 = new Teacher();
    person_save_3.name = 'Böser Wolf';

    let course_save_1 = new Lecture();
    course_save_1.persons = [person_save_1];

    course_save_1 = await xsem.save(course_save_1, {validate: false});
    // console.log(course_save_1);

    let courses_found = await xsem.find(Lecture, {veranstid: 1}, FINDOPT);
    const course_find_1 = courses_found.shift();
    // console.log(course_find_1);
    expect(course_find_1).to.deep.eq(course_save_1);

    /**
     * use existsing person and  create course
     */
    let course_save_2 = new Lecture();
    course_save_2.persons = [person_save_1];
    course_save_2 = await xsem.save(course_save_2, {validate: false});
    // console.log(course_save_2);

    courses_found = await xsem.find(Lecture, {veranstid: 2}, FINDOPT);
    const course_find_2 = courses_found.shift();
    // console.log(course_find_2);
    expect(course_find_2).to.deep.eq(course_save_2);

    /**
     * use existsing person and create new and  create course
     */
    let course_save_3 = new Lecture();
    course_save_3.persons = [person_save_1, person_save_3, person_save_2];
    course_save_3 = await xsem.save(course_save_3, {validate: false});
    // console.log(course_save_3);

    courses_found = await xsem.find(Lecture, {veranstid: 3}, FINDOPT);
    const course_find_3 = courses_found.shift();
    // console.log(course_find_3);
    expect(course_find_3).to.deep.eq(course_save_3);

    courses_found = await xsem.find(Lecture, {$or: [{veranstid: 1}, {veranstid: 2}, {veranstid: 3}]});
    // console.log(inspect(courses_found,false,10));
    expect(courses_found).to.have.length(3);
    expect(_.concat([], ..._.map(courses_found, f => f['persons']))).to.have.length(5);


  }


}

