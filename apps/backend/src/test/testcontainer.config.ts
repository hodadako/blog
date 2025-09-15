import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';

let container: StartedMySqlContainer;

export const startMySqlContainer = async () => {
  container = await new MySqlContainer("mysql:8.0")
    .withDatabase('test')
    .withUsername('test-user')
    .withUserPassword('test-password')
    .start();
  return container;
};

export const stopMySqlContainer = async () => {
  if (container) {
    await container.stop();
  }
};
