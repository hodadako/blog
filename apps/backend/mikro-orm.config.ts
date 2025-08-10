import { defineConfig } from '@mikro-orm/mysql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

export default defineConfig({
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  highlighter: new SqlHighlighter(),
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
}); 