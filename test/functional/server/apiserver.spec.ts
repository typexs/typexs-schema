import * as path from 'path'
import {suite, test, timeout} from "mocha-typescript";
import {Bootstrap, Container, RuntimeLoader} from "typexs-base";
import {expect} from "chai";
import {C_DEFAULT, K_ROUTE_CONTROLLER, ServerRegistry, WebServer} from "typexs-server";
import * as _ from "lodash";


const settingsTemplate: any = {
  storage: {
    default: {
      synchronize: true,
      type: 'sqlite',
      database: ':memory:'
    }
  },

  app: {name: 'demo', path: __dirname + '/../../..'},

  paths:[__dirname],

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
  },

  //paths: [path.resolve(__dirname + '/../../..')]

}

let bootstrap: Bootstrap = null;

@suite('functional/server/apiserver')
class ApiserverSpec {


  before() {
  }

  after() {
    Bootstrap.reset();

  }

  @test @timeout(300000)
  async 'start'() {
    let settings = _.clone(settingsTemplate);
    console.log(settings)
    bootstrap = Bootstrap
      .setConfigSources([{type: 'system'}])
      .configure(settings)
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();

    const serverRegistry:ServerRegistry = Bootstrap.getContainer().get('ServerRegistry');
    const server = serverRegistry.get('default');
    await server.start();
  }


}

