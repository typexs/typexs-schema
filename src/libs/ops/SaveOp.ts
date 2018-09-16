import {EntityDef} from '../EntityDef';

import {ConnectionWrapper} from 'typexs-base';
import {SchemaUtils} from '../SchemaUtils';
import {PropertyDef} from '../PropertyDef';
import {EntityController} from '../EntityController';
import {EntityDefTreeWorker} from './EntityDefTreeWorker';
import {NotYetImplementedError, NotSupportedError} from 'typexs-base';
import {XS_P_PROPERTY, XS_P_SEQ_NR, XS_P_TYPE} from '../Constants';
import * as _ from '../LoDash';


export interface IRelation {

}

export class EntityRefenceRelation implements IRelation {

  sourceRef: EntityDef;

  propertyRef: PropertyDef;

  source: any;

}

export class PropertyRefenceRelation implements IRelation {

  sourceRef: EntityDef;

  propertyRef: PropertyDef;

  source: any;

}


export class SaveOp<T> extends EntityDefTreeWorker {

  readonly em: EntityController;

  private objects: T[] = [];

  private c: ConnectionWrapper;

  private relations: { [className: string]: IRelation[] } = {};


  constructor(em: EntityController) {
    super();
    this.em = em;
  }

  extractPropertyObjects(propertyDef: PropertyDef, objects: any[], prefixed: string = null): [number[][], any[]] {
    let innerObjects: any[] = SchemaUtils.get(prefixed ? [prefixed, propertyDef.name].join('__') : propertyDef.name, objects);

    let map: number[][] = [];
    let flattenObjects: any[] = [];
    for (let i = 0; i < innerObjects.length; i++) {
      let obj = innerObjects[i];
      if (obj) {
        // ignoring null and undefined values
        if (_.isArray(obj)) {
          for (let j = 0; j < obj.length; j++) {
            map.push([i, j]);
            flattenObjects.push(obj[j]);
          }
        } else {
          map.push([i]);
          flattenObjects.push(obj);
        }
      }
    }
    return [map, flattenObjects];
  }

