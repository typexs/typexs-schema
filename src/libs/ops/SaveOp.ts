import {EntityDef} from '../EntityDef';

import {ConnectionWrapper} from 'typexs-base';
import {SchemaUtils} from '../SchemaUtils';
import {PropertyDef} from '../PropertyDef';
import {EntityController} from '../EntityController';
import {EntityDefTreeWorker} from './EntityDefTreeWorker';
import {NotYetImplementedError, NotSupportedError} from 'typexs-base';
import {XS_P_PROPERTY, XS_P_SEQ_NR, XS_P_TYPE} from '../Constants';
import * as _ from '../LoDash';
import {ClassRef} from "../ClassRef";


export interface IRelation {

}

export class EntityRefenceRelation implements IRelation {

  sourceRef: EntityDef;

  propertyRef: PropertyDef;

  source: any;

}


interface ISaveData {
  saved: any[];
  map?: number[][];
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


  visitDataProperty(propertyDef: PropertyDef, sourceDef: PropertyDef | EntityDef | ClassRef, sources?: any[], targets?: any[]): void {
  }

  async visitEntity(entityDef: EntityDef, propertyDef: PropertyDef, sources: any): Promise<ISaveData> {
    let map: number[][] = [];
    if (_.has(sources, 'saved')) {
      sources = (<ISaveData>sources).saved;
    }

    if (propertyDef) {
      let propObjects: any[] = [];
      [map, propObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources);
      sources = propObjects;
    }
    let saved: any[] = await this.c.manager.save(entityDef.object.getClass(), sources);
    return {saved: saved, map: map};
  }


  async visitEntityReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, entityDef: EntityDef, sources?: ISaveData, targets?: ISaveData): Promise<ISaveData> {

    let sourceEntityDef: EntityDef;
    if (sourceDef instanceof EntityDef) {
      sourceEntityDef = sourceDef;
    } else {
      throw new NotYetImplementedError()
    }

    let joinObjs: any[] = [];
    for (let source of sources.saved) {
      let seqNr = 0;
      for (let target of targets.saved) {
        let joinObj = propertyDef.joinRef.new();
        joinObjs.push(joinObj);
        let [id, name] = this.em.nameResolver().forSource(XS_P_TYPE);
        joinObj[id] = sourceEntityDef.machineName;

        sourceEntityDef.getPropertyDefIdentifier().forEach(prop => {
          [id, name] = this.em.nameResolver().forSource(prop);
          joinObj[id] = prop.get(source);
        });

        [id, name] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
        joinObj[id] = seqNr++;

        entityDef.getPropertyDefIdentifier().forEach(prop => {
          [id, name] = this.em.nameResolver().forTarget(prop);
          joinObj[id] = prop.get(target);
        });
      }
    }

    if (joinObjs.length > 0) {
      let saved: any[] = await this.c.manager.save(propertyDef.joinRef.getClass(), joinObjs);
      SchemaUtils.remap(propertyDef, targets.saved, targets.map, sources.saved);
    }
    targets.map = [];
    return targets;
  }

  visitExternalReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources?: any[]): Promise<any[]> {
    return undefined;
  }

  visitObjectReference(sourceDef: PropertyDef | EntityDef | ClassRef, propertyDef: PropertyDef, classRef: ClassRef, sources?: any[]): Promise<any[]> {
    return undefined;
  }


