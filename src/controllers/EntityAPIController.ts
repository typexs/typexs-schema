import {Body, Delete, Get, JsonController, Param, Post} from "routing-controllers";

import {Inject, NotYetImplementedError} from "typexs-base";
import {ContextGroup, Credentials} from "typexs-server";
import {EntityDef, EntityRegistry} from "..";
import {EntityControllerFactory} from "../libs/EntityControllerFactory";
import {EntityController} from "../libs/EntityController";
import * as _ from "lodash";


@ContextGroup('api')
@JsonController()
export class EntityAPIController {


  @Inject('EntityRegistry')
  registry: EntityRegistry;

  @Inject('EntityControllerFactory')
  factory: EntityControllerFactory;

  /**
   * Return list of schemas with their entities
   */
  // @Authorized('read metadata schema')
  // - Check if user has an explicit credential to access the method
  @Credentials('allow access metadata')
  @Get('/metadata/schemas')
  async schemas(): Promise<any> {
    return this.registry.listSchemas().map(x => x.toJson(true, false));
  }

  /**
   * Return list of entity
   */
  @Credentials('allow access metadata')
  @Get('/metadata/schema/:schemaName')
  async schema(@Param('schemaName') schemaName: string) {
    let schema = this.registry.getSchemaDefByName(schemaName);
    if (schema) {
      return schema.toJson();
    } else {
      throw new Error('no schema ' + schemaName + ' found');
    }
  }


  /**
   * Return list of defined entities
   */
  @Credentials('allow access metadata')
  @Get('/metadata/entities')
  async entities() {
    return this.registry.listEntities().map(x => x.toJson());
  }



  /**
   * Return list of defined entities
   */
  @Credentials('allow access metadata')
  @Get('/metadata/entity/:entityName')
  async entity(@Param('entityName') entityName: string) {
    let entity = this.registry.getEntityDefByName(entityName);
    if (entity) {
      let json = entity.toJson();
      json.properties = entity.getPropertyDefs().map(x => x.toJson());
      return json;
    } else {
      throw new Error('no entity found for ' + entityName);
    }
  }


  /**
   * Return list of defined entities
   */
  @Credentials('allow access metadata')
  @Post('/metadata/entity')
  async entityCreate(@Body() data:any) {
    throw new NotYetImplementedError()
  }


  /**
   * Return a single Entity
   */
  @Credentials(['allow access entity :name', 'allow access entity'])
  @Get('/entity/:name/:id')
  async get(@Param('name') name: string, @Param('id') id: string) {
    const entityDef = this.getEntityDef(name);
    const conditions = entityDef.createLookupConditions(id);
    if (_.isArray(conditions)) {
      return this.getController(entityDef.schemaName).find(entityDef.name, conditions);
    } else {
      return this.getController(entityDef.schemaName).find(entityDef.name, conditions, 1).then(x => x.shift());
    }
  }


  /**
   * Return a new created Entity
   */
  @Credentials(['allow create entity :name', 'allow create entity'])
  @Post('/entity/:name')
  async create(@Param('name') name: string, @Body() data: any): Promise<any> {
    const entityDef = this.getEntityDef(name);
    if (_.isArray(data)) {
      let entities = _.map(data, d => entityDef.build(d));
      return this.getController(entityDef.schemaName).save(entities);
    } else {
      let entity = entityDef.build(data);
      return this.getController(entityDef.schemaName).save(entity);
    }
  }


  /**
   * Return a updated Entity
   */
  @Credentials(['allow update entity :name', 'allow update entity'])
  @Post('/entity/:name/:id')
  update() {
    throw new NotYetImplementedError()
  }


  /**
   * Return a deleted Entity
   */
  @Credentials(['allow delete entity :name', 'allow delete entity'])
  @Delete('/entity/:name/:id')
  delete() {
    throw new NotYetImplementedError()
  }


  private getController(schemaName: string): EntityController {
    const controller = this.factory.get(schemaName);
    if (controller) {
      return controller;
    }
    throw new Error('no controller defined for ' + name);
  }

  private getEntityDef(entityName: string): EntityDef {
    const entityDef = this.registry.getEntityDefByName(entityName);
    if (entityDef) {
      return entityDef;
    }
    throw new Error('no entity definition found  for ' + entityName);
  }

}



