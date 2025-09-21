export const environment = {
  production: false,
  domain: 'http://localhost',
  globalApi: 'http://devteam.karoothitbd.com:8088/mis_server/',
  portals: {
    master: 'http://localhost:4010',
    beneficiary: 'http://localhost:4020',
    payment: 'http://localhost:4030',
    grm: 'http://localhost:4040',
    report: 'http://localhost:4050',
  },
  msalConfig: {
    auth: {
      clientId: 'f33243cb-5b62-4850-984b-96f75e9cdce4',
      authority:
        'https://login.microsoftonline.com/4a9fe01e-5c9c-4cb8-b299-fb5211533420',
      redirectUri: 'http://localhost:4010',
      postLogoutRedirectUri: 'http://localhost:4010',
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    },
  },
  authBackend: 'http://devteam.karoothitbd.com:8088/mis_auth/',
  cookie_name:'mis_ta'
};
