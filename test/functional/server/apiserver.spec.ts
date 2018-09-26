import {suite, test, timeout} from "mocha-typescript";
import {Bootstrap, Container} from "typexs-base";
import {K_ROUTE_CONTROLLER, Server, ServerRegistry} from "typexs-server";
import * as _ from "lodash";
import * as request from 'request-promise-native';
import {expect} from 'chai';
import {TestHelper} from "../TestHelper";
import {EntityRegistry} from "../../../src";

const settingsTemplate: any = {
  storage: {
    default: {
      synchronize: true,
      type: 'sqlite',
      database: ':memory:',
      logging:'all',
      logger:'simple-console'
    },
    literature: {
      synchronize: true,
      type: 'sqlite',
      database: ':memory:',
      logging:'all',
      logger:'simple-console'
    }
  },

  app: {name: 'demo', path: __dirname + '/../../..'},

  modules: {
    paths: [
      __dirname + '/packages'
    ],
  },


  logging: {
    enable: true,
    level: 'debug',
    transports: [{console: {}}],
  },


  server: {
    default: {
      type: 'web',
      framework: 'express',
      host: 'localhost',
      port: 4500,

      routes: [{
        type: K_ROUTE_CONTROLLER,
        context: 'api',
        routePrefix: 'api'
      }]
    }
  }

}

let bootstrap: Bootstrap = null;
let server: Server = null;

@suite('functional/server/apiserver')
class ApiserverSpec {



  static async before() {
    TestHelper.resetTypeorm();
    let settings = _.clone(settingsTemplate);


    bootstrap = Bootstrap
      .setConfigSources([{type: 'system'}])
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
    await server.stop();
    Bootstrap.reset();

  }

  @test @timeout(300000)
  async 'create simple entity'() {

    let data = {
      label: 'Prinz',
      content: 'Der kleine Prinz'
    }

    const url = server.url();

    let res = await request.post(url + '/api/entity/book3', {json: data});
    expect(res).to.deep.include({id: 1});

    res = await request.get(url + `/api/entity/book3/${res.id}`, {json: true});
    expect(res).to.deep.include({id: 1});
    expect(res).to.deep.include(data);

    let arrData = [
      {
        label: 'Bilanzierung',
        content: 'Kostenrechnung und Bilanzierung'
      },
      {
        label: 'Odyssee',
        content: 'Homers Odyssee'
      }
    ];

    res = await request.post(url + '/api/entity/book3', {json: arrData});
    expect(_.map(res, r => r.id)).to.deep.eq([2, 3]);

    res = await request.get(url + `/api/entity/book3/1,2,3`, {json: true});
    expect(_.map(res, r => r.id)).to.deep.eq([1, 2, 3]);

  }


}

