import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {EntityRegistry} from "../../src";
import * as _ from "lodash";
import {TestHelper} from "./TestHelper";
import {inspect} from "util";


@suite('functional/entity_from_json')
class Entities_from_jsonSpec {


  @test
  async 'register entity by json'() {
    let d: any =
      {
        "id": "default--personal",
        "name": "Personal",
        "type": "entity",
        "machineName": "personal",
        "options": {
          "storeable": true
        },
        "schema": "default",
        "properties": [
          {
            "cardinality": 1,
            "id": "default--personal--id",
            "name": "id",
            "type": "property",
            "machineName": "id",
            "options": {
              "type": "number",
              "form": "hidden",
              "auto": true,
              "sourceClass": {},
              "propertyName": "id"
            },
            "schema": "default",
            "entityName": "Personal",
            "label": "Id",
            "dataType": "number",
            "generated": true,
            "identifier": true
          },
          {
            "cardinality": 1,
            "id": "default--personal--firstname",
            "name": "firstName",
            "type": "property",
            "machineName": "first_name",
            "options": {
              "type": "string",
              "form": "text",
              "sourceClass": {},
              "propertyName": "firstName"
            },
            "schema": "default",
            "entityName": "Personal",
            "label": "Firstname",
            "dataType": "string",
            "generated": false,
            "identifier": false
          },
          {
            "cardinality": 1,
            "id": "default--personal--lastname",
            "name": "lastName",
            "type": "property",
            "machineName": "last_name",
            "options": {
              "type": "string",
              "form": "text",
              "sourceClass": {},
              "propertyName": "lastName"
            },
            "schema": "default",
            "entityName": "Personal",
            "label": "Lastname",
            "dataType": "string",
            "generated": false,
            "identifier": false
          }
        ]
      };


    let entityDef = EntityRegistry.fromJson(d);
    let regEntityDef = EntityRegistry.getEntityDefFor("Personal");
    expect(entityDef).to.be.eq(regEntityDef);

    let output = entityDef.toJson();
    expect(output).to.deep.eq(d);
  }


  @test
  async 'register entity with references by json'() {
    require('./schemas/default/Author')


    let d:any = {
      id: 'default--bookk',
      name: 'Bookk',
      type: 'entity',
      machineName: 'bookk',
      options: {storeable: true},
      schema: 'default',
      properties:
        [{
          id: 'default--bookk--id',
          name: 'id',
          type: 'property',
          machineName: 'id',
          options:
            {
              type: 'number',
              auto: true,
              sourceClass: {},
              propertyName: 'id'
            },
          schema: 'default',
          entityName: 'Bookk',
          label: 'Id',
          dataType: 'number',
          generated: true,
          identifier: true,
          cardinality: 1
        },
          {
            id: 'default--bookk--label',
            name: 'label',
            type: 'property',
            machineName: 'label',
            options:
              {
                type: 'string',
                nullable: true,
                sourceClass: {},
                propertyName: 'label'
              },
            schema: 'default',
            entityName: 'Bookk',
            label: 'Label',
            dataType: 'string',
            generated: false,
            identifier: false,
            cardinality: 1
          },
          {
            id: 'default--bookk--content',
            name: 'content',
            type: 'property',
            machineName: 'content',
            options:
              {
                type: 'string',
                nullable: true,
                sourceClass: {},
                propertyName: 'content'
              },
            schema: 'default',
            entityName: 'Bookk',
            label: 'Content',
            dataType: 'string',
            generated: false,
            identifier: false,
            cardinality: 1
          },
          {
            id: 'default--bookk--author',
            name: 'author',
            type: 'property',
            machineName: 'author',
            options:
              {
                nullable: true,
                sourceClass: {},
                propertyName: 'author'
              },
            schema: 'default',
            entityName: 'Bookk',
            label: 'Author',
            generated: false,
            identifier: false,
            cardinality: 1,
            targetRef:
              {
                schema: 'default',
                className: 'Author',
                isEntity: true,
                options: {}
              },
            embedded: []
          }]
    };


    let entityDef = EntityRegistry.fromJson(d);
    let regEntityDef = EntityRegistry.getEntityDefFor("Bookk");
    expect(entityDef).to.be.eq(regEntityDef);

    let authorProp = entityDef.getPropertyDefs().find((p) => p.name == 'author');
    expect(authorProp.isReference()).to.be.true;


  }


}

