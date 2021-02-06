import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import {EntityRegistry} from '../../src/libs/EntityRegistry';


@suite('functional/entities_to_json')
class EntitiesToJsonSpec {


  @test
  async 'with entity reference'() {
    require('./schemas/default/Book');
    const regEntityDef = EntityRegistry.getEntityRefFor('Book');
    const data = regEntityDef.toJson();
    expect(data.properties).to.have.length(4);
    expect(data.properties[3].targetRef).to.deep.eq({
      schema: 'default',
      className: 'Author',
      isEntity: true,
      options: {}
    });
    expect(JSON.parse(JSON.stringify(data.properties[1].validator[0]))).to.deep.include({
      'type': 'isDefined',
      'target': 'Book',
      'propertyName': 'label',
      'validationOptions': {
        'groups': [],
        'each': false
      }
    });
  }


  @test
  async 'with classref reference'() {
    require('./schemas/direct_property/Car');
    const regEntityDef = EntityRegistry.getEntityRefFor('Car');
    const data = regEntityDef.toJson();
    // console.log(inspect(data, false, 10))
    expect(data.properties).to.have.length(4);
    expect(JSON.parse(JSON.stringify(data.properties[2].targetRef))).to.deep.eq({
      schema: 'direct_property',
      className: 'Driver',
      isEntity: false,
      options: {},
      properties:
        [{
          id: 'direct_property--driver--age',
          name: 'age',
          type: 'property',
          machineName: 'age',
          options: {
            type: 'number',

            propertyName: 'age'
          },
          schema: 'direct_property',
          entityName: 'Driver',
          label: 'Age',
          dataType: 'number',
          generated: false,
          identifier: false,
          cardinality: 1
        },
          {
            id: 'direct_property--driver--nickname',
            name: 'nickName',
            type: 'property',
            machineName: 'nick_name',
            options:
              {
                type: 'string',

                propertyName: 'nickName'
              },
            schema: 'direct_property',
            entityName: 'Driver',
            label: 'Nickname',
            dataType: 'string',
            generated: false,
            identifier: false,
            cardinality: 1
          },
          {
            id: 'direct_property--driver--skill',
            name: 'skill',
            type: 'property',
            machineName: 'skill',
            options:
              {
                propertyName: 'skill',

              },
            schema: 'direct_property',
            entityName: 'Driver',
            label: 'Skill',
            generated: false,
            identifier: false,
            cardinality: 1,
            targetRef:
              {
                schema: 'direct_property',
                className: 'Skil',
                isEntity: true,
                options: {}
              },
            embedded: []
          }]
    });
  }


}

