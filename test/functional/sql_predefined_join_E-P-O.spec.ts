import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import * as _ from 'lodash';
import {TestHelper} from './TestHelper';
import {TEST_STORAGE_OPTIONS} from './config';
import {TypeOrmConnectionWrapper} from '@typexs/base';
import {EntityController} from '../../src/libs/EntityController';
import {ILookupRegistry, RegistryFactory} from '@allgemein/schema-api';
import {NAMESPACE_BUILT_ENTITY} from '../../src/libs/Constants';


let c: TypeOrmConnectionWrapper;
let entityController: EntityController;

let Candidate: any;
let IdentityRole: any;
let Identity: any;
let registry: ILookupRegistry;
@suite('functional/sql_predefined_join E-P-O')
class SqlPredefinedJoinEPOSpec {

  static before() {
    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
  }

  static after() {
    RegistryFactory.reset();
  }


  async before() {
    TestHelper.resetTypeorm();
    Candidate = require('./schemas/join/Candidate').Candidate;
    IdentityRole = require('./schemas/join/IdentityRole').IdentityRole;
    Identity = require('./schemas/join/Identity').Identity;

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
  async 'create E-P-O schema with predefined join tables'() {

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members([
      'bew',
      'identroll',
      'ident'
    ]);

    const cols = await c.connection.query('PRAGMA table_info(\'identroll\')');
    expect(_.map(cols, t => t.name)).to.have.members([
      'identnr',
      'rolle',
      'verbindung_integer',
      'verbindung_char',
      'anschrkz'
    ]);

  }


  /**
   * Join references without an referring value should be null
   */
  @test
  async 'handle empty E-P-O entries'() {
    const candidate = new Candidate();
    candidate.bewnr = 1234;
    candidate.nachname = 'Siegfried';

    await entityController.save(candidate);

    const candidates = await entityController.find(Candidate) as any[];
    expect(candidates).to.have.length(1);
    expect(candidates[0].identity).to.be.null;
  }

  /**
   * Save E-P-O entity
   */
  @test
  async 'save E-P-O entry'() {
    const identity = new Identity();
    identity.identnr = 91234;
    identity.name = 'Siegfried';

    const candidate = new Candidate();
    candidate.bewnr = 1234;
    candidate.nachname = 'Siegfried';
    candidate.identity = identity;

    await entityController.save(candidate);

    const candidates = await entityController.find(Candidate) as any[];
    expect(candidates).to.have.length(1);
    expect(candidates[0].identity).to.exist;

    const values: any[] = await c.connection.query('SELECT * FROM identroll;');
    expect(values).to.have.length(1);
    expect(values[0]).to.deep.eq({
      identnr: 91234,
      rolle: 'B',
      verbindung_integer: 1234,
      verbindung_char: null,
      anschrkz: null
    });

  }


  /**
   * Multi save join references with an referring value
   */
  @test
  async 'save multiple E-P-O entries'() {
    let candidates = [];
    for (let i = 0; i < 4; i++) {
      const identity = new Identity();
      identity.identnr = 90000 + i;
      identity.name = 'Siegfried ' + i;

      const candidate = new Candidate();
      candidate.bewnr = 1000 + i;
      candidate.nachname = 'Siegfried ' + i;
      candidate.identity = identity;
      candidates.push(candidate);

    }


    await entityController.save(candidates);
    const values: any[] = await c.connection.query('SELECT * FROM identroll;');
    expect(values).to.have.length(4);
    expect(values).to.deep.eq([
      {
        'anschrkz': null,
        'identnr': 90000,
        'rolle': 'B',
        'verbindung_char': null,
        'verbindung_integer': 1000
      },
      {
        'anschrkz': null,
        'identnr': 90001,
        'rolle': 'B',
        'verbindung_char': null,
        'verbindung_integer': 1001
      },
      {
        'anschrkz': null,
        'identnr': 90002,
        'rolle': 'B',
        'verbindung_char': null,
        'verbindung_integer': 1002
      },
      {
        'anschrkz': null,
        'identnr': 90003,
        'rolle': 'B',
        'verbindung_char': null,
        'verbindung_integer': 1003
      }
    ]);


    candidates = await entityController.find(Candidate) as any[];
    expect(candidates).to.have.length(4);
    expect(candidates.map(x => [x.bewnr, x.identity.identnr])).to.deep.eq([
      [
        1000,
        90000
      ],
      [
        1001,
        90001
      ],
      [
        1002,
        90002
      ],
      [
        1003,
        90003
      ]
    ]);


  }


  /**
   * Multi save join references with an referring value
   */
  @test
  async 'save multiple E-P-O entries where some refs are missing'() {
    let candidates = [];
    let _switch = false;
    for (let i = 0; i < 4; i++) {
      const candidate = new Candidate();
      candidate.bewnr = 1000 + i;
      candidate.nachname = 'Siegfried ' + i;
      let identity = null;
      if (i % 2 === 0) {
        identity = new Identity();
        identity.identnr = 90000 + i;
        identity.name = 'Siegfried ' + i;
        candidate.identity = identity;
      } else {
        if (_switch) {
          _switch = true;
          candidate.identity = null;
        } else {
          // identity is undefined!
        }
      }
      candidates.push(candidate);
    }


    candidates = await entityController.save(candidates);

    const values: any[] = await c.connection.query('SELECT * FROM identroll;');
    expect(values).to.have.length(2);
    expect(values).to.deep.eq([
      {
        'anschrkz': null,
        'identnr': 90000,
        'rolle': 'B',
        'verbindung_char': null,
        'verbindung_integer': 1000
      },

      {
        'anschrkz': null,
        'identnr': 90002,
        'rolle': 'B',
        'verbindung_char': null,
        'verbindung_integer': 1002
      }
    ]);

    candidates = await entityController.find(Candidate) as any[];
    expect(candidates).to.have.length(4);
    expect(candidates.map(x => [x.bewnr, _.get(x, 'identity.identnr', undefined)])).to.deep.eq([
      [
        1000,
        90000
      ],
      [
        1001,
        undefined
      ],
      [
        1002,
        90002
      ],
      [
        1003,
        undefined
      ]
    ]);


  }

}

