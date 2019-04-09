import {EntityAPIController} from "../../src/controllers/EntityAPIController";
//process.env['SQL_LOG'] = 'X';
import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import * as _ from 'lodash';

import {Container, IRuntimeLoaderOptions, TypeOrmEntityRegistry} from '@typexs/base';
import {Bootstrap} from '@typexs/base/Bootstrap';

import {TestHelper} from "./TestHelper";

import {K_ROUTE_CONTROLLER, Server} from "@typexs/server";
import {Permission} from "./schemas/role_permissions/Permission";
import {Role} from "./schemas/role_permissions/Role";
import {RBelongsTo2} from "./schemas/role_permissions/RBelongsTo2";
import {TEST_STORAGE_OPTIONS} from "./config";


const settingsTemplate: any = {
  storage: {
    default: TEST_STORAGE_OPTIONS,
    role_permissions: {
      synchronize: true,
      type: 'sqlite',
      database: ':memory:',
      logging: 'all',
      logger: 'simple-console'
    }
  },

  app: {name: 'demo', path: __dirname + '/../..'},

  modules: <IRuntimeLoaderOptions>{
    paths: [
      // __dirname + '/packages'
    ],

    libs: [{
      topic: 'entities.role_permissions',
      refs: [__dirname + '/schema/role_permissions']
    }]
  },


  logging: {
    enable: true,
    level: 'debug',
    transports: [{console: {name: 'sql_schema_predefined_join_bidirect_over_api'}}],
  },


  server: {
    default: {
      type: 'web',
      framework: 'express',
      host: 'localhost',
      port: 4512,

      routes: [{
        type: K_ROUTE_CONTROLLER,
        context: 'api',
        routePrefix: 'api'
      }]
    }
  }

};

let bootstrap: Bootstrap = null;
let server: Server = null;


@suite('functional/sql_schema_predefined_join_bidirect_over_api')
class Sql_schema_predefined_join_bidirect_over_apiSpec {


  static async before() {
    TestHelper.resetTypeorm();
    let settings = _.clone(settingsTemplate);
    Bootstrap.reset();

    bootstrap = Bootstrap.setConfigSources([{type: 'system'}])
      .configure(settings)
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();

    server = Container.get('server.default');
    await server.start();
  }

  static async after() {
    if (server) {
      await server.stop();
    }
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Bootstrap.reset();

  }


  @test
  async 'update E-P-E[] over predefined join tables with api'() {


    let perm01 = new Permission();
    perm01.type = 'single';
    perm01.module = 'duo';
    perm01.disabled = false;
    perm01.permission = 'allow everything';

    let perm02 = new Permission();
    perm02.type = 'single';
    perm02.module = 'duo';
    perm02.disabled = false;
    perm02.permission = 'allow everything else';

    let perm03 = new Permission();
    perm03.type = 'single';
    perm03.module = 'duo';
    perm03.disabled = false;
    perm03.permission = 'allow everything but this';

    let api = Container.get(EntityAPIController);
    let role = new Role();
    role.displayName = 'User';
    role.permissions = [perm01, perm02];
    role.rolename = 'user';
    role.disabled = false;

    let results = await api.save('role', JSON.parse(JSON.stringify(role)), null);
    expect(results.$state).to.exist;
    expect(results.$state.isValidated).to.be.true;
    expect(results.$state.isSuccessValidated).to.be.true;
    expect(results.permissions).to.have.length(2);

    // save again
    role = results;
    results = await api.save('role', JSON.parse(JSON.stringify(role)), null);
    expect(results.$state).to.exist;
    expect(results.$state.isValidated).to.be.true;
    expect(results.$state.isSuccessValidated).to.be.true;
    expect(results.permissions).to.have.length(2);

    role = results;
    role.permissions.push(perm03);
    results = await api.save('role', JSON.parse(JSON.stringify(role)), null);
    expect(results.$state).to.exist;
    expect(results.$state.isValidated).to.be.true;
    expect(results.$state.isSuccessValidated).to.be.true;
    expect(results.permissions).to.have.length(3);


  }


  @test
  async 'metadata for overlapping entity check'() {

    let entity = TypeOrmEntityRegistry.$().getEntityRefFor("RBelongsTo2");
    let props = entity.getPropertyRefs();
    expect(props).to.have.length(7);

  }
}
