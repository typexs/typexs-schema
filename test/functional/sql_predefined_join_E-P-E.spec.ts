import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import * as _ from 'lodash';
import {TestHelper} from './TestHelper';
import {TEST_STORAGE_OPTIONS} from './config';
import {EntityController} from '../../src/libs/EntityController';
import {TypeOrmConnectionWrapper} from '@typexs/base';
import {ILookupRegistry, RegistryFactory} from '@allgemein/schema-api';
import {NAMESPACE_BUILT_ENTITY} from '../../src/libs/Constants';
import {EntityRegistry} from '../../src/libs/EntityRegistry';

let c: TypeOrmConnectionWrapper;
let entityController: EntityController;

let Teacher: any;
let RBelongsTo: any;
let SimpleLecture: any;
let registry: EntityRegistry;

@suite('functional/sql_predefined_join E-P-E')
class SqlPredefinedJoinEPESpec {

  static before() {
    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
  }

  static after() {
    RegistryFactory.reset();
  }

  async before() {
    TestHelper.resetTypeorm();

    Teacher = require('./schemas/join/Teacher').Teacher;
    RBelongsTo = require('./schemas/join/RBelongsTo').RBelongsTo;
    SimpleLecture = require('./schemas/join/SimpleLecture').SimpleLecture;

    registry.reload();

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'join';
    const connect = await TestHelper.connect(options);
    entityController = connect.controller;
    const ref = connect.ref;
    c = await ref.connect();
  }

  async after() {
    if (c) {
      await c.close();
    }
  }


  @test
  async 'create E-P-E schema with predefined join tables'() {

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members([
      'personal',
      'simple_course',
      'r_belongsto'
    ]);

    const cols = await c.connection.query('PRAGMA table_info(\'r_belongsto\')');
    expect(_.map(cols, t => t.name)).to.have.members([
      'zeitstempel',
      'beltoid',
      'ownertab',
      'ownerid',
      'tabelle',
      'tabpk',
      'sortierung'
    ]);

    // const metadata = getMetadataArgsStorage();
    // const registries = LookupRegistry.getRegistries();
    // console.log(registries.length);
  }


  /**
   * Join references without an referring value should be null
   */
  @test
  async 'handle empty E-P-E entries'() {
    const lecture = new SimpleLecture();
    lecture.label = 'Math';

    await entityController.save(lecture);

    const lectures = await entityController.find(SimpleLecture) as any[];
    expect(lectures).to.have.length(1);
    expect(lectures[0].label).to.be.eq('Math');
    expect(lectures[0].person).to.be.null;
  }

  /**
   * Save E-P-E entity
   */
  @test
  async 'save E-P-E entry'() {
    const teacher = new Teacher();
    teacher.name = 'Siegfried';

    const lecture = new SimpleLecture();
    lecture.label = 'Math';
    lecture.person = teacher;

    await entityController.save(lecture);

    const lectures = await entityController.find(SimpleLecture) as any[];
    expect(lectures).to.have.length(1);
    expect(lectures[0].person).to.exist;
    expect(lectures[0]).to.deep.include({
      'label': 'Math',
      'veranstid': 1
    });

    expect(lectures[0].person).to.deep.include({
      'name': 'Siegfried',
      'pid': 1
    });

    const values: any[] = await c.connection.query('SELECT * FROM r_belongsto;');
    expect(values).to.have.length(1);
    expect(values[0]).to.deep.include({
      'beltoid': 1,
      'ownerid': 1,
      'ownertab': 'personal',
      'sortierung': 0,
      'tabelle': 'veranstaltung',
      'tabpk': 1
    });

  }

  /**
   * Check if on resaving of the same entity, everything keeps the same
   */
  @test
  async 'update existing E-P-E entry with same data (lookup_update mode)'() {
    // Create the entry
    const teacher = new Teacher();
    teacher.name = 'Siegfried';
    const lecture = new SimpleLecture();
    lecture.label = 'Math';
    lecture.person = teacher;
    await entityController.save(lecture);


    const lectures = await entityController.find(SimpleLecture) as any[];
    expect(lectures).to.have.length(1);
    expect(lectures[0].person).to.exist;
    expect(lectures[0]).to.deep.include({
      'label': 'Math',
      'veranstid': 1
    });

    expect(lectures[0].person).to.deep.include({
      'name': 'Siegfried',
      'pid': 1
    });

    // save again
    await entityController.save(lectures[0]);

    const values: any[] = await c.connection.query('SELECT * FROM r_belongsto;');
    expect(values).to.have.length(1);
    expect(values[0]).to.deep.include({
      'beltoid' : 1,
      'ownerid': 1,
      'ownertab': 'personal',
      'sortierung': 0,
      'tabelle': 'veranstaltung',
      'tabpk': 1
    });
  }


