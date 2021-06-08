import {
  Access,
  Body,
  C_API,
  ContentType,
  ContextGroup,
  CurrentUser,
  Delete,
  Get,
  JsonController,
  Param,
  Post,
  QueryParam,
  XS_P_$LABEL,
  XS_P_$URL
} from '@typexs/server';
import {__CLASS__, __REGISTRY__, Inject, Invoker, NotYetImplementedError, XS_P_$COUNT, XS_P_$LIMIT, XS_P_$OFFSET} from '@typexs/base';
import {EntityRef} from '../libs/registry/EntityRef';
import {EntityControllerFactory} from '../libs/EntityControllerFactory';
import {EntityController} from '../libs/EntityController';
import * as _ from 'lodash';
import {
  _API_CTRL_ENTITY_DELETE_ENTITY,
  _API_CTRL_ENTITY_FIND_ENTITY,
  _API_CTRL_ENTITY_GET_ENTITY,
  _API_CTRL_ENTITY_METADATA_ALL_ENTITIES,
  _API_CTRL_ENTITY_METADATA_ALL_STORES,
  _API_CTRL_ENTITY_METADATA_CREATE_ENTITY,
  _API_CTRL_ENTITY_METADATA_GET_ENTITY,
  _API_CTRL_ENTITY_METADATA_GET_STORE,
  _API_CTRL_ENTITY_SAVE_ENTITY,
  _API_CTRL_ENTITY_UPDATE_ENTITY,
  API_ENTITY_PREFIX,
  PERMISSION_ALLOW_ACCESS_ENTITY,
  PERMISSION_ALLOW_ACCESS_ENTITY_METADATA,
  PERMISSION_ALLOW_ACCESS_ENTITY_PATTERN,
  PERMISSION_ALLOW_CREATE_ENTITY,
  PERMISSION_ALLOW_CREATE_ENTITY_PATTERN,
  PERMISSION_ALLOW_DELETE_ENTITY,
  PERMISSION_ALLOW_DELETE_ENTITY_PATTERN,
  PERMISSION_ALLOW_UPDATE_ENTITY,
  PERMISSION_ALLOW_UPDATE_ENTITY_PATTERN,
} from '../libs/Constants';
import {ObjectsNotValidError} from './../libs/exceptions/ObjectsNotValidError';
import {EntityControllerApi} from '../api/entity.controller.api';
import {IJsonSchemaUnserializeOptions, JsonSchema} from '@allgemein/schema-api';
import {isEntityRef} from '@allgemein/schema-api/api/IEntityRef';


@ContextGroup(C_API)
@JsonController(API_ENTITY_PREFIX)
export class EntityAPIController {

  @Inject('EntityControllerFactory')
  factory: EntityControllerFactory;

  @Inject(Invoker.NAME)
  invoker: Invoker;


  static _afterEntity(entityDef: EntityRef, entity: any[]): void {
    entity.forEach(e => {
      EntityAPIController.addMeta(entityDef, e);
    });
  }

  private static addMeta(entityRef: EntityRef, e: any) {
    const idStr = entityRef.buildLookupConditions(e);
    const url = `${API_ENTITY_PREFIX}/${entityRef.machineName}/${idStr}`;
    e[XS_P_$URL] = url;
    e[XS_P_$LABEL] = entityRef.label(e);
    if (!e[__CLASS__]) {
      e[__CLASS__] = entityRef.name;
    }
    if (!e[__REGISTRY__]) {
      e[__REGISTRY__] = entityRef.getNamespace();
    }

  }


  static _beforeBuild(entityDef: EntityRef, from: any, to: any) {
    _.keys(from).filter(k => k.startsWith('$')).map(k => {
      to[k] = from[k];
    });
  }


  /**
   * Return list of schemas with their entities
   */
  // @Authorized('read metadata schema')
  // - Check if user has an explicit credential to access the method
  @Access(PERMISSION_ALLOW_ACCESS_ENTITY_METADATA)
  @Get(_API_CTRL_ENTITY_METADATA_ALL_STORES)
  @ContentType('application/json')
  async schemas(@CurrentUser() user: any): Promise<any> {
    return this.getRegistry().getSchemaRefs().map(x => x.name);
  }

  /**
   * Return list of entity
   */
  @Access(PERMISSION_ALLOW_ACCESS_ENTITY_METADATA)
  @Get(_API_CTRL_ENTITY_METADATA_GET_STORE)
  @ContentType('application/json')
  async schema(@Param('name') schemaName: string,
               @CurrentUser() user: any,
               @QueryParam('opts') options?: IJsonSchemaUnserializeOptions) {
    const schemaRef = this.getRegistry().getSchemaRefByName(schemaName);
    if (schemaRef) {
      const serializer = JsonSchema.getSerializer({
        /**
         * Append storageName to entity object
         * @param src
         * @param dst
         */
        postProcess: (src, dst) => {
          if (isEntityRef(src)) {
            dst.schemaName = schemaName;
          }
        }
      });
      for (const ref of schemaRef.getEntityRefs()) {
        if (ref && isEntityRef(ref)) {
          serializer.serialize(ref);
        }
      }
      return serializer.getJsonSchema() ? serializer.getJsonSchema() : {};
    } else {
      throw new Error('no schema ' + schemaName + ' found');
    }
  }


