import { UserSession } from '@stacks/connect';
import { Storage } from '@stacks/storage';

interface Config {
  apiServer: string;
  userSession: UserSession;
  storage: Storage;
}

let config: Config = {
  apiServer: '',
  userSession: null,
  storage: null,
};

export const configure = (newConfig: Config) => {
  config = {
    ...config,
    ...newConfig,
  };
};

/**
 * some info
 */
export const getConfig = (): Config => config;