//
//   async onEntityReference(entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]) {
//     let [map, flattenObjects] = SchemaUtils.extractPropertyObjects(propertyDef, objects);
//     flattenObjects = await this.saveByEntityDef(propertyDef.targetRef.getEntity(), flattenObjects);
//     // TODO write back
//
//     SchemaUtils.remap(propertyDef, flattenObjects, map, objects);
//     this.createBindingRelation(EntityRefenceRelation, entityDef, propertyDef, objects);
//
//   }
//
//   createBindingRelation(klazz: Function, entityDef: EntityDef, propertyDef: PropertyDef,
//                         objects: any[]) {
//     let className = propertyDef.joinRef.className;
//     if (!this.relations[className]) {
//       this.relations[className] = [];
//     }
//
//     for (let object of objects) {
//       let rel = Reflect.construct(klazz, []);
//       rel.sourceRef = entityDef;
//       rel.propertyRef = propertyDef;
//       rel.source = object;
//       this.relations[className].push(rel);
//     }
//   }
//
//
//
//
//
//   async onObjectReference(entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]): Promise<void> {
//     let targetRefClass = propertyDef.targetRef.getClass();
//     await this._onPropertyRefGeneral(targetRefClass, entityDef, propertyDef, objects);
//   }
//
//
//   async onExternalProperty(entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]): Promise<void> {
//     let propertyRefClass = propertyDef.propertyRef.getClass();
//     await this._onPropertyRefGeneral(propertyRefClass, entityDef, propertyDef, objects);
//   }
//
//
//   private async _onPropertyRefGeneral(targetRefClass: Function, entityDef: EntityDef, propertyDef: PropertyDef, objects: any[]) {
//     let [map, propertyObjects] = SchemaUtils.extractPropertyObjects(propertyDef, objects);
//
//     if (propertyObjects.length == 0) {
//       return;
//     }
//
//     let properties = this.em.schema().getPropertiesFor(targetRefClass);
//     for (let property of properties) {
//
//       if (property.isInternal()) {
//         if (property.isReference()) {
//           if (property.isEntityReference()) {
//             if (!property.isCollection()) {
//               let [subMap, subFlattenObjects] = SchemaUtils.extractPropertyObjects(property, propertyObjects);
//               subFlattenObjects = await this.saveByEntityDef(property.targetRef.getEntity(), subFlattenObjects);
//               SchemaUtils.remap(property, subFlattenObjects, subMap, propertyObjects);
//             } else {
//               throw new NotSupportedError('entity reference; cardinality > 1 ');
//             }
//           } else {
//             if (!property.isCollection()) {
//               // joinObj is build under createPropertyReferenceStorageObject
//             } else {
//               throw new NotSupportedError('not supported; embedding reference;cardinality > 1  ');
//               //throw new NotSupportedError('entity reference; cardinality > 1 ');
//             }
//           }
//         }
//       } else {
//         throw new NotSupportedError('shouldn\'t happen');
//       }
//     }
//
//     SchemaUtils.remap(propertyDef, propertyObjects, map, objects);
//     this.createBindingRelation(PropertyRefenceRelation, entityDef, propertyDef, objects);
//   }
//
//
//   private async processRelations(): Promise<any[]> {
//
//     let classNames = Object.keys(this.relations);
//     let promises: Promise<any>[] = [];
//
//     for (let className of classNames) {
//       let relations = this.relations[className];
//       let rels: any[] = [];
//       while (relations.length > 0) {
//         let relation = relations.shift();
//         if (relation instanceof EntityRefenceRelation) {
//
//           if (relation.propertyRef.isEntityReference()) {
//             let propertyDef = relation.propertyRef;
//
//             let targetRefClass = propertyDef.joinRef.getClass();
//
//             // TODO if revision ass id
//             if (propertyDef.isCollection()) {
//               let refCollection = relation.source[propertyDef.name];
//               for (let i = 0; i < refCollection.length; i++) {
//                 rels.push(this.createEntityReferenceStorageObject(targetRefClass, relation, refCollection[i], i));
//               }
//             } else {
//               rels.push(this.createEntityReferenceStorageObject(targetRefClass, relation, relation.source[propertyDef.name], 0));
//             }
//
//
//           } else {
//             throw new NotYetImplementedError();
//           }
//         } else if (relation instanceof PropertyRefenceRelation) {
//           let propertyDef = relation.propertyRef;
//           let targetRefClass = null;
//
//           if (propertyDef.isInternal()) {
//             targetRefClass = propertyDef.targetRef.getClass();
//           } else {
//             targetRefClass = propertyDef.propertyRef.getClass();
//           }
//
//           if (propertyDef.isCollection()) {
//             let refCollection = relation.source[propertyDef.name];
//             for (let i = 0; i < refCollection.length; i++) {
//               rels.push(this.createPropertyReferenceStorageObject(targetRefClass, relation, refCollection[i], i));
//             }
//           } else {
//             rels.push(this.createPropertyReferenceStorageObject(targetRefClass, relation, relation.source[propertyDef.name], 0));
//           }
//
//           // TODO if revision ass id
//
//
//         } else {
//           throw new NotYetImplementedError();
//         }
//       }
//       promises.push(this.c.manager.save(className, rels));
//
//     }
//
//     return Promise.all(promises);
//   }
//
//   private createEntityReferenceStorageObject(targetRefClass: Function, relation: PropertyRefenceRelation, entry: any, seqNr: number): any {
//     let joinObj = Reflect.construct(targetRefClass, []);
//     let [id, name] = this.em.nameResolver().forSource(XS_P_TYPE);
//     joinObj[id] = relation.sourceRef.name;
//
//     relation.sourceRef.getPropertyDefIdentifier().forEach(prop => {
//       [id, name] = this.em.nameResolver().forSource(prop);
//       joinObj[id] = prop.get((<EntityRefenceRelation>relation).source);
//     });
//
//     [id, name] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
//     joinObj[id] = seqNr;
//
//     relation.propertyRef.targetRef.getEntity().getPropertyDefIdentifier().forEach(prop => {
//       [id, name] = this.em.nameResolver().forTarget(prop);
//       joinObj[id] = prop.get(entry);
//     });
//     return joinObj;
//   }
//
//   private createPropertyReferenceStorageObject(targetRefClass: Function, relation: PropertyRefenceRelation, entry: any, seqNr: number): any {
//     let clazz = relation.propertyRef.joinRef.getClass();
//     let joinObj = Reflect.construct(clazz, []);
//     let [id, name] = this.em.nameResolver().forSource(XS_P_TYPE);
//     joinObj[id] = relation.sourceRef.name;
//
//     if (!relation.propertyRef.isInternal()) {
//       // PropertyOf
//       let [id, name] = this.em.nameResolver().forSource(XS_P_PROPERTY);
//       joinObj[id] = relation.propertyRef.name;
//     }
//
//     relation.sourceRef.getPropertyDefIdentifier().forEach(prop => {
//       [id, name] = this.em.nameResolver().forSource(prop);
//       joinObj[id] = prop.get((<PropertyRefenceRelation>relation).source);
//     });
//
//     [id, name] = this.em.nameResolver().forSource(XS_P_SEQ_NR);
//     joinObj[id] = seqNr;
//
//     let properties = this.em.schema().getPropertiesFor(targetRefClass);
//     for (let prop of properties) {
//
//       if (prop.isInternal()) {
//         let obj = prop.get(entry);
//         if (prop.isReference()) {
//
//           if (prop.isEntityReference()) {
//             prop.targetRef.getEntity().getPropertyDefIdentifier().forEach(_prop => {
//               [id, name] = this.em.nameResolver().for(prop.machineName, _prop);
//               joinObj[id] = _prop.get(obj/*[prop.name]*/);
//             });
//           } else {
//
//             if(!prop.isCollection()){
//               let prefix = prop.targetRef.machineName();
//               let subProps = this.em.schema().getPropertiesFor(prop.targetRef.getClass());
//               for (let subProp of subProps) {
//                 const prefixedId = [prefix,subProp.name].join('__')
//                 joinObj[prefixedId] = subProp.get(obj);
//               }
//             }else{
//               throw new NotSupportedError('embedded properties in properties; cardinality > 1')
//             }
//           }
//         } else {
//           joinObj[prop.name] = obj;
//         }
//       }
//     }
//     return joinObj;
//   }


  private async saveByEntityDef<T>(entityName: string | EntityDef, objects: T[]): Promise<T[]> {
    let entityDef = SchemaUtils.resolve(this.em.schemaDef, entityName);
    let data: ISaveData = await this.walk(entityDef, objects);
    return data.saved;
//    objects = await this.c.manager.save(entityDef.object.getClass(), objects);
//    return objects;
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
        .then(x => {
          //return this.processRelations();
        });
    });


    if (!isArray) {
      return this.objects.shift();
    }
    return this.objects;

    return null;
  }

}