  /**
   * Return list of defined entities
   */
  @Access(PERMISSION_ALLOW_ACCESS_ENTITY_METADATA)
  @Get(_API_CTRL_ENTITY_METADATA_ALL_ENTITIES)
  @ContentType('application/json')
  async entities(@CurrentUser() user: any, @QueryParam('opts') options?: IJsonSchemaUnserializeOptions) {
    return this.getRegistry().toJsonSchema(options);
  }


  /**
   * Return list of defined entities
   */
  @Access(PERMISSION_ALLOW_ACCESS_ENTITY_METADATA)
  @Get(_API_CTRL_ENTITY_METADATA_GET_ENTITY)
  @ContentType('application/json')
  async entity(@Param('name') entityName: string, @CurrentUser() user: any, @QueryParam('opts') options?: IJsonSchemaUnserializeOptions) {
    return this.getRegistry().getEntityRefByName(entityName).toJsonSchema(options);
  }


  /**
   * Return list of defined entities
   */
  @Access(PERMISSION_ALLOW_ACCESS_ENTITY_METADATA)
  @Post(_API_CTRL_ENTITY_METADATA_CREATE_ENTITY)
  @ContentType('application/json')
  async entityCreate(@Body() data: any, @CurrentUser() user: any) {
    throw new NotYetImplementedError();
  }


  /**
   * Run a query for entity
   */
  @Access([PERMISSION_ALLOW_ACCESS_ENTITY_PATTERN, PERMISSION_ALLOW_ACCESS_ENTITY])
  @Get(_API_CTRL_ENTITY_FIND_ENTITY)
  @ContentType('application/json')
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

    const result = await controller.find(entityDef.getClass(), conditions, {
      limit: limit,
      offset: offset,
      sort: sortBy,
      hooks: {
        afterEntity: EntityAPIController._afterEntity
      }
    });

    return {
      entities: result,
      $count: result[XS_P_$COUNT],
      $limit: result[XS_P_$LIMIT],
      $offset: result[XS_P_$OFFSET]
    };
  }


  /**
   * Return a single Entity
   */
  @Access([PERMISSION_ALLOW_ACCESS_ENTITY_PATTERN, PERMISSION_ALLOW_ACCESS_ENTITY])
  @Get(_API_CTRL_ENTITY_GET_ENTITY)
  @ContentType('application/json')
  async get(@Param('name') name: string, @Param('id') id: string, @CurrentUser() user: any) {
    const [entityDef, controller] = this.getControllerForEntityName(name);
    const conditions = entityDef.createLookupConditions(id);
    let result = null;
    if (_.isArray(conditions)) {
      result = await controller.find(entityDef.getClass(), {$or: conditions}, {
        hooks: {
          afterEntity: EntityAPIController._afterEntity
        }
      });
      const results = {
        entities: result,
        $count: result[XS_P_$COUNT],
        $limit: result[XS_P_$LIMIT],
        $offset: result[XS_P_$OFFSET]
      };
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
  @Post(_API_CTRL_ENTITY_SAVE_ENTITY)
  @ContentType('application/json')
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
  @Post(_API_CTRL_ENTITY_UPDATE_ENTITY)
  @ContentType('application/json')
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
  @Delete(_API_CTRL_ENTITY_DELETE_ENTITY)
  @ContentType('application/json')
  async delete(@Param('name') name: string, @Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    const [entityDef, controller] = this.getControllerForEntityName(name);
    const conditions = entityDef.createLookupConditions(id);
    const results = await controller.find(entityDef.getClass(), conditions);
    if (results.length > 0) {
      return controller.remove(results);
    }
    return null;
  }


  private getControllerForEntityName(name: string): [EntityRef, EntityController] {
    const entityDef = this.getEntityDef(name);
    const schema = entityDef.getSchemaRefs();
    if (!_.isArray(schema)) {
      return [entityDef, this.getController(schema.name)];
    } else {
      if (schema.length === 1) {
        return [entityDef, this.getController(_.first(schema).name)];
      } else {
        throw new Error('multiple schemas for this entity, select one');
      }
    }
  }


  private getController(schemaName: string): EntityController {
    const controller = this.factory.get(schemaName);
    if (controller) {
      return controller;
    }
    throw new Error('no controller defined for ' + name);
  }


  private getEntityDef(entityName: string): EntityRef {
    const entityDef = this.getRegistry().getEntityRefByName(entityName);
    if (entityDef) {
      return entityDef;
    }
    throw new Error('no entity definition found  for ' + entityName);
  }

  private getRegistry() {
    return this.factory.getRegistry();
  }
}



