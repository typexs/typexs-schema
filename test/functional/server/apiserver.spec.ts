import {suite, test, timeout} from 'mocha-typescript';
import {Bootstrap, Container, XS_P_$COUNT, XS_P_$LIMIT, XS_P_$OFFSET} from '@typexs/base';
import {K_ROUTE_CONTROLLER, Server} from '@typexs/server';
import * as _ from 'lodash';
import {expect} from 'chai';
import {TestHelper} from '../TestHelper';
import {TEST_STORAGE_OPTIONS} from '../config';
import {HttpFactory, IHttp} from 'commons-http';
import {XS_P_URL} from '../../../src';

const settingsTemplate: any = {
  storage: {
    default: TEST_STORAGE_OPTIONS,
    literature: {
      synchronize: true,
      type: 'sqlite',
      database: ':memory:',
      // logging: 'all',
      // logger: 'simple-console'
    }
  },

  app: {name: 'demo', path: __dirname + '/../../..'},

  modules: {
    paths: [
      __dirname + '/packages'
    ],
  },


  logging: {
    enable: false,
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

};

let bootstrap: Bootstrap = null;
let server: Server = null;
let http: IHttp = null;

@suite('functional/server/apiserver')
@timeout(30000)
class ApiserverSpec {


  static async before() {
    TestHelper.resetTypeorm();
    const settings = _.clone(settingsTemplate);
    http = await HttpFactory.create();
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
    await bootstrap.shutdown();
    Bootstrap.reset();

  }

  @test @timeout(300000)
  async 'create and retrieve entities'() {

    const data = {
      label: 'Prinz',
      content: 'Der kleine Prinz'
    };

    const url = server.url();

    let res: any = await http.post(url + '/api/entity/book3', {body: data, json: true, passBody: true});
    expect(res).to.deep.include({id: 1});
    res = await http.get(url + `/api/entity/book3/${res.id}`, {json: true, passBody: true});
    expect(res).to.deep.include({id: 1});
    const x = {};
    x[XS_P_URL] = 'api/entity/book_3/1';
    expect(res).to.deep.include(x);
    expect(res).to.deep.include(data);

    const arrData = [
      {
        label: 'Bilanzierung',
        content: 'Kostenrechnung und Bilanzierung'
      },
      {
        label: 'Odyssee',
        content: 'Homers Odyssee'
      }
    ];

    res = await http.post(url + '/api/entity/book3', {body: arrData, json: true, passBody: true});
    expect(_.map(res, r => r.id)).to.deep.eq([2, 3]);

    res = await http.get(url + `/api/entity/book3/1,2,3`, {json: true, passBody: true});
    expect(res[XS_P_$COUNT]).to.eq(3);
    expect(_.map(res.entities, r => r.id)).to.deep.eq([1, 2, 3]);

    res = await http.get(url + `/api/entity/book3?query=${JSON.stringify({id: 1})}`, {json: true, passBody: true});
    expect(res[XS_P_$COUNT]).to.eq(1);
    expect(_.map(res.entities, r => r.id)).to.deep.eq([1]);

    res = await http.get(url + `/api/entity/book_3?query=${JSON.stringify({label: {$like: 'Odyssee'}})}`, {
      json: true,
      passBody: true
    });
    expect(res[XS_P_$COUNT]).to.eq(1);
    expect(_.map(res.entities, r => r.id)).to.deep.eq([3]);

    res = await http.get(url + `/api/entity/book_3?sort=${JSON.stringify({id: 'desc'})}&limit=2`, {
      json: true,
      passBody: true
    });
    expect(res[XS_P_$COUNT]).to.eq(3);
    expect(res[XS_P_$LIMIT]).to.eq(2);
    expect(_.map(res.entities, r => r.id)).to.deep.eq([3, 2]);

    res = await http.get(url + `/api/entity/book_3?sort=${JSON.stringify({id: 'desc'})}&limit=2&offset=1`, {
      json: true,
      passBody: true
    });

    expect(res[XS_P_$COUNT]).to.eq(3);
    expect(res[XS_P_$LIMIT]).to.eq(2);
    expect(res[XS_P_$OFFSET]).to.eq(1);
    expect(res.entities).to.have.length(2);
    expect(_.map(res.entities, r => r.id)).to.deep.eq([2, 1]);
  }

  @test @timeout(300000)
  async 'create and retrieve entities with reference'() {

    const url = server.url();
    const person = {
      firstName: 'Prinz',
      lastName: 'Heinz'
    };
    let res = await http.post(url + '/api/entity/personnn', {body: person, json: true, passBody: true});
    expect(res).to.deep.include({id: 1});


    const data = {
      title: 'Prinz',
      author: {id: 1}
    };

    res = await http.post(url + '/api/entity/bookkk', {body: data, json: true, passBody: true});
    expect(res).to.deep.include({id: 1});
  }
}

