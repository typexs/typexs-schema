import '../../src/libs/decorators/register';
import {suite, test} from '@testdeck/mocha';
import * as _ from 'lodash';
import {EntityRegistry} from '../../src/libs/EntityRegistry';
import {RegistryFactory} from '@allgemein/schema-api';
import {NAMESPACE_BUILT_ENTITY} from '../../src/libs/Constants';
import {Injector, Invoker} from '@typexs/base';
import {expect} from 'chai';
import {Car} from './schemas/direct_property/Car';
import {EntityRef} from '../../src';

let registry: EntityRegistry;

@suite('functional/entity_registry - json schema support')
class EntityRegistryJsonSchemaSpec {

  static before() {
    RegistryFactory.register(NAMESPACE_BUILT_ENTITY, EntityRegistry);
    RegistryFactory.register(new RegExp('^' + NAMESPACE_BUILT_ENTITY + '\..*'), EntityRegistry);
    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY) as EntityRegistry;

    const invoker = new Invoker();
    Injector.set(Invoker.NAME, invoker);
  }

  before() {
  }


  after() {
    RegistryFactory.remove(NAMESPACE_BUILT_ENTITY);
  }


  @test
  async 'generate json schema and replay it after class changes back'() {
    const regEntityDef = registry.getEntityRefFor(Car);
    expect(regEntityDef.getPropertyRefs()).to.have.length(4);
    const data = regEntityDef.toJsonSchema();
    const data_x = JSON.parse(JSON.stringify(data));
    // console.log(inspect(data_x, false, 10));
    expect(data_x).to.deep.eq({
      '$schema': 'http://json-schema.org/draft-07/schema#',
      definitions: {
        Car: {
          title: 'Car',
          type: 'object',
          '$id': '#Car',
          storable: true,
          schema: ['direct_property'],
          properties: {
            id: {
              type: 'number',
              auto: true,
              identifier: true,
              generated: true
            },
            producer: {type: 'string'},
            driver: {'$ref': '#/definitions/Driver', nullable: true},
            drivers: {
              type: 'array',
              items: {'$ref': '#/definitions/Driver'},
              nullable: true,
              cardinality: 0
            }
          }
        },
        Driver: {
          title: 'Driver',
          type: 'object',
          properties: {
            age: {type: 'number'},
            nickName: {type: 'string'},
            skill: {'$ref': '#/definitions/Skil'}
          }
        },
        Skil: {
          title: 'Skil',
          type: 'object',
          '$id': '#Skil',
          storable: true,
          schema: ['direct_property'],
          properties: {
            id: {
              type: 'number',
              auto: true,
              identifier: true,
              generated: true
            },
            label: {type: 'string'},
            quality: {type: 'number'}
          }
        }
      },
      '$ref': '#/definitions/Car'
    });

    data_x.definitions['Car2'] = _.cloneDeep(data_x.definitions['Car']);
    delete data_x.definitions['Car'];
    data_x.definitions['Car2'].title = 'Car2';
    data_x.definitions['Car2'].$id = '#Car2';
    data_x.$ref = '#/definitions/Car2';

    const entityDef2 = await registry.fromJsonSchema(_.cloneDeep(data_x)) as EntityRef;
    expect(entityDef2.getPropertyRefs()).to.have.length(4);
    let data2 = entityDef2.toJsonSchema();
    data2 = JSON.parse(JSON.stringify(data2));

    expect(data2).to.deep.eq(data_x);
  }


}

