import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {EntityRegistry} from "../../src";
import * as _ from "lodash";
import {TestHelper} from "./TestHelper";


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


}

