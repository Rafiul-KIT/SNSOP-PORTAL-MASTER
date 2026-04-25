import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './components/not-found/not-found';
import { Home } from './pages/home/home';
import { Profile } from './pages/profile/profile';
import { Landing } from './pages/landing/landing';
import { routeGuard } from './route.guard';

import { Users } from './pages/user-management/users/users';
import { Register } from './pages/user-management/register/register';
import { Role } from './pages/user-management/role/role';
import { RoleLink } from './pages/user-management/role-link/role-link';
import { AddNewRole } from './pages/user-management/add-new-role/add-new-role';
import { Unauthorized } from './components/unauthorized/unauthorized';
import { UnderConstruction } from './pages/under-construction/under-construction';
import { SurveyCto } from './pages/survey-cto/survey-cto/survey-cto';
import { SurveyCtoImport } from './pages/survey-cto/survey-cto-import/survey-cto-import';
import { SurveyCtoReport } from './pages/survey-cto/survey-cto-report/survey-cto-report';
import { SurveyCtoDashboard } from './pages/survey-cto-dashboard/survey-cto-dashboard';
import { BeneficiaryEnrolmentSummary } from './pages/monitoring-evaluation/beneficiary-enrolment-summary/beneficiary-enrolment-summary';
import { CashTransferSummary } from './pages/monitoring-evaluation/cash-transfer-summary/cash-transfer-summary';
import { ResultFramework } from './pages/monitoring-evaluation/result-framework/result-framework';
import { EconomicOpportunitiesDashboard } from './pages/economic-opportunities/dashboard/economic-opportunities-dashboard';
import { EconomicOpportunitiesTemplateImporting } from './pages/economic-opportunities/template-importing/economic-opportunities-template-importing';
import { EconomicOpportunitiesHouseholdGroupView } from './pages/economic-opportunities/household-group-view/economic-opportunities-household-group-view';
import { EconomicOpportunitiesAuditRecordDownload } from './pages/economic-opportunities/audit-record-download/economic-opportunities-audit-record-download';
import { Metabase } from './pages/metabase/metabase';



export const routes: Routes = [
  {
    path: 'landing',
    component: Landing,
  },
  {
    path: 'home',
    component: Home,
    // canActivateChild: [routeGuard],
    children: [
      {
        path: 'portals',
        component: Dashboard,
      },
      {
        path: 'profile',
        component: Profile,
      },
      {
        path: 'metabase',
        component: Metabase,
      },
      { path: '', pathMatch: 'full', redirectTo: 'portals' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'landing' },
  {
    path: 'user-management',
    canActivate: [routeGuard],
    children: [
      { path: 'users', component: Users, canActivate: [routeGuard], },
      { path: 'register', component: Register, canActivate: [routeGuard], },
      { path: 'roles', component: Role, canActivate: [routeGuard], },
      { path: 'role-link', component: RoleLink },
      { path: 'add-new-role', component: AddNewRole },
      { path: '', redirectTo: 'users', pathMatch: 'full' }
    ],
  },
  { path: 'survey-cto-export',
    canActivate: [routeGuard],
    component: SurveyCto
  },
  { path: 'survey-cto-import',
    canActivate: [routeGuard],
    component: SurveyCtoImport
  },
  { path: 'survey-cto-report',
    canActivate: [routeGuard],
    component: SurveyCtoReport
  },
  { path: 'cto-dashboard',
    canActivate: [routeGuard],
    component: SurveyCtoDashboard
  },
  {
    path: 'help-desk',
    canActivate: [routeGuard],
    loadChildren: () => import('./pages/help-desk/help-desk.routes').then(m => m.HELP_DESK_ROUTES)
  },
  {
     path: 'monitoring-evaluation',
    canActivate: [routeGuard],
    children: [
      { path: 'beneficiary-enrolment-summary', component: BeneficiaryEnrolmentSummary, canActivate: [routeGuard], },
      { path: 'cash-transfer-summary', component: CashTransferSummary, canActivate: [routeGuard], },
      { path: 'result-framework', component: ResultFramework, canActivate: [routeGuard], },
      { path: '', redirectTo: 'beneficiary-enrolment-summary', pathMatch: 'full' }
    ]
  },
  {
     path: 'economic-opportunities',
    canActivate: [routeGuard],
    children: [
      { path: 'dashboard', component: EconomicOpportunitiesDashboard, canActivate: [routeGuard], },
      { path: 'template-importing', component: EconomicOpportunitiesTemplateImporting, canActivate: [routeGuard], },
      { path: 'household-group-view', component: EconomicOpportunitiesHouseholdGroupView, canActivate: [routeGuard], },
      { path: 'audit-record-download', component: EconomicOpportunitiesAuditRecordDownload, canActivate: [routeGuard], },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: 'unauthorized', component: Unauthorized },
  { path: 'under-construction', component: UnderConstruction },
  {
    path: '**',
    component: NotFound,
  },
];
