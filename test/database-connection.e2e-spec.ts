import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { TestConnectionRow } from './interfaces/test-connection-row.interface';
import { createTestApp } from './utils/createTestApp';
import { TestApp } from './interfaces/test-app.interface';

describe('Database Connection (e2e)', () => {
  let testApp: TestApp;
  let dataSource: DataSource;

  beforeAll(async () => {
    testApp = await createTestApp();
    dataSource = testApp.app.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await testApp.close();
  });

  describe('Connection Status', () => {
    it('should establish database connection', () => {
      expect(dataSource).toBeDefined();
      expect(dataSource.isInitialized).toBe(true);
    });

    it('should connect to the correct database', () => {
      const pgOptions = dataSource.options as PostgresConnectionOptions;
      expect(pgOptions.database).toBe(
        process.env.DB_NAME || 'marketplace_main_db',
      );
      expect(pgOptions.type).toBe('postgres');
    });

    it('should have correct connection options', () => {
      const pgOptions = dataSource.options as PostgresConnectionOptions;
      expect(pgOptions.host).toBe(process.env.DB_HOST || 'localhost');
      expect(pgOptions.port).toEqual(process.env.DB_PORT || '5432');
      expect(pgOptions.username).toBe(process.env.DB_USERNAME || 'postgres');
    });
  });

  describe('Connection Functionality', () => {
    it('should execute a basic query', async () => {
      const raw: unknown = await dataSource.query(
        'SELECT 1 as test_connection',
      );
      const result = raw as TestConnectionRow[];
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].test_connection).toBe(1);
    });
  });

  describe('Database Schema', () => {
    it('should have tables created via synchronization', async () => {
      const tables: { table_name: string }[] = await dataSource.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE';
      `);
      const tableNames = tables.map((t) => t.table_name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('auth_tokens');
    });
  });
});
