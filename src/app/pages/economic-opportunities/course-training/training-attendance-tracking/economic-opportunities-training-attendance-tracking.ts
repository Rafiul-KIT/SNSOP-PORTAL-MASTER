import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabel } from 'primeng/floatlabel';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { RadioButtonModule } from 'primeng/radiobutton';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { Loader } from '../../../../components/loader/loader';
import { ApiService } from '../../../../../services/api.service';
import { IdName, LookupService } from '../../../../../services/lookup.service';

interface AttendanceLocationFilters {
  stateId: string | number | null;
  countyId: string | number | null;
  payamId: string | number | null;
  bomaId: string | number | null;
}

interface AttendanceSearchFilters extends AttendanceLocationFilters {}

interface BeneficiaryRecord {
  beneficiaryId: number;
  householdNumber: string;
  respondentFullName: string;
  phoneNumber: string;
  age: number;
  gender: string;
  registrationPhase: string;
  selectionCriteria: string;
}

interface BeneficiaryListResponse {
  beneficiaryEconOpList?: BeneficiaryRecord[] | null;
  total?: number | null;
  totalPages?: number | null;
}

interface CourseOption {
  id: number;
  courseName: string;
  courseCode: string;
  courseDuration: number;
}

interface CourseListResponse {
  code?: number | string | null;
  message?: string | null;
  content?: CourseOption[] | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  totalElements?: number | null;
}

interface AttendanceDraft {
  courseId: number;
  beneficiaryId: number;
  classAttendanceDate: string;
  presentInClass: boolean | null;
  classMissReason: string;
}

interface AttendanceEntryRow extends AttendanceDraft {
  householdNumber: string;
  respondentFullName: string;
  phoneNumber: string;
  age: number;
  gender: string;
  registrationPhase: string;
  selectionCriteria: string;
}

interface AttendanceRecord {
  id: number;
  courseId: number;
  beneficiaryId: number;
  classAttendanceDate: string;
  presentInClass: boolean;
  classMissReason: string;
}

interface CourseDetailsRecord {
  id: number;
  courseId: number;
  courseCode: string;
  classHoldingDate: string;
  classDurationInMinutes: number;
}

interface CourseDetailsListResponse {
  code?: number | string | null;
  message?: string | null;
  content?: CourseDetailsRecord[] | null;
}

interface AttendanceSearchResponse {
  code?: number | string | null;
  message?: string | null;
  content?: AttendanceRecord[] | AttendanceRecord | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  totalElements?: number | null;
  total?: number | null;
  totalPages?: number | null;
}

@Component({
  selector: 'app-economic-opportunities-training-attendance-tracking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbModule,
    ButtonModule,
    CheckboxModule,
    DatePickerModule,
    FloatLabel,
    Loader,
    Paginator,
    RadioButtonModule,
    Select,
    TableModule,
    TextareaModule,
    Toast,
  ],
  providers: [MessageService],
  templateUrl: './economic-opportunities-training-attendance-tracking.html',
  styleUrl: './economic-opportunities-training-attendance-tracking.scss',
})
export class EconomicOpportunitiesTrainingAttendanceTracking implements OnInit {
  private readonly beneficiaryEndpoint = '/api/beneficiary/getBeneficiaryForEconOp';
  private readonly courseEndpoint = '/api/econ-op/course/get';
  private readonly courseDetailsEndpoint = '/api/econ-op/course-detail/get';
  private readonly saveEndpoint = '/api/econ-op/course-attendance/save';
  private readonly attendanceSearchEndpoint = '/api/econ-op/course-attendance/get';
  private readonly validCourseCodes = new Set(['FINLIT', 'LIVETECH', 'LIFESKILL', 'SAVINGS']);

  isLoading = false;
  isLoadingCourses = false;
  isLoadingBeneficiaries = false;
  isSearchingAttendance = false;
  isSaving = false;
  activeStep: 'filters' | 'beneficiaries' | 'attendance' | 'search' = 'filters';

  states: IdName[] = [];
  counties: IdName[] = [];
  payams: IdName[] = [];
  bomas: IdName[] = [];

