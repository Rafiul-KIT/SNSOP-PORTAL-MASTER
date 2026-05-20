import { UnderConstruction } from "../app/pages/under-construction/under-construction";

export const environment = {
  production: true,
  env: 'prod',
  useHash: true,
  domain: 'https://mis.southsudansafetynet.info',
  globalApi: 'https://gwapp.southsudansafetynet.info/mis_server/',
  portals: {
    master: 'https://mis.southsudansafetynet.info/v2/',
    beneficiary: 'https://mis.southsudansafetynet.info/v2/beneficiary',
    payment: 'https://mis.southsudansafetynet.info/v2/payment',
    grm: 'https://mis.southsudansafetynet.info/v2/grm',
    masterSettings: 'https://mis.southsudansafetynet.info/v2/#/user-management/users',
    surveyCTO: 'https://mis.southsudansafetynet.info/v2/#/cto-dashboard',
    mNe: 'https://mis.southsudansafetynet.info/v2/#/monitoring-evaluation/beneficiary-enrolment-summary',
    report: 'https://mis.southsudansafetynet.info/v2/#/home/metabase',
    economicOpportunities: 'https://mis.southsudansafetynet.info/v2/#/economic-opportunities/dashboard',
    UnderConstruction: 'https://mis.southsudansafetynet.info/v2/#/under-construction',
    helpDesk: 'https://mis.southsudansafetynet.info/v2/#/help-desk/dashboard',
    dms: 'https://mis.southsudansafetynet.info/v2/dms',
  },
  msalConfig: {
    auth: {
      clientId: 'ff3e857a-2a87-4b1c-9290-bdca74139ce6',
      authority: 'https://login.microsoftonline.com/4a9fe01e-5c9c-4cb8-b299-fb5211533420',
      redirectUri: 'https://mis.southsudansafetynet.info/v2/',
      postLogoutRedirectUri: 'https://mis.southsudansafetynet.info/v2/'
    },
    cache: {
      cacheLocation: 'cookie',
      storeAuthStateInCookie: true,
    }
  },
  authBackend: 'https://gwapp.southsudansafetynet.info/mis_auth',
  cookie_name:'mis_ta'
};
