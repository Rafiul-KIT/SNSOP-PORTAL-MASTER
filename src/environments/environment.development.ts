export const environment = {
  production: false,
  domain: "localhost",
  globalApi: 'http://api.snsopmis.com:8000/services',
  portals: {
    master: "http://localhost:4010/",
    beneficiary: "http://localhost:4020/",
    payment: "http://localhost:4030/",
    grm: "http://localhost:4040/",
    report: "http://localhost:4050/",
  },
  msalConfig: {
    auth: {
      clientId: '28e228a5-45c6-41c4-aa70-800a5394d072',
      authority: 'https://login.microsoftonline.com/97ad2261-cae6-421b-bd59-61a96a159203',
      redirectUri: 'http://localhost:4010/',
      postLogoutRedirectUri: 'http://localhost:4010/'
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    }
  },
  authBackend: 'http://devteam.karoothitbd.com:8088/mis_auth'
};
