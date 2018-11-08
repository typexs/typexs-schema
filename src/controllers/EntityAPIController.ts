import {Body, Delete, Get, JsonController, Param, QueryParam, Post} from "routing-controllers";

import {Inject, NotYetImplementedError} from "typexs-base";
import {ContextGroup, Credentials} from "typexs-server";
import {EntityRegistry} from "../libs/EntityRegistry";
import {EntityDef} from "../libs/registry/EntityDef";
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
  async entityCreate(@Body() data: any) {
    throw new NotYetImplementedError()
  }


  /**
   * Run a query for entity
   */
  @Credentials(['allow access entity :name', 'allow access entity'])
  @Get('/entity/:name')
  async query(
    @Param('name') name: string,
    @QueryParam('query') query: string,
    @QueryParam('sort') sort: string,
    @QueryParam('limit') limit: number = 50,
    @QueryParam('offset') offset: number = 0,
  ) {
    const [entityDef, controller] = this.getControllerForEntityName(name);

    let conditions = null;
    if (query) {
      conditions = JSON.parse(query);
      if (!_.isPlainObject(conditions)) {
        throw new Error('conditions are wrong ' + query);
      }
    }
    let sortBy = null;
    if (sort) {
      sortBy = JSON.parse(sort);
      if (!_.isPlainObject(sortBy)) {
        throw new Error('sort by is wrong ' + sort);
      }
    }

    if (!_.isNumber(limit)) {
      limit = 50;
    }

    if (!_.isNumber(offset)) {
      offset = 0;
    }

    let result = await controller.find(entityDef.getClass(), conditions, {
      limit: limit,
      offset: offset,
      sort: sortBy,
      hooks: {afterEntity: EntityAPIController._afterEntity}
    });

    return {
      entities: result,
      $count: result['$count'],
      $limit: result['$limit'],
      $offset: result['$offset']
    }


  }


  static _afterEntity(entityDef: EntityDef, entity: any[]): void {
    entity.forEach(e => {
      let idStr = entityDef.buildLookupConditions(e);
      let url = `api/entity/${entityDef.machineName}/${idStr}`;
      e['$url'] = url;
      e['$label'] = entityDef.label(e);
      //Reflect.defineProperty(e, '$url', {value: url, writable: false})
      //Reflect.defineProperty(e, '__url', {value: url})
    });
  }


  /**
   * Return a single Entity
   */
  @Credentials(['allow access entity :name', 'allow access entity'])
  @Get('/entity/:name/:id')
  async get(@Param('name') name: string, @Param('id') id: string) {
    const [entityDef, controller] = this.getControllerForEntityName(name);
    const conditions = entityDef.createLookupConditions(id);
    let result = null;
    if (_.isArray(conditions)) {
      result = await controller.find(entityDef.getClass(), conditions, {
        hooks: {afterEntity: EntityAPIController._afterEntity}
      });
      let results = {
        entities: result,
        $count: result['$count'],
        $limit: result['$limit'],
        $offset: result['$offset']
      }
      result = results;
    } else {
      result = await controller.find(entityDef.getClass(), conditions, {
        hooks: {afterEntity: EntityAPIController._afterEntity},
        limit: 1
      }).then(x => x.shift());
    }
    return result;
  }


  /**
   * Return a new created Entity
   */
  @Credentials(['allow create entity :name', 'allow create entity'])
  @Post('/entity/:name')
  async create(@Param('name') name: string, @Body() data: any): Promise<any> {
    const [entityDef, controller] = this.getControllerForEntityName(name);
    let entities;
    if (_.isArray(data)) {
      entities = _.map(data, d => entityDef.build(d));
    } else {
      entities = entityDef.build(data);
    }
    return controller.save(entities);
  }


  /**
   * Return a updated Entity
   */
  @Credentials(['allow update entity :name', 'allow update entity'])
  @Post('/entity/:name/:id')
  update(@Param('name') name: string, @Param('id') id: string, @Body() data: any) {
    const [entityDef, controller] = this.getControllerForEntityName(name);
//    const conditions = entityDef.createLookupConditions(id);
    let entities;
    if (_.isArray(data)) {
      entities = _.map(data, d => entityDef.build(d));
    } else {
      entities = entityDef.build(data);
    }
    return controller.save(entities);
  }


  /**
   * Return a deleted Entity
   */
  @Credentials(['allow delete entity :name', 'allow delete entity'])
  @Delete('/entity/:name/:id')
  delete() {
    throw new NotYetImplementedError()
  }


  private getControllerForEntityName(name: string): [EntityDef, EntityController] {
    const entityDef = this.getEntityDef(name);
    const schema = entityDef.getClassRef().getSchema();
    if (!_.isArray(schema)) {
      return [entityDef, this.getController(schema)];
    } else {
      throw new Error('multiple schemas for this entity, select one')
    }
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



