import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { Loader } from '../../../../components/loader/loader';
import { ApiService } from '../../../../../services/api.service';

interface CourseOption {
  id: number;
  courseName: string;
  courseCode: string;
}

interface CourseListResponse {
  code?: number | string | null;
  message?: string | null;
  content?: CourseOption[] | null;
}

interface CourseDetailsFormModel {
  courseId: number | null;
  courseCode: string;
  classHoldingDate: Date | null;
  classDurationInMinutes: number | null;
}

interface CourseDetailsSearchModel {
  courseId: number | null;
  courseCode: string;
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
  pageNumber?: number | null;
  pageSize?: number | null;
  totalElements?: number | null;
}

@Component({
  selector: 'app-economic-opportunities-course-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbModule,
    ButtonModule,
    DatePickerModule,
    FloatLabel,
    InputText,
    Loader,
    Paginator,
    Select,
    TableModule,
    Toast,
  ],
  providers: [MessageService],
  templateUrl: './economic-opportunities-course-details.html',
  styleUrl: './economic-opportunities-course-details.scss',
})
export class EconomicOpportunitiesCourseDetails implements OnInit {
  private readonly courseEndpoint = '/api/econ-op/course/get';
  private readonly saveEndpoint = '/api/econ-op/course-details/save';
  private readonly getEndpoint = '/api/econ-op/course-detail/get';

  isLoading = false;
  isSaving = false;
  isSearching = false;
  isLoadingCourses = false;

