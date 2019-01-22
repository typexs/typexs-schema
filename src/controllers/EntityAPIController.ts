import {Body, CurrentUser, Delete, Get, JsonController, Param, Post, QueryParam} from "routing-controllers";

import {Inject} from "typedi";
import {Invoker} from "@typexs/base/base/Invoker";
import {NotYetImplementedError} from "@typexs/base/libs/exceptions/NotYetImplementedError";

import {Access, ContextGroup} from "@typexs/server";
import {EntityRegistry} from "../libs/EntityRegistry";
import {EntityDef} from "../libs/registry/EntityDef";
import {EntityControllerFactory} from "../libs/EntityControllerFactory";
import {EntityController} from "../libs/EntityController";
import * as _ from "lodash";
import {
  PERMISSION_ALLOW_ACCESS_ENTITY,
  PERMISSION_ALLOW_ACCESS_ENTITY_PATTERN,
  PERMISSION_ALLOW_ACCESS_METADATA,
  PERMISSION_ALLOW_CREATE_ENTITY,
  PERMISSION_ALLOW_CREATE_ENTITY_PATTERN,
  PERMISSION_ALLOW_DELETE_ENTITY,
  PERMISSION_ALLOW_DELETE_ENTITY_PATTERN,
  PERMISSION_ALLOW_UPDATE_ENTITY,
  PERMISSION_ALLOW_UPDATE_ENTITY_PATTERN,
  XS_P_$COUNT,
  XS_P_$LIMIT,
  XS_P_$OFFSET,
  XS_P_LABEL,
  XS_P_URL
} from "../libs/Constants";
import {ObjectsNotValidError} from "./../libs/exceptions/ObjectsNotValidError";
import {EntityControllerApi} from "../api/entity.controller.api";


@ContextGroup('api')
@JsonController()
export class EntityAPIController {


  @Inject('EntityRegistry')
  registry: EntityRegistry;


  @Inject('EntityControllerFactory')
  factory: EntityControllerFactory;

  @Inject(Invoker.NAME)
  invoker: Invoker;

  /**
   * Return list of schemas with their entities
   */
  // @Authorized('read metadata schema')
  // - Check if user has an explicit credential to access the method
  @Access(PERMISSION_ALLOW_ACCESS_METADATA)
  @Get('/metadata/schemas')
  async schemas(@CurrentUser() user: any): Promise<any> {
    return this.registry.listSchemas().map(x => x.toJson(true, false));
  }

