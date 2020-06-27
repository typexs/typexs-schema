import {Bootstrap, Injector} from '@typexs/base';
import {K_ROUTE_CONTROLLER, Server} from '@typexs/server';
import * as _ from 'lodash';

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


(async function () {
  let bootstrap: Bootstrap = null;
  let server: Server = null;
  const settings = _.clone(settingsTemplate);


  bootstrap = Bootstrap
    .setConfigSources([{type: 'system'}])
    .configure(settings)
    .activateErrorHandling()
    .activateLogger();

  await bootstrap.prepareRuntime();
  await bootstrap.activateStorage();
  await bootstrap.startup();

  server = Injector.get('server.default');
  await server.start();

})();
