module.exports = {
  'apps/backend/**/*.{ts,js}': () => 'turbo run lint --filter=backend',
};
