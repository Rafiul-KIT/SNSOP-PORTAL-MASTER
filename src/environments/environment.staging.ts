export const environment = {
  production: false,
  domain: 'http://devteam.karoothitbd.com',
  globalApi: 'http://devteam.karoothitbd.com:8088/mis_server',
  portals: {
    master: 'http://devteam.karoothitbd.com:8080/master',
    beneficiary: 'http://devteam.karoothitbd.com:8080/beneficiary',
    payment: 'http://devteam.karoothitbd.com:8080/payment',
    grm: 'http://devteam.karoothitbd.com:8080/grm',
    report: 'http://devteam.karoothitbd.com:8080/report',
  },
  msalConfig: {
    auth: {
      clientId: '28e228a5-45c6-41c4-aa70-800a5394d072',
      authority: 'https://login.microsoftonline.com/97ad2261-cae6-421b-bd59-61a96a159203',
      redirectUri: 'http://devteam.karoothitbd.com:8080/master',
      postLogoutRedirectUri: 'http://devteam.karoothitbd.com:8080/master'
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    }
  },
  authBackend: 'http://devteam.karoothitbd.com:8088/mis_auth'
};
