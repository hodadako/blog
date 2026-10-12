module.exports = {
  'apps/web/**/*.{ts,tsx,js,jsx}': () => 'pnpm --filter web typecheck',
  'apps/web/tools/guitar-editor/**/*.{ts,tsx,mts}': () => 'pnpm guitar:editor:typecheck',
};
