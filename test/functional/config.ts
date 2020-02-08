
import {IStorageOptions, StorageRef} from '@typexs/base';
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';

export const TEST_STORAGE_OPTIONS: IStorageOptions = process.env.SQL_LOG ? <SqliteConnectionOptions & IStorageOptions>{
  name: 'default',
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  logger: 'simple-console',
  logging: 'all',
  connectOnStartup: true

  // tablesPrefix: ""

} : <SqliteConnectionOptions & IStorageOptions>{
  name: 'default',
  type: 'sqlite',
  database: ':memory:',
  synchronize: true
  ,
  connectOnStartup: true

};
