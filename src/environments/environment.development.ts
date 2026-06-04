export const environment = {
  production: false,
  env: 'local',
  useHash: false,
  domain: 'https://localhost',
  globalApi: 'https://devgwapp.southsudansafetynet.info/mis_server/',
  modelApi: 'https://devmismodel.southsudansafetynet.info/',
  portals: {
    master: 'https://localhost:4010',
    beneficiary: 'https://localhost:4020',
    payment: 'https://localhost:4030',
    grm: 'https://localhost:4040',
    masterSettings: 'https://localhost:4010/#/user-management/users',
    surveyCTO: 'https://localhost:4010/#/cto-dashboard',
    mNe: 'https://localhost:4010/#/monitoring-evaluation/beneficiary-enrolment-summary',
    report: 'https://localhost:4010/#/home/metabase',
    economicOpportunities: 'https://localhost:4010/#/economic-opportunities/dashboard',
    UnderConstruction: 'https://localhost:4010/#/under-construction',
    helpDesk: 'https://localhost:4010/#/help-desk/dashboard',
    dms: 'https://167.86.68.15:8086',
    automatedTargeting: 'https://localhost:4010/#/automated-targeting/dashboard',
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
