import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {EntityRegistry} from "../../src";
import * as _ from "lodash";
import {TestHelper} from "./TestHelper";
import {inspect} from "util";


@suite('functional/entity_to_json')
class Entities_to_jsonSpec {


  @test
  async 'with entity reference'() {

    const Book = require('./schemas/default/Book');
    let regEntityDef = EntityRegistry.getEntityDefFor("Book");
    let data = regEntityDef.toJson();
    expect(data.properties).to.have.length(4);
    expect(data.properties[3].targetRef).to.deep.eq({
      schema: 'default',
      className: 'Author',
      isEntity: true,
      options: {}
    });

  }

  @test
  async 'with classref reference'() {

    require('./schemas/direct_property/Car');
    let regEntityDef = EntityRegistry.getEntityDefFor("Car");
    let data = regEntityDef.toJson();
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
            sourceClass: {},
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
                sourceClass: {},
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
                sourceClass: {}
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

