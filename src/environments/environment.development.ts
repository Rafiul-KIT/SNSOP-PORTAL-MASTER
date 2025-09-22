export const environment = {
  production: false,
  domain: 'https://localhost',
  globalApi: 'https://devgwapp.southsudansafetynet.info/mis_server/',
  portals: {
    master: 'https://localhost:4010',
    beneficiary: 'https://localhost:4020',
    payment: 'https://localhost:4030',
    grm: 'https://localhost:4040',
    report: 'https://localhost:4050',
  },
  msalConfig: {
    auth: {
      clientId: 'bcb572c3-15d2-4575-9dfc-edae57b125b9',
      authority:
        'https://login.microsoftonline.com/4a9fe01e-5c9c-4cb8-b299-fb5211533420',
      redirectUri: 'https://localhost:4010/',
      postLogoutRedirectUri: 'https://localhost:4010',
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    },
  },
  authBackend: 'https://devgwapp.southsudansafetynet.info/mis_auth',
  cookie_name:'mis_ta'
};
