import { defineConfig } from '@mikro-orm/mysql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

export default defineConfig({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'blog_db',
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  debug: process.env.NODE_ENV === 'development',
  highlighter: new SqlHighlighter(),
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
  seeder: {
    path: 'dist/seeders',
    pathTs: 'src/seeders',
  },
}); 