  searchStates: IdName[] = [];
  searchCounties: IdName[] = [];
  searchPayams: IdName[] = [];
  searchBomas: IdName[] = [];

  courses: CourseOption[] = [];
  beneficiaries: BeneficiaryRecord[] = [];
  selectedBeneficiaries: BeneficiaryRecord[] = [];
  attendanceRows: AttendanceEntryRow[] = [];
  attendanceSearchResults: AttendanceRecord[] = [];

  beneficiaryFilters: AttendanceLocationFilters = this.createDefaultLocationFilters();
  attendanceSearchFilters: AttendanceSearchFilters = this.createDefaultLocationFilters();

  selectedCourseId: number | null = null;
  attendanceDate: Date | null = null;

  beneficiaryCurrentPage = 0;
  beneficiaryPageSize = 10;
  beneficiaryTotalRecords = 0;

  searchCurrentPage = 0;
  searchPageSize = 10;
  searchTotalRecords = 0;

  readonly presenceOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ];

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Course Training' },
    { label: 'Training And Attendance Tracking', icon: 'fas fa-user-check' },
  ];

  constructor(
    private api: ApiService,
    private lookupService: LookupService,
    private cdr: ChangeDetectorRef,
    private msg: MessageService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();
      await Promise.all([this.loadStates(), this.loadSearchStates(), this.loadCourses()]);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async loadStates(): Promise<void> {
    try {
      this.states = await this.lookupService.getStateList();
    } catch (err) {
      console.error('Failed to load states', err);
      this.showError('Unable to load states.');
    }
  }

  async loadSearchStates(): Promise<void> {
    try {
      this.searchStates = await this.lookupService.getStateList();
    } catch (err) {
      console.error('Failed to load search states', err);
      this.showError('Unable to load search states.');
    }
  }

  async onStateChange(): Promise<void> {
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.beneficiaryFilters.countyId = null;
    this.beneficiaryFilters.payamId = null;
    this.beneficiaryFilters.bomaId = null;
    this.resetBeneficiarySelection();

    if (!this.beneficiaryFilters.stateId) return;

    try {
      this.counties = await this.lookupService.getCountyListByStateId(this.beneficiaryFilters.stateId);
    } catch (err) {
      console.error('Failed to load counties', err);
      this.showError('Unable to load counties.');
    }
  }

  async onCountyChange(): Promise<void> {
    this.payams = [];
    this.bomas = [];
    this.beneficiaryFilters.payamId = null;
    this.beneficiaryFilters.bomaId = null;
    this.resetBeneficiarySelection();

    if (!this.beneficiaryFilters.countyId) return;

    try {
      this.payams = await this.lookupService.getPayamListByCountyId(this.beneficiaryFilters.countyId);
    } catch (err) {
      console.error('Failed to load payams', err);
      this.showError('Unable to load payams.');
    }
  }

  async onPayamChange(): Promise<void> {
    this.bomas = [];
    this.beneficiaryFilters.bomaId = null;
    this.resetBeneficiarySelection();

    if (!this.beneficiaryFilters.payamId) return;

    try {
      this.bomas = await this.lookupService.getBomaListByPayamId(this.beneficiaryFilters.payamId);
    } catch (err) {
      console.error('Failed to load bomas', err);
      this.showError('Unable to load bomas.');
    }
  }

  async onSearchStateChange(): Promise<void> {
    this.searchCounties = [];
    this.searchPayams = [];
    this.searchBomas = [];
    this.attendanceSearchFilters.countyId = null;
    this.attendanceSearchFilters.payamId = null;
    this.attendanceSearchFilters.bomaId = null;
    this.resetSearchResults();

    if (!this.attendanceSearchFilters.stateId) return;

    try {
      this.searchCounties = await this.lookupService.getCountyListByStateId(this.attendanceSearchFilters.stateId);
    } catch (err) {
      console.error('Failed to load search counties', err);
      this.showError('Unable to load counties.');
    }
  }

  async onSearchCountyChange(): Promise<void> {
    this.searchPayams = [];
    this.searchBomas = [];
    this.attendanceSearchFilters.payamId = null;
    this.attendanceSearchFilters.bomaId = null;
    this.resetSearchResults();

    if (!this.attendanceSearchFilters.countyId) return;

    try {
      this.searchPayams = await this.lookupService.getPayamListByCountyId(this.attendanceSearchFilters.countyId);
    } catch (err) {
      console.error('Failed to load search payams', err);
      this.showError('Unable to load payams.');
    }
  }

  async onSearchPayamChange(): Promise<void> {
    this.searchBomas = [];
    this.attendanceSearchFilters.bomaId = null;
    this.resetSearchResults();

    if (!this.attendanceSearchFilters.payamId) return;

    try {
      this.searchBomas = await this.lookupService.getBomaListByPayamId(this.attendanceSearchFilters.payamId);
    } catch (err) {
      console.error('Failed to load search bomas', err);
      this.showError('Unable to load bomas.');
    }
  }

  async loadCourses(): Promise<void> {
    try {
      this.isLoadingCourses = true;
      this.cdr.detectChanges();

      const res = await this.api.GET<CourseListResponse>(this.courseEndpoint, {
        pageNumber: 0,
        pageSize: 500,
      });
      const data = res?.data;

      if (!this.isApiSuccess(data, Array.isArray(data?.content))) {
        throw new Error(data?.message || 'Unable to load courses');
      }

      const content = Array.isArray(data?.content) ? data.content : [];
      this.courses = content.map((item) => ({
        id: Number(item.id) || 0,
        courseName: item.courseName ?? '',
        courseCode: item.courseCode ?? '',
        courseDuration: Number(item.courseDuration) || 0,
      }));
    } catch (err) {
      console.error('Failed to load courses', err);
      this.courses = [];
      this.showError('Unable to load course list.');
    } finally {
      this.isLoadingCourses = false;
      this.cdr.detectChanges();
    }
  }

  async searchBeneficiaries(): Promise<void> {
    if (!this.beneficiaryFilters.bomaId) {
      this.showWarn('Boma Required', 'Please select state, county, payam, and boma before searching.');
      return;
    }

    this.activeStep = 'beneficiaries';
    this.beneficiaryCurrentPage = 0;
    await this.loadBeneficiaries();
  }

  async onBeneficiaryPageChange(event: PaginatorState): Promise<void> {
    this.beneficiaryCurrentPage = event.page ?? 0;
    this.beneficiaryPageSize = event.rows ?? this.beneficiaryPageSize;
    await this.loadBeneficiaries();
  }

  generateAttendanceRows(): void {
    if (!this.selectedCourseId) {
      this.showWarn('Course Required', 'Please select a course before preparing attendance.');
      return;
    }

    if (!this.attendanceDate) {
      this.showWarn('Date Required', 'Please select the attendance date before preparing attendance.');
      return;
    }

    if (!this.selectedBeneficiaries.length) {
      this.showWarn('Beneficiaries Required', 'Please select at least one beneficiary.');
      return;
    }

    const attendanceDate = this.formatDate(this.attendanceDate);
    this.attendanceRows = this.selectedBeneficiaries.map((item) => ({
      id: Number(item.beneficiaryId) || 0,
      courseId: this.selectedCourseId ?? 0,
      beneficiaryId: Number(item.beneficiaryId) || 0,
      classAttendanceDate: attendanceDate,
      presentInClass: true,
      classMissReason: '',
      householdNumber: item.householdNumber ?? '',
      respondentFullName: item.respondentFullName ?? '',
      phoneNumber: item.phoneNumber ?? '',
      age: Number(item.age) || 0,
      gender: item.gender ?? '',
      registrationPhase: item.registrationPhase ?? '',
      selectionCriteria: item.selectionCriteria ?? '',
    }));
    this.activeStep = 'attendance';
  }

  onAttendancePresenceChange(row: AttendanceEntryRow): void {
    if (row.presentInClass === true) {
      row.classMissReason = '';
    }
  }

  async saveAttendance(): Promise<void> {
    if (!this.attendanceRows.length) {
      this.showWarn('No Attendance Rows', 'Please prepare attendance rows before saving.');
      return;
    }

    const invalidRow = this.attendanceRows.find(
      (row) => row.presentInClass === null || (row.presentInClass === false && !row.classMissReason.trim())
    );

    if (invalidRow) {
      this.showWarn(
        'Attendance Incomplete',
        'Please select present yes/no for all beneficiaries, and provide a reason when a beneficiary is absent.'
      );
      return;
    }

    const validCourseDates = await this.loadValidCourseDates(this.selectedCourseId);
    for (const row of this.attendanceRows) {
      const validation = this.isValidData(row, validCourseDates);
      if (!validation.isValid) {
        this.showWarn(
          'Validation Error',
          `Row for ${row.respondentFullName || row.householdNumber || row.beneficiaryId}: ${validation.errorMessage}`
        );
        return;
      }
    }

    const payload: AttendanceDraft[] = this.attendanceRows.map((row) => ({
      courseId: Number(row.courseId) || 0,
      beneficiaryId: Number(row.beneficiaryId) || 0,
      classAttendanceDate: row.classAttendanceDate,
      presentInClass: !!row.presentInClass,
      classMissReason: row.presentInClass ? '' : row.classMissReason.trim(),
    }));

    try {
      this.isSaving = true;
      this.cdr.detectChanges();

      const res = await this.api.POST(this.saveEndpoint, payload);
      const data = res?.data;

      if (!this.isApiSuccess(data, !!data)) {
        throw new Error(data?.message || 'Unable to save attendance');
      }

      this.msg.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Training attendance saved successfully.',
      });

      this.activeStep = 'search';
      await this.searchAttendance();
    } catch (err) {
      console.error('Failed to save attendance', err);
      this.showError(this.extractErrorMessage(err, 'Unable to save attendance.'));
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async searchAttendance(): Promise<void> {
    if (!this.attendanceSearchFilters.bomaId) {
      this.showWarn('Boma Required', 'Please select state, county, payam, and boma before searching attendance.');
      return;
    }

    this.searchCurrentPage = 0;
    await this.loadAttendanceResults();
  }

  async onAttendanceSearchPageChange(event: PaginatorState): Promise<void> {
    this.searchCurrentPage = event.page ?? 0;
    this.searchPageSize = event.rows ?? this.searchPageSize;
    await this.loadAttendanceResults();
  }

  resetBeneficiaryFilters(): void {
    this.beneficiaryFilters = this.createDefaultLocationFilters();
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.resetBeneficiarySelection();
    this.activeStep = 'filters';
  }

  resetSearchFilters(): void {
    this.attendanceSearchFilters = this.createDefaultLocationFilters();
    this.searchCounties = [];
    this.searchPayams = [];
    this.searchBomas = [];
    this.resetSearchResults();
  }

  get selectedCourseCode(): string {
    return this.courses.find((course) => course.id === this.selectedCourseId)?.courseCode ?? '';
  }

  private get selectedCourse(): CourseOption | null {
    return this.courses.find((course) => course.id === this.selectedCourseId) ?? null;
  }

  private async loadBeneficiaries(): Promise<void> {
    if (!this.beneficiaryFilters.bomaId) return;

    try {
      this.isLoadingBeneficiaries = true;
      this.cdr.detectChanges();

      const params = {
        bomaId: this.beneficiaryFilters.bomaId,
        page: this.beneficiaryCurrentPage,
        size: this.beneficiaryPageSize,
      };

      const res = await this.api.GET<BeneficiaryListResponse>(this.beneficiaryEndpoint, params);
      const data = res?.data;
      const content = Array.isArray(data?.beneficiaryEconOpList) ? data.beneficiaryEconOpList : [];

      this.beneficiaries = content.map((item) => ({
        beneficiaryId: Number(item.beneficiaryId) || 0,
        householdNumber: item.householdNumber ?? '',
        respondentFullName: item.respondentFullName ?? '',
        phoneNumber: item.phoneNumber ?? '',
        age: Number(item.age) || 0,
        gender: item.gender ?? '',
        registrationPhase: item.registrationPhase ?? '',
        selectionCriteria: item.selectionCriteria ?? '',
      }));
      this.beneficiaryTotalRecords = Number(data?.total ?? content.length ?? 0);
      this.syncSelectedBeneficiaries();
    } catch (err) {
      console.error('Failed to load beneficiaries', err);
      this.beneficiaries = [];
      this.beneficiaryTotalRecords = 0;
      this.showError('Unable to load beneficiary list.');
    } finally {
      this.isLoadingBeneficiaries = false;
      this.cdr.detectChanges();
    }
  }

  private async loadAttendanceResults(): Promise<void> {
    if (!this.attendanceSearchFilters.bomaId) return;

    try {
      this.isSearchingAttendance = true;
      this.cdr.detectChanges();

      const params = {
        offset: this.searchCurrentPage * this.searchPageSize,
        pageSize: this.searchPageSize,
      };

      const payload = {
        stateId: this.attendanceSearchFilters.stateId,
        countyId: this.attendanceSearchFilters.countyId,
        payamId: this.attendanceSearchFilters.payamId,
        bomaId: this.attendanceSearchFilters.bomaId,
      };

      const res = await this.api.POST<AttendanceSearchResponse>(
        this.attendanceSearchEndpoint,
        payload,
        'global',
        { params }
      );

      const data = res?.data;
      const list = this.extractAttendanceList(data);

      this.attendanceSearchResults = list.map((item) => ({
        id: Number(item.id) || 0,
        courseId: Number(item.courseId) || 0,
        beneficiaryId: Number(item.beneficiaryId) || 0,
        classAttendanceDate: item.classAttendanceDate ?? '',
        presentInClass: !!item.presentInClass,
        classMissReason: item.classMissReason ?? '',
      }));
      this.searchTotalRecords = this.extractAttendanceTotal(data, this.attendanceSearchResults.length);
    } catch (err) {
      console.error('Failed to load attendance results', err);
      this.attendanceSearchResults = [];
      this.searchTotalRecords = 0;
      this.showError('Unable to load attendance list.');
    } finally {
      this.isSearchingAttendance = false;
      this.cdr.detectChanges();
    }
  }

  private async loadValidCourseDates(courseId: number | null): Promise<Set<string>> {
    if (!courseId) return new Set<string>();

    try {
      const res = await this.api.GET<CourseDetailsListResponse>(this.courseDetailsEndpoint, {
        courseId,
        offset: 0,
        pageSize: 1000,
      });
      const data = res?.data;

      if (!this.isApiSuccess(data, Array.isArray(data?.content))) {
        throw new Error(data?.message || 'Unable to load valid course dates');
      }

      const content = Array.isArray(data?.content) ? data.content : [];
      return new Set(
        content
          .map((detail) => this.normalizeDateString(detail.classHoldingDate))
          .filter((date): date is string => !!date)
      );
    } catch (err) {
      console.error('Failed to load valid course dates', err);
      return new Set<string>();
    }
  }

  private isValidData(
    row: AttendanceEntryRow,
    validCourseDates: Set<string>
  ): { isValid: boolean; errorMessage: string } {
    const householdNumber = row.householdNumber.trim();
    if (!householdNumber) {
      return { isValid: false, errorMessage: 'Household Number is required.' };
    }

    const course = this.selectedCourse;
    const courseCode = (course?.courseCode ?? '').trim().toUpperCase();
    if (!courseCode) {
      return { isValid: false, errorMessage: 'Course Code is required.' };
    }

    if (!this.validCourseCodes.has(courseCode)) {
      return { isValid: false, errorMessage: 'Course Code must be one of: FINLIT, LIVETECH, LIFESKILL, SAVINGS.' };
    }

    if ((course?.courseDuration ?? 0) <= 0) {
      return { isValid: false, errorMessage: 'Course Duration must be positive.' };
    }

    const rowWithClassCounts = row as AttendanceEntryRow & {
      classesAttended?: number | null;
      classesHeld?: number | null;
    };
    const classesAttended = this.normalizeNullableNumber(rowWithClassCounts.classesAttended);
    const classesHeld = this.normalizeNullableNumber(rowWithClassCounts.classesHeld);
    if (classesAttended != null && classesHeld != null && classesAttended > classesHeld) {
      return { isValid: false, errorMessage: 'Classes Attended cannot exceed Classes Held.' };
    }

    const classAttendanceDate = this.normalizeDateString(row.classAttendanceDate);
    if (!classAttendanceDate || !validCourseDates.has(classAttendanceDate)) {
      return { isValid: false, errorMessage: 'Class Attendance Date must be within valid course dates for that course.' };
    }

    return { isValid: true, errorMessage: '' };
  }

  private extractAttendanceList(data: AttendanceSearchResponse | AttendanceRecord[] | AttendanceRecord | null | undefined): AttendanceRecord[] {
    if (Array.isArray(data)) {
      return data;
    }

    const wrappedData = this.asAttendanceSearchResponse(data);

    if (Array.isArray(wrappedData?.content)) {
      return wrappedData.content;
    }

    if (wrappedData?.content && typeof wrappedData.content === 'object') {
      return [wrappedData.content];
    }

    if (data && typeof data === 'object' && 'beneficiaryId' in data && 'courseId' in data) {
      return [data as AttendanceRecord];
    }

    return [];
  }

  private extractAttendanceTotal(
    data: AttendanceSearchResponse | AttendanceRecord[] | AttendanceRecord | null | undefined,
    fallback: number
  ): number {
    if (Array.isArray(data)) {
      return data.length;
    }

    const wrappedData = this.asAttendanceSearchResponse(data);
    return Number(wrappedData?.totalElements ?? wrappedData?.total ?? fallback ?? 0);
  }

  private asAttendanceSearchResponse(
    data: AttendanceSearchResponse | AttendanceRecord[] | AttendanceRecord | null | undefined
  ): AttendanceSearchResponse | null {
    if (!data || Array.isArray(data)) {
      return null;
    }

    if ('content' in data || 'total' in data || 'totalElements' in data || 'code' in data) {
      return data as AttendanceSearchResponse;
    }

    return null;
  }

  private syncSelectedBeneficiaries(): void {
    if (!this.selectedBeneficiaries.length) return;

    const selectedMap = new Map(
      this.selectedBeneficiaries.map((item) => [Number(item.beneficiaryId), item])
    );

    this.selectedBeneficiaries = [
      ...this.selectedBeneficiaries.filter(
        (selected) => !this.beneficiaries.some((item) => item.beneficiaryId === selected.beneficiaryId)
      ),
      ...this.beneficiaries.filter((item) => selectedMap.has(Number(item.beneficiaryId))),
    ];
  }

  private resetBeneficiarySelection(): void {
    this.beneficiaries = [];
    this.selectedBeneficiaries = [];
    this.attendanceRows = [];
    this.selectedCourseId = null;
    this.attendanceDate = null;
    this.beneficiaryCurrentPage = 0;
    this.beneficiaryTotalRecords = 0;
  }

  private resetSearchResults(): void {
    this.attendanceSearchResults = [];
    this.searchCurrentPage = 0;
    this.searchTotalRecords = 0;
  }

  private createDefaultLocationFilters(): AttendanceLocationFilters {
    return {
      stateId: null,
      countyId: null,
      payamId: null,
      bomaId: null,
    };
  }

  private formatDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizeDateString(value: string | null | undefined): string {
    if (!value) return '';
    const [date] = value.split('T');
    return date.trim();
  }

  private normalizeNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private isApiSuccess(data: { code?: number | string | null } | null | undefined, fallback = false): boolean {
    if (!data) return fallback;
    if (data.code === undefined || data.code === null || data.code === '') return fallback;
    const code = Number(data.code);
    return code === 0 || code === 200;
  }

  private extractErrorMessage(error: any, fallback: string): string {
    return (
      error?.response?.data?.message ||
      error?.message ||
      fallback
    );
  }

  private showWarn(summary: string, detail: string): void {
    this.msg.add({
      severity: 'warn',
      summary,
      detail,
    });
  }

  private showError(detail: string): void {
    this.msg.add({
      severity: 'error',
      summary: 'Error',
      detail,
    });
  }
}
