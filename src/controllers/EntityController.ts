import {Get, Post, JsonController, Body, Param, QueryParam} from "routing-controllers";

import {Inject} from "typexs-base";
import {ContextGroup} from "typexs-server";
import {EntityRegistry} from "..";

@ContextGroup('api')
@JsonController()
export class EntityController {


  @Inject('EntityRegistry')
  registry: EntityRegistry;

  /**
   * Return list of schemas with their entities
   */
  @Get('/schemas')
  async schemas(): Promise<any> {
    return this.registry.listSchemas();
  }

  /**
   * Return list of entity
   */
  @Get('/schema/:schemaName')
  schema(@Param('schemaName') schemaName: string) {
  }

  /**
   * Return list of defined entities
   */
  @Get('/entities')
  entities() {
    return this.registry.listEntities();
  }

  /**
   * Return a single Entity
   */
  @Get('/entity/:name/:id')
  get() {
  }


  /**
   * Return a Schema of an entity
   */
  @Get('/:name/_schema')
  getSchema() {
  }

}