  async onEntityReference(entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]) {
    let [map, flattenObjects] = this.extractPropertyObjects(propertyDef, objects);
    flattenObjects = await this.saveByEntityDef(propertyDef.targetRef.getEntity(), flattenObjects);
    // TODO write back

    SaveOp.remap(propertyDef, flattenObjects, map, objects);
    this.createBindingRelation(EntityRefenceRelation, entityDef, propertyDef, objects);

  }

  createBindingRelation(klazz: Function, entityDef: EntityDef, propertyDef: PropertyDef,
                        objects: any[]) {
    let className = propertyDef.joinRef.className;
    if (!this.relations[className]) {
      this.relations[className] = [];
    }

    for (let object of objects) {
      let rel = Reflect.construct(klazz, []);
      rel.sourceRef = entityDef;
      rel.propertyRef = propertyDef;
      rel.source = object;
      this.relations[className].push(rel);
    }
  }


  static remap(propertyDef: PropertyDef, flattenObjects: any[], map: number[][], objects: any[], prefixed: string = null) {
    let propName = prefixed ? [prefixed,propertyDef.name].join('__') : propertyDef.name;

    for (let i = 0; i < flattenObjects.length; i++) {
      let mapping = map[i];
      let sourceIdx = mapping[0];

      if (propertyDef.isCollection()) {
        if (!objects[sourceIdx][propName]) {
          objects[sourceIdx][propName] = [];
        }
        let posIdx = mapping[1];
        _.set(<any>objects[sourceIdx], propName + '[' + posIdx + ']', flattenObjects[i]);
      } else {
        _.set(<any>objects[sourceIdx], propName, flattenObjects[i]);
      }

    }
  }


  async onPropertyReference(entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]): Promise<void> {
    let targetRefClass = propertyDef.targetRef.getClass();
    await this._onPropertyRefGeneral(targetRefClass, entityDef, propertyDef, objects);
  }


  async onPropertyOfReference(entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]): Promise<void> {
    let propertyRefClass = propertyDef.propertyRef.getClass();
    await this._onPropertyRefGeneral(propertyRefClass, entityDef, propertyDef, objects);
  }


  private async _onPropertyRefGeneral(targetRefClass: Function, entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]) {
    let [map, propertyObjects] = this.extractPropertyObjects(propertyDef, objects);

    if (propertyObjects.length == 0) {
      return;
    }

    let properties = this.em.schema().getPropertiesFor(targetRefClass);
    for (let property of properties) {

      if (property.isInternal()) {
        if (property.isReference()) {
          if (property.isEntityReference()) {
            if (!property.isCollection()) {
              let [subMap, subFlattenObjects] = this.extractPropertyObjects(property, propertyObjects);
              subFlattenObjects = await this.saveByEntityDef(property.targetRef.getEntity(), subFlattenObjects);
              SaveOp.remap(property, subFlattenObjects, subMap, propertyObjects);
            } else {
              throw new NotSupportedError('entity reference; cardinality > 1 ');
            }
          } else {
            if (!property.isCollection()) {
              // joinObj is build under createPropertyReferenceStorageObject
            } else {
              throw new NotSupportedError('not supported; embedding reference;cardinality > 1  ');
              //throw new NotSupportedError('entity reference; cardinality > 1 ');
            }
          }
        }
      } else {
        throw new NotSupportedError('shouldn\'t happen');
      }
    }

    SaveOp.remap(propertyDef, propertyObjects, map, objects);
    this.createBindingRelation(PropertyRefenceRelation, entityDef, propertyDef, objects);
  }


  private async processRelations(): Promise<any[]> {

    let classNames = Object.keys(this.relations);
    let promises: Promise<any>[] = [];

    for (let className of classNames) {
      let relations = this.relations[className];
      let rels: any[] = [];
      while (relations.length > 0) {
        let relation = relations.shift();
        if (relation instanceof EntityRefenceRelation) {

          if (relation.propertyRef.isEntityReference()) {
            let propertyDef = relation.propertyRef;

            let targetRefClass = propertyDef.joinRef.getClass();

            // TODO if revision ass id
            if (propertyDef.isCollection()) {
              let refCollection = relation.source[propertyDef.name];
              for (let i = 0; i < refCollection.length; i++) {
                rels.push(this.createEntityReferenceStorageObject(targetRefClass, relation, refCollection[i], i));
              }
            } else {
              rels.push(this.createEntityReferenceStorageObject(targetRefClass, relation, relation.source[propertyDef.name], 0));
            }


          } else {
            throw new NotYetImplementedError();
          }
        } else if (relation instanceof PropertyRefenceRelation) {
          let propertyDef = relation.propertyRef;
          let targetRefClass = null;

          if (propertyDef.isInternal()) {
            targetRefClass = propertyDef.targetRef.getClass();
          } else {
            targetRefClass = propertyDef.propertyRef.getClass();
          }

          if (propertyDef.isCollection()) {
            let refCollection = relation.source[propertyDef.name];
            for (let i = 0; i < refCollection.length; i++) {
              rels.push(this.createPropertyReferenceStorageObject(targetRefClass, relation, refCollection[i], i));
            }
          } else {
            rels.push(this.createPropertyReferenceStorageObject(targetRefClass, relation, relation.source[propertyDef.name], 0));
          }

          // TODO if revision ass id


        } else {
          throw new NotYetImplementedError();
        }
      }
      promises.push(this.c.manager.save(className, rels));

    }

    return Promise.all(promises);
  }

  private createEntityReferenceStorageObject(targetRefClass: Function, relation: PropertyRefenceRelation, entry: any, seqNr: number): any {
    let joinObj = Reflect.construct(targetRefClass, []);
    let [id, name] = this.em.nameResolver().forSource(XS_P_TYPE);
    joinObj[id] = relation.sourceRef.name;

    relation.sourceRef.getPropertyDefIdentifier().forEach(prop => {
      [id, name] = this.em.nameResolver().forSource(prop);
      joinObj[id] = prop.get((<EntityRefenceRelation>relation).source);
    });

    [id, name] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
    joinObj[id] = seqNr;

    relation.propertyRef.targetRef.getEntity().getPropertyDefIdentifier().forEach(prop => {
      [id, name] = this.em.nameResolver().forTarget(prop);
      joinObj[id] = prop.get(entry);
    });
    return joinObj;
  }

  private createPropertyReferenceStorageObject(targetRefClass: Function, relation: PropertyRefenceRelation, entry: any, seqNr: number): any {
    let clazz = relation.propertyRef.joinRef.getClass();
    let joinObj = Reflect.construct(clazz, []);
    let [id, name] = this.em.nameResolver().forSource(XS_P_TYPE);
    joinObj[id] = relation.sourceRef.name;

    if (!relation.propertyRef.isInternal()) {
      // PropertyOf
      let [id, name] = this.em.nameResolver().forSource(XS_P_PROPERTY);
      joinObj[id] = relation.propertyRef.name;
    }

    relation.sourceRef.getPropertyDefIdentifier().forEach(prop => {
      [id, name] = this.em.nameResolver().forSource(prop);
      joinObj[id] = prop.get((<PropertyRefenceRelation>relation).source);
    });

    [id, name] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
    joinObj[id] = seqNr;

    let properties = this.em.schema().getPropertiesFor(targetRefClass);
    for (let prop of properties) {

      if (prop.isInternal()) {
        let obj = prop.get(entry);
        if (prop.isReference()) {

          if (prop.isEntityReference()) {
            prop.targetRef.getEntity().getPropertyDefIdentifier().forEach(_prop => {
              [id, name] = this.em.nameResolver().for(prop.machineName, _prop);
              joinObj[id] = _prop.get(obj/*[prop.name]*/);
            });
          } else {

            if(!prop.isCollection()){
              let prefix = prop.targetRef.machineName();
              let subProps = this.em.schema().getPropertiesFor(prop.targetRef.getClass());
              for (let subProp of subProps) {
                const prefixedId = [prefix,subProp.name].join('__')
                joinObj[prefixedId] = subProp.get(obj);
              }
            }else{
              throw new NotSupportedError('embedded properties in properties; cardinality > 1')
            }
          }
        } else {
          joinObj[prop.name] = obj;
        }
      }
    }
    return joinObj;
  }


  private async saveByEntityDef<T>(entityName: string | EntityDef, objects: T[]): Promise<T[]> {
    let entityDef = SchemaUtils.resolve(this.em.schemaDef, entityName);
    await this.walk(entityDef, objects);
    objects = await this.c.manager.save(entityDef.object.getClass(), objects);
    return objects;
  }


  prepare(object: T | T[]): T[] {
    let objs: T[] = [];
    if (_.isArray(object)) {
      objs = object;
    } else {
      objs.push(object);
    }
    return objs;
  }


  async run(object: T | T[]): Promise<T | T[]> {
    let isArray = _.isArray(object);
    this.relations = {};
    this.objects = this.prepare(object);

    let resolveByEntityDef = EntityController.resolveByEntityDef(this.objects);
    let entityNames = Object.keys(resolveByEntityDef);
    this.c = await this.em.storageRef.connect();

    // start transaction, got to leafs and save
    let results = await this.c.manager.transaction(async em => {
      let promises = [];
      for (let entityName of entityNames) {
        let p = this.saveByEntityDef(entityName, resolveByEntityDef[entityName]);
        promises.push(p);
      }
      return Promise.all(promises)
      //        .then(x => {
      //  return this.processGlobalRelations();
      //  })
        .then(x => {
          return this.processRelations();
        });
    });


    if (!isArray) {
      return this.objects.shift();
    }
    return this.objects;

  }

}
