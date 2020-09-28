import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import {EntityRegistry} from '../../src/libs/EntityRegistry';


@suite('functional/entity_from_json')
class EntitiesFromJsonSpec {


  @test
  async 'register entity by json'() {
    const d: any = {
      'id': 'default--personal',
      'name': 'Personal',
      'type': 'entity',
      'machineName': 'personal',
      'options': {
        'storeable': true
      },
      'schema': 'default',
      'properties': [
        {
          'cardinality': 1,
          'id': 'default--personal--id',
          'name': 'id',
          'type': 'property',
          'label': 'Id',
          'machineName': 'id',
          'options': {
            'type': 'number',
            'form': 'hidden',
            'auto': true,
            'propertyName': 'id'
          },
          'schema': 'default',
          'entityName': 'Personal',
          'dataType': 'number',
          'generated': true,
          'identifier': true,

        },
        {
          'cardinality': 1,
          'id': 'default--personal--firstname',
          'name': 'firstName',
          'type': 'property',
          'label': 'Firstname',
          'machineName': 'first_name',
          'options': {
            'type': 'string',
            'form': 'text',

            'propertyName': 'firstName'
          },
          'schema': 'default',
          'entityName': 'Personal',

          'dataType': 'string',
          'generated': false,
          'identifier': false,
          validator: [
            {
              'type': 'isDefined',
              'target': 'Personal',
              'propertyName': 'firstName',
              'validationOptions': {
                'groups': [],
                'always': false,
                'each': false
              },
            }
          ]
        },
        {
          'cardinality': 1,
          'id': 'default--personal--lastname',
          'name': 'lastName',
          'type': 'property',
          'label': 'Lastname',
          'machineName': 'last_name',
          'options': {
            'type': 'string',
            'form': 'text',

            'propertyName': 'lastName'
          },
          'schema': 'default',
          'entityName': 'Personal',

          'dataType': 'string',
          'generated': false,
          'identifier': false
        }
      ]
    };


    const entityDef = EntityRegistry.fromJson(d);
    const regEntityDef = EntityRegistry.getEntityRefFor('Personal');
    expect(entityDef).to.be.eq(regEntityDef);

    const output = JSON.parse(JSON.stringify(entityDef.toJson()));
    expect(output).to.deep.eq(d);
  }


  @test
  async 'register entity with references by json'() {
    require('./schemas/default/Author');


    const d: any = {
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


    const entityDef = EntityRegistry.fromJson(d);
    const regEntityDef = EntityRegistry.getEntityRefFor('Bookk');
    expect(entityDef).to.be.eq(regEntityDef);

    const authorProp = entityDef.getPropertyRefs().find((p) => p.name === 'author');
    expect(authorProp.isReference()).to.be.true;


  }


}

