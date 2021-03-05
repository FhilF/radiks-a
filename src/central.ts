import { signECDSA } from '@stacks/encryption';

import { getConfig } from './config';
import { saveCentral, fetchCentral } from './api';

class Central {
  static save(key: string, value: Record<string, any>) {
    const { identityAddress, signature } = this.makeSignature(key);
    return saveCentral({
      identityAddress,
      key,
      value,
      signature,
    });
  }

  static get(key: string) {
    const { identityAddress, signature } = this.makeSignature(key);

    return fetchCentral(key, identityAddress, signature);
  }

  static makeSignature(key: string) {
    const { userSession } = getConfig();
    const { appPrivateKey, identityAddress } = userSession.loadUserData();
    const message = `${identityAddress}-${key}`;

    const { signature } = signECDSA(appPrivateKey, message);

    return {
      identityAddress, signature,
    };
  }
}

export default Central;