  courses: CourseOption[] = [];
  courseDetails: CourseDetailsRecord[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  form: CourseDetailsFormModel = this.createDefaultForm();
  searchFilters: CourseDetailsSearchModel = this.createDefaultSearchFilters();

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Course Training' },
    { label: 'Course Details', icon: 'fas fa-info-circle' },
  ];

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private msg: MessageService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadCourses();
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
      }));

      this.courseDetails = [];
      this.totalRecords = 0;
    } catch (err) {
      console.error('Failed to load courses', err);
      this.showError('Unable to load course list.');
      this.courses = [];
    } finally {
      this.isLoadingCourses = false;
      this.cdr.detectChanges();
    }
  }

  onCourseChange(): void {
    const selectedCourse = this.courses.find((course) => course.id === this.form.courseId);
    this.form.courseCode = selectedCourse?.courseCode ?? '';
  }

  onSearchCourseChange(): void {
    const selectedCourse = this.courses.find((course) => course.id === this.searchFilters.courseId);
    this.searchFilters.courseCode = selectedCourse?.courseCode ?? '';
  }

  async saveCourseDetails(): Promise<void> {
    const validation = this.isValidData(this.form, this.courses);
    if (!validation.isValid) {
      this.msg.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: validation.errorMessage,
      });
      return;
    }

    const classHoldingDate = this.form.classHoldingDate;
    const classDurationInMinutes = this.normalizeNullableNumber(this.form.classDurationInMinutes);

    if (!classHoldingDate || classDurationInMinutes == null) {
      return;
    }

    const payload = [
      {
        id: 0,
        courseId: this.form.courseId,
        courseCode: this.form.courseCode.trim(),
        classHoldingDate: this.formatDate(classHoldingDate),
        classDurationInMinutes,
      },
    ];

    try {
      this.isSaving = true;
      this.cdr.detectChanges();

      const res = await this.api.POST(this.saveEndpoint, payload);
      const data = res?.data;

      if (!this.isApiSuccess(data)) {
        throw new Error(data?.message || 'Unable to save course details');
      }

      this.msg.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Course details saved successfully.',
      });

      const selectedCourseId = this.form.courseId;
      const selectedCourseCode = this.form.courseCode;
      this.form = this.createDefaultForm();
      this.form.courseId = selectedCourseId;
      this.form.courseCode = selectedCourseCode;
      await this.searchCourseDetails();
    } catch (err) {
      console.error('Failed to save course details', err);
      this.showError('Unable to save course details.');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async searchCourseDetails(): Promise<void> {
    if (!this.searchFilters.courseId) {
      this.msg.add({
        severity: 'warn',
        summary: 'Course Required',
        detail: 'Please select a course before searching.',
      });
      return;
    }

    this.currentPage = 0;
    await this.loadCourseDetails();
  }

  async onPageChange(event: PaginatorState): Promise<void> {
    this.currentPage = event.page ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
    await this.loadCourseDetails();
  }

  resetForm(): void {
    const selectedCourseId = this.form.courseId;
    const selectedCourseCode = this.form.courseCode;
    this.form = this.createDefaultForm();
    this.form.courseId = selectedCourseId;
    this.form.courseCode = selectedCourseCode;
  }

  resetSearch(): void {
    this.searchFilters = this.createDefaultSearchFilters();
    this.courseDetails = [];
    this.totalRecords = 0;
    this.currentPage = 0;
  }

  private async loadCourseDetails(): Promise<void> {
    if (!this.searchFilters.courseId) return;

    try {
      this.isLoading = true;
      this.isSearching = true;
      this.cdr.detectChanges();

      const params = {
        courseId: this.searchFilters.courseId,
        offset: this.currentPage * this.pageSize,
        pageSize: this.pageSize,
      };

      const res = await this.api.GET<CourseDetailsListResponse>(this.getEndpoint, params);
      const data = res?.data;

      const hasEmptyPayload =
        data?.code == null &&
        data?.message == null &&
        data?.content == null;

      if (!this.isApiSuccess(data, Array.isArray(data?.content) || hasEmptyPayload)) {
        throw new Error(data?.message || 'Unable to load course details');
      }

      const content = Array.isArray(data?.content) ? data.content : [];
      this.courseDetails = content.map((item) => ({
        id: Number(item.id) || 0,
        courseId: Number(item.courseId) || 0,
        courseCode: item.courseCode ?? '',
        classHoldingDate: item.classHoldingDate ?? '',
        classDurationInMinutes: Number(item.classDurationInMinutes) || 0,
      }));
      this.totalRecords = Number(data?.totalElements ?? content.length ?? 0);
      this.currentPage = Number(data?.pageNumber ?? this.currentPage ?? 0);
      this.pageSize = Number(data?.pageSize ?? this.pageSize ?? 10);
    } catch (err) {
      console.error('Failed to load course details', err);
      this.courseDetails = [];
      this.totalRecords = 0;
      this.showError('Unable to load course details data.');
    } finally {
      this.isLoading = false;
      this.isSearching = false;
      this.cdr.detectChanges();
    }
  }

  private createDefaultForm(): CourseDetailsFormModel {
    return {
      courseId: null,
      courseCode: '',
      classHoldingDate: null,
      classDurationInMinutes: null,
    };
  }

  private createDefaultSearchFilters(): CourseDetailsSearchModel {
    return {
      courseId: null,
      courseCode: '',
    };
  }

  private isValidData(
    detail: CourseDetailsFormModel,
    validCourseCode: CourseOption[]
  ): { isValid: boolean; errorMessage: string } {
    const courseCode = detail.courseCode.trim();

    if (!courseCode) {
      return { isValid: false, errorMessage: 'Course Code is required.' };
    }

    if (!validCourseCode.some((course) => course.courseCode === courseCode)) {
      return { isValid: false, errorMessage: 'Course Code must exist in the valid course list.' };
    }

    if (!detail.classHoldingDate) {
      return { isValid: false, errorMessage: 'Class Holding Date is required.' };
    }

    const classDuration = this.normalizeNullableNumber(detail.classDurationInMinutes);
    if (classDuration == null || classDuration <= 0) {
      return { isValid: false, errorMessage: 'Class Duration Minutes is required and must be greater than 0.' };
    }

    return { isValid: true, errorMessage: '' };
  }

  private normalizeNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private formatDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isApiSuccess(data: { code?: number | string | null } | null | undefined, fallback = false): boolean {
    if (!data) return fallback;
    if (data.code === undefined || data.code === null || data.code === '') return fallback;
    const code = Number(data.code);
    return code === 0 || code === 200;
  }

  private showError(detail: string): void {
    this.msg.add({
      severity: 'error',
      summary: 'Error',
      detail,
    });
  }
}
