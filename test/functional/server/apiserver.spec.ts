import {suite, test, timeout} from '@testdeck/mocha';
import {Bootstrap, Injector, XS_P_$COUNT, XS_P_$LIMIT, XS_P_$OFFSET} from '@typexs/base';
import {K_ROUTE_CONTROLLER, Server, XS_P_$URL} from '@typexs/server';
import * as _ from 'lodash';
import {expect} from 'chai';
import {TestHelper} from '../TestHelper';
import {TEST_STORAGE_OPTIONS} from '../config';
import {HttpFactory, IHttp} from '@allgemein/http';
import {API_CTRL_ENTITY_FIND_ENTITY, API_CTRL_ENTITY_GET_ENTITY, API_CTRL_ENTITY_SAVE_ENTITY} from '../../../src/libs/Constants';

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
    Bootstrap.reset();
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

    server = Injector.get('server.default');
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

    const saveUrl = url + '/api' + API_CTRL_ENTITY_SAVE_ENTITY.replace(':name', 'book3');
    let res: any = await http.post(saveUrl, {
      json: data,
      responseType: 'json',
      passBody: true
    });
    expect(res).to.deep.include({id: 1});

    const getUrl = url + '/api' + API_CTRL_ENTITY_GET_ENTITY.replace(':name', 'book3').replace(':id', '1');
    res = await http.get(getUrl, {responseType: 'json', passBody: true});
    expect(res).to.deep.include({id: 1});
    const x = {};
    x[XS_P_$URL] = 'api/entity/book_3/1';

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

    res = await http.post(saveUrl, {json: arrData, responseType: 'json', passBody: true});
    expect(_.map(res, r => r.id)).to.deep.eq([2, 3]);

    res = await http.get(url + '/api' + API_CTRL_ENTITY_GET_ENTITY.replace(':name', 'book3').replace(':id', `1,2,3`), {
      responseType: 'json',
      passBody: true
    });
    expect(res[XS_P_$COUNT]).to.eq(3);
    expect(_.map(res.entities, r => r.id)).to.deep.eq([1, 2, 3]);

    res = await http.get(url + '/api' + API_CTRL_ENTITY_FIND_ENTITY.replace(':name', 'book3')
      + `?query=${JSON.stringify({id: 1})}`, {responseType: 'json', passBody: true});
    expect(res[XS_P_$COUNT]).to.eq(1);
    expect(_.map(res.entities, r => r.id)).to.deep.eq([1]);

    res = await http.get(url + '/api' + API_CTRL_ENTITY_FIND_ENTITY.replace(':name', 'book3') +
      `?query=${JSON.stringify({label: {$like: 'Odyssee'}})}`, {
      responseType: 'json',
      passBody: true
    });
    expect(res[XS_P_$COUNT]).to.eq(1);
    expect(_.map(res.entities, r => r.id)).to.deep.eq([3]);

    res = await http.get(url + '/api' + API_CTRL_ENTITY_FIND_ENTITY.replace(':name', 'book3') +
      `?sort=${JSON.stringify({id: 'desc'})}&limit=2`, {
      responseType: 'json',
      passBody: true
    });
    expect(res[XS_P_$COUNT]).to.eq(3);
    expect(res[XS_P_$LIMIT]).to.eq(2);
    expect(_.map(res.entities, r => r.id)).to.deep.eq([3, 2]);

    res = await http.get(url + '/api' + API_CTRL_ENTITY_FIND_ENTITY.replace(':name', 'book3') +
      `?sort=${JSON.stringify({id: 'desc'})}&limit=2&offset=1`, {
      responseType: 'json',
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
    let res = await http.post(url + '/api' + API_CTRL_ENTITY_SAVE_ENTITY.replace(':name', 'personnn'), {
      json: person,
      responseType: 'json',
      passBody: true
    });
    expect(res).to.deep.include({id: 1});


    const data = {
      title: 'Prinz',
      author: {id: 1}
    };

    // tslint:disable-next-line:max-line-length
    res = await http.post(url + '/api' + API_CTRL_ENTITY_SAVE_ENTITY.replace(':name', 'bookkk'),
      {json: data, responseType: 'json', passBody: true});
    expect(res).to.deep.include({id: 1});
  }
}

