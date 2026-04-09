module.exports = {
  'apps/web/**/*.{ts,tsx,js,jsx}': () => 'pnpm --filter web typecheck',
};