  /**
   * Check if on resaving of the same entity, everything keeps the same
   */
  @test
  async 'update existing E-P-E entry with same data (recreate mode)'() {
    // Create the entry
    const teacher = new Teacher();
    teacher.name = 'Siegfried';
    const lecture = new SimpleLecture();
    lecture.label = 'Math';
    lecture.person = teacher;
    await entityController.save(lecture);


    const lectures = await entityController.find(SimpleLecture) as any[];
    expect(lectures).to.have.length(1);
    expect(lectures[0].person).to.exist;
    expect(lectures[0]).to.deep.include({
      'label': 'Math',
      'veranstid': 1
    });

    expect(lectures[0].person).to.deep.include({
      'name': 'Siegfried',
      'pid': 1
    });

    // save again
    await entityController.save(lectures[0], <any>{relationUpdateMode: 'recreate'});

    const values: any[] = await c.connection.query('SELECT * FROM r_belongsto;');
    expect(values).to.have.length(1);
    expect(values[0]).to.deep.include({
      'beltoid' : 2,
      'ownerid': 1,
      'ownertab': 'personal',
      'sortierung': 0,
      'tabelle': 'veranstaltung',
      'tabpk': 1
    });
  }




  /**
   * Multi save join references with an referring value
   */
  @test
  async 'save multiple E-P-E entries'() {
    let lectures = [];
    for (let i = 0; i < 4; i++) {
      const teacher = new Teacher();
      teacher.pid = i;
      teacher.name = 'Siegfried ' + i;

      const lecture = new SimpleLecture();
      lecture.veranstid = i;
      lecture.label = 'Math ' + i;
      lecture.person = teacher;
      lectures.push(lecture);

    }


    await entityController.save(lectures);
    const values: any[] = await c.connection.query('SELECT * FROM r_belongsto;');
    expect(values).to.have.length(4);
    expect(values[0]).to.deep.include({
      'beltoid': 1,
      'ownerid': 0,
      'ownertab': 'personal',
      'sortierung': 0,
      'tabelle': 'veranstaltung',
      'tabpk': 0
    });
    expect(values[1]).to.deep.include({
      'beltoid': 2,
      'ownerid': 1,
      'ownertab': 'personal',
      'sortierung': 0,
      'tabelle': 'veranstaltung',
      'tabpk': 1
    });
    expect(values[2]).to.deep.include({
      'beltoid': 3,
      'ownerid': 2,
      'ownertab': 'personal',
      'sortierung': 0,
      'tabelle': 'veranstaltung',
      'tabpk': 2
    });
    expect(values[3]).to.deep.include({
        'beltoid': 4,
        'ownerid': 3,
        'ownertab': 'personal',
        'sortierung': 0,
        'tabelle': 'veranstaltung',
        'tabpk': 3
      }
    );


    lectures = await entityController.find(SimpleLecture) as any[];
    expect(lectures).to.have.length(4);
    expect(lectures.map(x => [x.veranstid, _.get(x, 'person.pid')])).to.deep.eq([
      [
        0, 0
      ],
      [
        1, 1
      ],
      [
        2, 2
      ],
      [
        3, 3
      ]
    ]);
  }


  /**
   * Multi save join references with an referring value
   */
  @test
  async 'save multiple E-P-E entries where some refs are missing'() {
    let lectures = [];
    let _switch = false;
    for (let i = 0; i < 4; i++) {


      const lecture = new SimpleLecture();
      lecture.veranstid = i;
      lecture.label = 'Math ' + i;


      if (i % 2 === 0) {
        const teacher = new Teacher();
        teacher.pid = i;
        teacher.name = 'Siegfried ' + i;
        lecture.person = teacher;
      } else {
        if (_switch) {
          _switch = true;
          lecture.person = null;
        } else {
          // identity is undefined!
        }
      }

      lectures.push(lecture);
    }


    lectures = await entityController.save(lectures);

    const values: any[] = await c.connection.query('SELECT * FROM r_belongsto;');
    expect(values).to.have.length(2);
    expect(values[0]).to.deep.include({
      'beltoid': 1,
      'ownerid': 0,
      'ownertab': 'personal',
      'sortierung': 0,
      'tabelle': 'veranstaltung',
      'tabpk': 0
    });
    expect(values[1]).to.deep.include({
      'beltoid': 2,
      'ownerid': 2,
      'ownertab': 'personal',
      'sortierung': 0,
      'tabelle': 'veranstaltung',
      'tabpk': 2
    });

    lectures = await entityController.find(SimpleLecture) as any[];
    expect(lectures).to.have.length(4);
    expect(lectures.map(x => [x.veranstid, _.get(x, 'person.pid')])).to.deep.eq([
      [
        0, 0
      ],
      [
        1, undefined
      ],
      [
        2, 2
      ],
      [
        3, undefined
      ]
    ]);

  }

}