  /**
   * Return list of entity
   */
  @Access(PERMISSION_ALLOW_ACCESS_METADATA)
  @Get('/metadata/schema/:schemaName')
  async schema(@Param('schemaName') schemaName: string, @CurrentUser() user: any) {
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
  @Access(PERMISSION_ALLOW_ACCESS_METADATA)
  @Get('/metadata/entities')
  async entities(@CurrentUser() user: any) {
    return this.registry.listEntities().map(x => x.toJson());
  }


  /**
   * Return list of defined entities
   */
  @Access(PERMISSION_ALLOW_ACCESS_METADATA)
  @Get('/metadata/entity/:entityName')
  async entity(@Param('entityName') entityName: string, @CurrentUser() user: any) {
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
  @Access(PERMISSION_ALLOW_ACCESS_METADATA)
  @Post('/metadata/entity')
  async entityCreate(@Body() data: any, @CurrentUser() user: any) {
    throw new NotYetImplementedError()
  }


  /**
   * Run a query for entity
   */
  @Access([PERMISSION_ALLOW_ACCESS_ENTITY_PATTERN, PERMISSION_ALLOW_ACCESS_ENTITY])
  @Get('/entity/:name')
  async query(
    @Param('name') name: string,
    @QueryParam('query') query: string,
    @QueryParam('sort') sort: string,
    @QueryParam('limit') limit: number = 50,
    @QueryParam('offset') offset: number = 0,
    @CurrentUser() user: any
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
      $count: result[XS_P_$COUNT],
      $limit: result[XS_P_$LIMIT],
      $offset: result[XS_P_$OFFSET]
    }
  }


  /**
   * Return a single Entity
   */
  @Access([PERMISSION_ALLOW_ACCESS_ENTITY_PATTERN, PERMISSION_ALLOW_ACCESS_ENTITY])
  @Get('/entity/:name/:id')
  async get(@Param('name') name: string, @Param('id') id: string, @CurrentUser() user: any) {
    const [entityDef, controller] = this.getControllerForEntityName(name);
    const conditions = entityDef.createLookupConditions(id);
    let result = null;
    if (_.isArray(conditions)) {
      result = await controller.find(entityDef.getClass(), conditions, {
        hooks: {afterEntity: EntityAPIController._afterEntity}
      });
      let results = {
        entities: result,
        $count: result[XS_P_$COUNT],
        $limit: result[XS_P_$LIMIT],
        $offset: result[XS_P_$OFFSET]
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
  @Access([PERMISSION_ALLOW_CREATE_ENTITY_PATTERN, PERMISSION_ALLOW_CREATE_ENTITY])
  @Post('/entity/:name')
  async save(@Param('name') name: string, @Body() data: any, @CurrentUser() user: any): Promise<any> {
    const [entityDef, controller] = this.getControllerForEntityName(name);
    await this.invoker.use(EntityControllerApi).beforeEntityBuild(entityDef, data, user, controller);
    let entities;
    if (_.isArray(data)) {
      entities = _.map(data, d => entityDef.build(d, {beforeBuild: EntityAPIController._beforeBuild}));
    } else {
      entities = entityDef.build(data, {beforeBuild: EntityAPIController._beforeBuild});
    }
    await this.invoker.use(EntityControllerApi).afterEntityBuild(entityDef, entities, user, controller);
    return controller.save(entities).catch(e => {
      if (e instanceof ObjectsNotValidError) {
        throw e.toHttpError();
      }
      throw e;
    });
  }


  /**
   * Return a updated Entity
   */
  @Access([PERMISSION_ALLOW_UPDATE_ENTITY_PATTERN, PERMISSION_ALLOW_UPDATE_ENTITY])
  @Post('/entity/:name/:id')
  async update(@Param('name') name: string, @Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    const [entityDef, controller] = this.getControllerForEntityName(name);
    await this.invoker.use(EntityControllerApi).beforeEntityBuild(entityDef, data, user, controller);
//    const conditions = entityDef.createLookupConditions(id);
    let entities;
    if (_.isArray(data)) {
      entities = _.map(data, d => entityDef.build(d, {beforeBuild: EntityAPIController._beforeBuild}));
    } else {
      entities = entityDef.build(data, {beforeBuild: EntityAPIController._beforeBuild});
    }
    await this.invoker.use(EntityControllerApi).afterEntityBuild(entityDef, entities, user, controller);
    return controller.save(entities).catch(e => {
      if (e instanceof ObjectsNotValidError) {
        throw e.toHttpError();
      }
      throw e;
    });
  }


  /**
   * Return a deleted Entity
   */
  @Access([PERMISSION_ALLOW_DELETE_ENTITY_PATTERN, PERMISSION_ALLOW_DELETE_ENTITY])
  @Delete('/entity/:name/:id')
  async delete(@Param('name') name: string, @Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    const [entityDef, controller] = this.getControllerForEntityName(name);
    const conditions = entityDef.createLookupConditions(id);
    let results = await controller.find(entityDef.getClass(), conditions);
    if (results.length > 0) {
      return controller.remove(results);
    }
    return null;
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


  static _afterEntity(entityDef: EntityDef, entity: any[]): void {
    entity.forEach(e => {
      let idStr = entityDef.buildLookupConditions(e);
      let url = `api/entity/${entityDef.machineName}/${idStr}`;
      e[XS_P_URL] = url;
      e[XS_P_LABEL] = entityDef.label(e);
    });
  }


  static _beforeBuild(entityDef: EntityDef, from: any, to: any) {
    _.keys(from).filter(k => k.startsWith('$')).map(k => {
      to[k] = from[k];
    })
  }
}



