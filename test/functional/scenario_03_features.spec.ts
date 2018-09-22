import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {IStorageOptions, StorageRef} from 'typexs-base';
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import {EntityRegistry} from "../../src";
import {EntityController} from "../../src/libs/EntityController";
import {inspect} from "util";
import {TestHelper} from "./TestHelper";
import * as _ from "lodash";


export const TEST_STORAGE_OPTIONS: IStorageOptions = <SqliteConnectionOptions>{
  name: 'default',
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  //logger: 'simple-console',
  //logging: 'all'
  // tablesPrefix: ""

};


@suite('functional/scenario_03_features')
class Scenario_03_featuresSpec {





  @test
  async 'entity lifecycle for scenario'() {



    const PathFeatureCollection = require('./schemas/features/PathFeatureCollection').PathFeatureCollection;
    const PathFeature = require('./schemas/features/PathFeature').PathFeature;
    const PointFeature = require('./schemas/features/PointFeature').PointFeature;
    const Speed = require('./schemas/features/Speed').Speed;


    let options = _.clone(TEST_STORAGE_OPTIONS);
    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();



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

    a = await xsem.save(a);
    console.log(a);

    let b = await xsem.find(PathFeatureCollection,{id:1});
    console.log(inspect(b,false,10));

    expect(b.shift()).to.deep.eq(a);

    await c.close();

  }


  @test
  async 'entity lifecycle for integrated property with multiple references'() {

    const Room = require('./schemas/integrated_property/Room').Room;
    const Equipment = require('./schemas/integrated_property/Equipment').Equipment;

    let options = _.clone(TEST_STORAGE_OPTIONS);
    (<any>options).name = 'integrated_property';
    let connect = await TestHelper.connect(options);
    let xsem = connect.controller;
    let ref = connect.ref;
    let c = await ref.connect();

    let r = new Room();
    r.equipment = [];

    let s = new Equipment();
    s.label = 'Seats';
    s.amount = 100;
    r.equipment.push(s);

    s = new Equipment();
    s.label = 'Beamer';
    s.amount = 2;
    r.equipment.push(s);

    r = await xsem.save(r);

    let data = await c.connection.query('select * from p_equipment');
    expect(data).to.have.length(2);

    let roomsIn = await xsem.find(Room, {id: 1});
    expect(roomsIn).to.have.length(1);

    let roomIn = roomsIn.shift();
    expect(roomIn).to.deep.eq(r);

    await c.close();

  }


  /**
   * TODO think over same properties for multiple entities which have different pk's
   */
}

