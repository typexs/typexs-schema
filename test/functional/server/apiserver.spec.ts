import {suite, test, timeout} from "mocha-typescript";
import {Bootstrap, Container} from "@typexs/base";
import {K_ROUTE_CONTROLLER, Server} from "@typexs/server";
import * as _ from "lodash";
import * as request from 'request-promise-native';
import {expect} from 'chai';
import {TestHelper} from "../TestHelper";

const settingsTemplate: any = {
  storage: {
    default: {
      synchronize: true,
      type: 'sqlite',
      database: ':memory:',
      logging: 'all',
      logger: 'simple-console'
    },
    literature: {
      synchronize: true,
      type: 'sqlite',
      database: ':memory:',
      logging: 'all',
      logger: 'simple-console'
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
      port: 4512,

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
@timeout(30000)
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
  async 'create and retrieve entities'() {

    let data = {
      label: 'Prinz',
      content: 'Der kleine Prinz'
    }

    const url = server.url();

    let res = await request.post(url + '/api/entity/book3', {json: data});
    expect(res).to.deep.include({id: 1});

    res = await request.get(url + `/api/entity/book3/${res.id}`, {json: true});
    expect(res).to.deep.include({id: 1});
    expect(res).to.deep.include({$url: 'api/entity/book_3/1'});
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
    expect(res['$count']).to.eq(3);
    expect(_.map(res.entities, r => r.id)).to.deep.eq([1, 2, 3]);

    res = await request.get(url + `/api/entity/book3?query=${JSON.stringify({id: 1})}`, {json: true});
    expect(res['$count']).to.eq(1);
    expect(_.map(res.entities, r => r.id)).to.deep.eq([1]);

    res = await request.get(url + `/api/entity/book_3?query=${JSON.stringify({label: {$like: 'Odyssee'}})}`, {json: true});
    expect(res['$count']).to.eq(1);
    expect(_.map(res.entities, r => r.id)).to.deep.eq([3]);

    res = await request.get(url + `/api/entity/book_3?sort=${JSON.stringify({id: 'desc'})}&limit=2`, {json: true});
    expect(res['$count']).to.eq(3);
    expect(res['$limit']).to.eq(2);
    expect(_.map(res.entities, r => r.id)).to.deep.eq([3, 2]);

    res = await request.get(url + `/api/entity/book_3?sort=${JSON.stringify({id: 'desc'})}&limit=2&offset=1`, {json: true});
    expect(res['$count']).to.eq(3);
    expect(res['$limit']).to.eq(2);
    expect(res['$offset']).to.eq(1);
    expect(res.entities).to.have.length(2);
    expect(_.map(res.entities, r => r.id)).to.deep.eq([2, 1]);
  }

  @test @timeout(300000)
  async 'create and retrieve entities with reference'() {

    const url = server.url();
    let person = {
      firstName: 'Prinz',
      lastName: 'Heinz'
    }
    let res = await request.post(url + '/api/entity/personnn', {json: person});
    expect(res).to.deep.include({id: 1});


    let data = {
      title: 'Prinz',
      author: {id: 1}
    }

    res = await request.post(url + '/api/entity/bookkk', {json: data});
    expect(res).to.deep.include({id: 1});
  }
}

