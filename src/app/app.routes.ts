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
import { EconomicOpportunitiesTemplateUpload } from './pages/economic-opportunities/template-upload/economic-opportunities-template-upload';
import { EconomicOpportunitiesHouseholdGroupMapping } from './pages/economic-opportunities/household-group-mapping/economic-opportunities-household-group-mapping';
import { EconomicOpportunitiesAuditRecordDownload } from './pages/economic-opportunities/audit-record-download/economic-opportunities-audit-record-download';
import { EconomicOpportunitiesBeneficiaryRandomizationEnrollment } from './pages/economic-opportunities/beneficiary-randomization-enrollment/economic-opportunities-beneficiary-randomization-enrollment';
import { EconomicOpportunitiesHouseholdGroupView } from './pages/economic-opportunities/household-group-view/economic-opportunities-household-group-view';
import { EconomicOpportunitiesCourseEntity } from './pages/economic-opportunities/course-training/course-entity/economic-opportunities-course-entity';
import { EconomicOpportunitiesCourseDetails } from './pages/economic-opportunities/course-training/course-details/economic-opportunities-course-details';
import { EconomicOpportunitiesTrainingAttendanceTracking } from './pages/economic-opportunities/course-training/training-attendance-tracking/economic-opportunities-training-attendance-tracking';
import { Metabase } from './pages/metabase/metabase';
import { MneReports } from './pages/monitoring-evaluation/mne-reports/mne-reports';



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
      { path: 'reports', component: MneReports, canActivate: [routeGuard], },
      { path: '', redirectTo: 'beneficiary-enrolment-summary', pathMatch: 'full' }
    ]
  },
  {
     path: 'economic-opportunities',
    canActivate: [routeGuard],
    children: [
      { path: 'dashboard', component: EconomicOpportunitiesDashboard, canActivate: [routeGuard], },
      { path: 'template-importing', component: EconomicOpportunitiesTemplateImporting, canActivate: [routeGuard], },
      { path: 'template-upload', component: EconomicOpportunitiesTemplateUpload, canActivate: [routeGuard], },
      { path: 'household-group-mapping', component: EconomicOpportunitiesHouseholdGroupMapping, canActivate: [routeGuard], },
      { path: 'audit-log', component: EconomicOpportunitiesAuditRecordDownload, canActivate: [routeGuard], },
      { path: 'audit-record-download', redirectTo: 'audit-log', pathMatch: 'full' },
      {
        path: 'beneficiary-enrollment',
        canActivate: [routeGuard],
        children: [
          { path: 'beneficiary-randomization-enrollment', component: EconomicOpportunitiesBeneficiaryRandomizationEnrollment, canActivate: [routeGuard] },
          { path: 'household-group-view', component: EconomicOpportunitiesHouseholdGroupView, canActivate: [routeGuard] },
          { path: '', component: UnderConstruction, pathMatch: 'full' }
        ]
      },
      {
        path: 'course-training',
        canActivate: [routeGuard],
        children: [
          { path: 'course-entity', component: EconomicOpportunitiesCourseEntity, canActivate: [routeGuard] },
          { path: 'course-details', component: EconomicOpportunitiesCourseDetails, canActivate: [routeGuard] },
          { path: 'training-attendance-tracking', component: EconomicOpportunitiesTrainingAttendanceTracking, canActivate: [routeGuard] },
          { path: '', component: UnderConstruction, pathMatch: 'full' }
        ]
      },
      {
        path: 'others',
        canActivate: [routeGuard],
        children: [
          { path: 'business-plan-development', component: UnderConstruction, canActivate: [routeGuard] },
          { path: 'livelihood-grant-disbursement', component: UnderConstruction, canActivate: [routeGuard] },
          { path: 'financial-service-linkage-tracking', component: UnderConstruction, canActivate: [routeGuard] },
          { path: '', component: UnderConstruction, pathMatch: 'full' }
        ]
      },
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
