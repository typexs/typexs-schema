import {suite, test, timeout} from "mocha-typescript";
import {Bootstrap, Container} from "@typexs/base";
import {K_ROUTE_CONTROLLER, Server, ServerRegistry} from "@typexs/server";
import * as _ from "lodash";
import * as request from 'request-promise-native';
import {expect} from 'chai';

const settingsTemplate: any = {
  storage: {
    default: {
      synchronize: true,
      type: 'sqlite',
      database: ':memory:'
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

};


(async function(){
  let bootstrap: Bootstrap = null;
  let server: Server = null;
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

})();
