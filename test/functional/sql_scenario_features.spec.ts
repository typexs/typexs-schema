import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import {TestHelper} from './TestHelper';
import * as _ from 'lodash';
import {TEST_STORAGE_OPTIONS} from './config';
import {TypeOrmConnectionWrapper} from '@typexs/base';
import {TypeOrmEntityRegistry} from '@typexs/base/browser';
import {RegistryFactory} from '../../../../node-commons/allgemein-schema-api/build/package';
import {NAMESPACE_BUILT_ENTITY} from '../../src/libs/Constants';
import {EntityRegistry} from '../../src/libs/EntityRegistry';

let registry: EntityRegistry;

@suite('functional/sql_scenario_features')
class SqlScenarioFeaturesSpec {


  static before() {
    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
  }

  static after() {
    RegistryFactory.reset();
  }


  before() {
    TypeOrmEntityRegistry.reset();
    TestHelper.resetTypeorm();
  }


  @test
  async 'entity lifecycle for scenario'() {


    const PathFeatureCollection = require('./schemas/features/PathFeatureCollection').PathFeatureCollection;
    const PathFeature = require('./schemas/features/PathFeature').PathFeature;
    const PointFeature = require('./schemas/features/PointFeature').PointFeature;
    const Speed = require('./schemas/features/Speed').Speed;

    // registry.reload();


    const options = _.clone(TEST_STORAGE_OPTIONS);
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect();

    const tables: any[] = await c.connection.query(
      'SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';'
    );
    expect(_.map(tables, t => t.name)).to.have.include.members([
      'path_feature_collection',
      'p_path_feature_collection_features'
    ]);


    let a = new PathFeatureCollection();
    a.features = [new PathFeature()];
    a.features[0].id = 1;
    a.features[0].datetime = '2018-09-16T00:00:00.000Z';
    a.features[0].unixtime = 15000000;
    a.features[0].altitude = 10;
    a.features[0].offset = 15;
    a.features[0].track = null;

    a.features[0].speed = new Speed();
    a.features[0].speed.value = 40;
    a.features[0].speed.unit = 'kmh';

    a.features[0].geometry = new PointFeature();
    a.features[0].geometry.latitude = 52.15;
    a.features[0].geometry.longitude = 13.15;

    a = await xsem.save(a, {validate: false});
    // console.log(inspect(a,false,10));

    const b = await xsem.find(PathFeatureCollection, {id: 1});
    // console.log(inspect(b,false,10));

    expect(b.shift()).to.deep.eq(a);

    await c.close();

  }


  @test
  async 'entity lifecycle for integrated property with multiple references'() {

    const Room = require('./schemas/integrated_property/Room').Room;
    const Equipment = require('./schemas/integrated_property/Equipment').Equipment;
    registry.reload([Room, Equipment]);

    const options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'integrated_property';
    const connect = await TestHelper.connect(options);
    const xsem = connect.controller;
    const ref = connect.ref;
    const c = await ref.connect() as TypeOrmConnectionWrapper;


    const tables: any[] = await c.connection.query(
      'SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';'
    );
    expect(_.map(tables, t => t.name)).to.have.include.members([
      'room', 'p_equipment'
    ]);

    let r = new Room();
    r.number = 123;
    r.equipment = [];

    let s = new Equipment();
    s.label = 'Seats';
    s.amount = 100;
    r.equipment.push(s);

    s = new Equipment();
    s.label = 'Beamer';
    s.amount = 2;
    r.equipment.push(s);

    r = await xsem.save(r, {validate: false});

    const data = await c.connection.query('select * from p_equipment');
    expect(data).to.have.length(2);

    const roomsIn = await xsem.find(Room, {id: 1});
    expect(roomsIn).to.have.length(1);

    const roomIn = roomsIn.shift();
    expect(roomIn).to.deep.eq(r);

    await c.close();

  }


  /**
   * TODO think over same properties for multiple entities which have different pk's
   */
}

