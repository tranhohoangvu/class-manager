'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Student,
  Plus,
  UploadSimple,
  FileXls,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  ArrowsClockwise,
  Eye,
  GenderMale,
  GenderFemale,
  DownloadSimple,
  ShieldCheck,
  ArrowsDownUp,
  Funnel,
  CheckCircle,
  WarningCircle,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { ClassRow, StudentRow, StudentFormData, UserRow } from '@/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { StudentStatusBadge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { StudentService } from '@/services/student.service';
import { exportStudentsToExcel, downloadStudentImportTemplate } from '@/lib/export';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { studentSchema } from '@/lib/validations/student';
import { compareVietnameseNames } from '@/lib/constants';

/**
 * Format class name cleanly to guarantee no duplicate "Lớp Lớp"
 */
function formatClassName(name?: string | null): string {
  if (!name) return '---';
  const clean = name.replace(/^lớp\s+/i, '').trim();
  return `Lớp ${clean}`;
}

type SortOption = 'name_asc' | 'name_desc' | 'code_asc' | 'code_desc' | 'class_asc' | 'dob_desc' | 'dob_asc';

export default function AdminStudentsPage() {
  const { user } = useAuth();

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filters & Sorting
  const [gradeFilter, setGradeFilter] = useState<'all' | '6' | '7' | '8' | '9'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('class_asc');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRow | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentRow | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetClassId, setImportTargetClassId] = useState<string>('');
  const [importFileName, setImportFileName] = useState('');
  const [parsedImportRows, setParsedImportRows] = useState<StudentFormData[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState<StudentFormData & { class_id: string }>({
    student_code: '',
    full_name: '',
    class_id: '',
    gender: 'male',
    date_of_birth: '',
    phone: '',
    email: '',
    parent_name: '',
    address: '',
  });

  const loadData = () => {
    const c = LocalStore.getClasses().filter((cls) => cls.status === 'active');
    const s = LocalStore.getStudents();
    const t = LocalStore.getTeachers();

    setClasses(c);
    setStudents(s);
    setTeachers(t);
    setIsLoaded(true);

    if (c.length > 0 && !importTargetClassId) {
      setImportTargetClassId(c[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    const list = students.filter((stu) => {
      const cls = classes.find((c) => c.id === stu.class_id);

      // Grade filter
      if (gradeFilter !== 'all' && cls?.grade.toString() !== gradeFilter) {
        return false;
      }

      // Class filter
      if (classFilter !== 'all' && stu.class_id !== classFilter) {
        return false;
      }

      // Gender filter
      if (genderFilter !== 'all' && stu.gender !== genderFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && stu.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = stu.full_name.toLowerCase().includes(q);
        const matchCode = stu.student_code.toLowerCase().includes(q);
        const matchPhone = stu.phone?.toLowerCase().includes(q) || false;
        const matchParent = stu.parent_name?.toLowerCase().includes(q) || false;
        const matchAddress = stu.address?.toLowerCase().includes(q) || false;
        const matchClass = cls?.name.toLowerCase().includes(q) || false;

        if (!matchName && !matchCode && !matchPhone && !matchParent && !matchAddress && !matchClass) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return compareVietnameseNames(a.full_name, b.full_name);
      }
      if (sortBy === 'name_desc') {
        return compareVietnameseNames(b.full_name, a.full_name);
      }
      if (sortBy === 'code_asc') {
        return a.student_code.localeCompare(b.student_code, undefined, { numeric: true });
      }
      if (sortBy === 'code_desc') {
        return b.student_code.localeCompare(a.student_code, undefined, { numeric: true });
      }
      if (sortBy === 'class_asc') {
        const clsA = classes.find((c) => c.id === a.class_id);
        const clsB = classes.find((c) => c.id === b.class_id);
        const gradeA = clsA?.grade || 0;
        const gradeB = clsB?.grade || 0;
        if (gradeA !== gradeB) return gradeA - gradeB;
        const nameA = clsA?.name || '';
        const nameB = clsB?.name || '';
        if (nameA !== nameB) return nameA.localeCompare(nameB, undefined, { numeric: true });
        return a.student_code.localeCompare(b.student_code, undefined, { numeric: true });
      }
      if (sortBy === 'dob_asc') {
        return (a.date_of_birth || '').localeCompare(b.date_of_birth || '');
      }
      if (sortBy === 'dob_desc') {
        return (b.date_of_birth || '').localeCompare(a.date_of_birth || '');
      }
      return 0;
    });
  }, [students, classes, gradeFilter, classFilter, genderFilter, statusFilter, searchQuery, sortBy]);

  // Statistics
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === 'active').length;
  const maleStudents = students.filter((s) => s.gender === 'male').length;
  const femaleStudents = students.filter((s) => s.gender === 'female').length;
  const malePercent = totalStudents > 0 ? Math.round((maleStudents / totalStudents) * 100) : 0;
  const femalePercent = totalStudents > 0 ? Math.round((femaleStudents / totalStudents) * 100) : 0;

  // Handle open add modal
  const handleOpenAdd = () => {
    const defaultClassId = classFilter !== 'all' ? classFilter : classes[0]?.id || '';
    setEditingStudent(null);
    setFormData({
      student_code: '',
      full_name: '',
      class_id: defaultClassId,
      gender: 'male',
      date_of_birth: '2012-01-01',
      phone: '',
      email: '',
      parent_name: '',
      address: '',
    });
    setIsAddEditModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (stu: StudentRow) => {
    setEditingStudent(stu);
    setFormData({
      student_code: stu.student_code,
      full_name: stu.full_name,
      class_id: stu.class_id,
      gender: stu.gender || 'male',
      date_of_birth: stu.date_of_birth || '',
      phone: stu.phone || '',
      email: stu.email || '',
      parent_name: stu.parent_name || '',
      address: stu.address || '',
    });
    setIsAddEditModalOpen(true);
  };

  // Save student (Create or Edit)
  const handleSaveStudent = () => {
    if (!formData.class_id) {
      toast.error('Vui lòng chọn lớp học cho học sinh.');
      return;
    }

    const payload: StudentFormData = {
      student_code: formData.student_code.trim().toUpperCase(),
      full_name: formData.full_name.trim(),
      gender: formData.gender,
      date_of_birth: formData.date_of_birth,
      phone: formData.phone?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      parent_name: formData.parent_name?.trim() || undefined,
      address: formData.address?.trim() || undefined,
    };

    // Schema validation
    const validation = studentSchema.safeParse(payload);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Thông tin không hợp lệ.';
      toast.error(firstError);
      return;
    }

    if (editingStudent) {
      // Update
      const res = StudentService.updateStudent(editingStudent.id, payload, user);
      if (!res.success) {
        toast.error(res.error || 'Cập nhật học sinh thất bại.');
        return;
      }

      // If class changed, update student's class_id
      if (formData.class_id !== editingStudent.class_id) {
        LocalStore.updateStudent(editingStudent.id, { class_id: formData.class_id } as any);
      }

      toast.success(`Đã cập nhật thông tin học sinh ${payload.full_name}!`);
    } else {
      // Create
      const res = StudentService.createStudent(payload, formData.class_id, user);
      if (!res.success) {
        toast.error(res.error || 'Thêm học sinh thất bại.');
        return;
      }
      toast.success(`Đã thêm học sinh ${payload.full_name} vào lớp!`);
    }

    setIsAddEditModalOpen(false);
    loadData();
  };

  // Delete student
  const handleConfirmDelete = () => {
    if (!studentToDelete) return;

    const res = StudentService.deleteStudent(studentToDelete.id, user);
    if (!res.success) {
      toast.error(res.error || 'Xóa học sinh thất bại.');
      return;
    }

    toast.success(`Đã xóa học sinh ${studentToDelete.full_name} khỏi hệ thống.`);
    setIsDeleteModalOpen(false);
    setStudentToDelete(null);
    loadData();
  };

  // Export to Excel
  const handleExportExcel = () => {
    const className = classFilter !== 'all'
      ? formatClassName(classes.find((c) => c.id === classFilter)?.name)
      : 'ToanTruong';
    exportStudentsToExcel(filteredStudents, className, new Map());
    toast.success('Đã xuất danh sách học sinh ra file Excel thành công!');
  };

  // Handle file select for import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);

        if (lines.length <= 1) {
          setImportErrors(['File không chứa dữ liệu học sinh (chỉ có dòng tiêu đề hoặc file rỗng).']);
          setParsedImportRows([]);
          return;
        }

        const parsed: StudentFormData[] = [];
        const errors: string[] = [];

        // Parse CSV format (skip header)
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 3) continue;

          const studentCode = cols[0];
          const fullName = cols[1];
          const rawGender = cols[2]?.toLowerCase();
          const gender: 'male' | 'female' = rawGender === 'nữ' || rawGender === 'female' ? 'female' : 'male';
          const dob = cols[3] || '2012-01-01';
          const phone = cols[4] || '';
          const parentName = cols[5] || '';
          const address = cols[6] || '';

          if (!studentCode) {
            errors.push(`Dòng ${i + 1}: Thiếu mã học sinh.`);
            continue;
          }
          if (!fullName) {
            errors.push(`Dòng ${i + 1}: Thiếu họ và tên học sinh.`);
            continue;
          }

          parsed.push({
            student_code: studentCode,
            full_name: fullName,
            gender,
            date_of_birth: dob,
            phone,
            parent_name: parentName,
            address,
          });
        }

        setParsedImportRows(parsed);
        setImportErrors(errors);
      } catch (err: any) {
        setImportErrors(['Không thể đọc định dạng file. Vui lòng sử dụng file mẫu CSV/Excel chuẩn.']);
      }
    };
    reader.readAsText(file);
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (!importTargetClassId) {
      toast.error('Vui lòng chọn lớp học để nhập danh sách.');
      return;
    }

    if (parsedImportRows.length === 0) {
      toast.error('Không có dữ liệu hợp lệ để nhập.');
      return;
    }

    setIsImporting(true);
    const res = StudentService.importStudents(importTargetClassId, parsedImportRows, user);
    setIsImporting(false);

    if (!res.success) {
      toast.error(res.error || 'Nhập danh sách học sinh thất bại.');
      return;
    }

    const targetClass = classes.find((c) => c.id === importTargetClassId);
    toast.success(`Đã nhập thành công ${res.data?.count} học sinh vào ${formatClassName(targetClass?.name)}!`);
    setIsImportModalOpen(false);
    setParsedImportRows([]);
    setImportFileName('');
    loadData();
  };

  if (!isLoaded) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full mx-auto">
        <div className="h-8 w-64 bg-surface-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full mx-auto">
      {/* =============================================
          1. HEADER & ACTIONS
          ============================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide uppercase text-text-primary">
              QUẢN LÝ HỒ SƠ HỌC SINH
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-teal-subtle text-teal border border-teal/30 font-bold text-xs whitespace-nowrap flex-shrink-0">
              <Student size={14} weight="bold" />
              {totalStudents} Học sinh Toàn trường
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-surface-muted text-text-secondary border border-border font-bold text-xs whitespace-nowrap flex-shrink-0">
              <ShieldCheck size={14} weight="bold" className="text-teal" />
              Quyền Quản trị Admin
            </span>
          </div>
          <p className="text-xs md:text-sm text-text-muted mt-1 font-medium">
            Quản trị tập trung toàn bộ hồ sơ, sắp xếp danh sách A-Z, thông tin phụ huynh và điều phối lớp học THCS.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Add Student Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            className="cursor-pointer bg-teal hover:bg-teal-hover text-white font-bold border border-teal-strong shadow-xs gap-1.5 whitespace-nowrap flex-shrink-0 h-8 px-3"
            title="Thêm học sinh mới vào trường"
          >
            <Plus size={15} weight="bold" />
            <span>Thêm học sinh</span>
          </Button>

          {/* Import Excel Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setParsedImportRows([]);
              setImportErrors([]);
              setImportFileName('');
              setIsImportModalOpen(true);
            }}
            className="cursor-pointer bg-surface hover:bg-surface-muted text-text-primary border-border font-semibold shadow-2xs gap-1.5 whitespace-nowrap flex-shrink-0 h-8 px-3"
            title="Nhập danh sách học sinh từ file Excel/CSV"
          >
            <UploadSimple size={15} weight="bold" className="text-teal" />
            <span>Nhập Excel</span>
          </Button>

          {/* Export Report Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportExcel}
            className="cursor-pointer bg-surface hover:bg-surface-muted text-text-primary border-border font-semibold shadow-2xs gap-1.5 whitespace-nowrap flex-shrink-0 h-8 px-3"
            title="Xuất danh sách học sinh hiện tại ra file Excel"
          >
            <FileXls size={16} weight="duotone" className="text-emerald-700" />
            <span>Xuất Excel</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              loadData();
              toast.success('Dữ liệu học sinh đã được làm mới!');
            }}
            className="cursor-pointer bg-surface hover:bg-surface-muted text-text-secondary border-border font-semibold shadow-2xs flex-shrink-0 h-8 w-8 p-0 flex items-center justify-center"
            title="Làm mới dữ liệu"
          >
            <ArrowsClockwise size={15} />
          </Button>
        </div>
      </div>

      {/* =============================================
          2. OVERVIEW KPI TILES (4 CARDS)
          ============================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* KPI 1: Tổng số học sinh */}
        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted font-medium gap-2">
              <span>Tổng số học sinh</span>
              <span className="font-bold text-success bg-success-bg px-1.5 py-0.5 rounded-sm text-[11px] border border-success/30 whitespace-nowrap flex-shrink-0">
                100% Đang học
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-text-primary font-mono tabular-nums">
                {totalStudents}
              </span>
              <span className="text-xs text-text-muted">học sinh toàn trường</span>
            </div>
            <p className="text-[11px] text-text-secondary mt-2">
              Phân bổ đều tại 16 lớp THCS (4 lớp mỗi khối từ Khối 6 đến Khối 9).
            </p>
          </div>
          <div className="mt-3 text-[11px] text-text-muted pt-2 border-t border-border flex items-center justify-between">
            <span>Đang học: <strong className="text-success font-mono font-bold">{activeStudents}</strong></span>
            <span>Lưu trữ: <strong className="text-text-muted font-mono">{totalStudents - activeStudents}</strong></span>
          </div>
        </div>

        {/* KPI 2: Học sinh Nam */}
        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted font-medium gap-2">
              <span>Học sinh Nam</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-sm text-[11px] border border-blue-200 whitespace-nowrap flex-shrink-0">
                Tỷ lệ {malePercent}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-blue-700 font-mono tabular-nums">
                {maleStudents}
              </span>
              <span className="text-xs text-text-muted">/ {totalStudents} học sinh</span>
            </div>
            <div className="mt-3 w-full bg-surface-muted h-2 rounded-full overflow-hidden border border-border/50">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${malePercent}%` }}
              />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-text-muted pt-2 border-t border-border">
            <span>Phân bổ giới tính đồng đều theo tiêu chuẩn</span>
          </div>
        </div>

        {/* KPI 3: Học sinh Nữ */}
        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted font-medium gap-2">
              <span>Học sinh Nữ</span>
              <span className="font-bold text-[#964253] bg-[#fcf0f2] px-1.5 py-0.5 rounded-sm text-[11px] border border-[#964253]/30 whitespace-nowrap flex-shrink-0">
                Tỷ lệ {femalePercent}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#964253] font-mono tabular-nums">
                {femaleStudents}
              </span>
              <span className="text-xs text-text-muted">/ {totalStudents} học sinh</span>
            </div>
            <div className="mt-3 w-full bg-surface-muted h-2 rounded-full overflow-hidden border border-border/50">
              <div
                className="bg-[#964253] h-full rounded-full transition-all duration-300"
                style={{ width: `${femalePercent}%` }}
              />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-text-muted pt-2 border-t border-border">
            <span>Cân đối cơ cấu học sinh các khối lớp</span>
          </div>
        </div>

        {/* KPI 4: Quy mô & Sĩ số */}
        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted font-medium gap-2">
              <span>Quy mô Lớp học</span>
              <span className="font-bold text-teal bg-teal-subtle px-1.5 py-0.5 rounded-sm text-[11px] border border-teal/30 whitespace-nowrap flex-shrink-0">
                16 Lớp THCS
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-teal font-mono tabular-nums">
                30
              </span>
              <span className="text-xs text-text-muted">học sinh / lớp (bình quân)</span>
            </div>
            <p className="text-[11px] text-text-secondary mt-2">
              Định mức sĩ số chuẩn quốc gia, tối ưu cho việc giảng dạy và sơ đồ phòng học.
            </p>
          </div>
          <div className="mt-3 text-[11px] text-text-muted pt-2 border-t border-border">
            <span>Sức chứa khai thác: <strong className="text-teal font-mono font-bold">100%</strong> (480 / 480 chỗ)</span>
          </div>
        </div>
      </div>

      {/* =============================================
          3. STUDENT MANAGEMENT TABLE & FILTERS
          ============================================= */}
      <div className="bg-surface rounded-sm border border-border p-4 md:p-5 shadow-xs space-y-4">
        {/* Table Title & Filter Controls */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Student size={18} className="text-teal" />
              <span>Danh Sách Học Sinh Toàn Trường ({filteredStudents.length} / {totalStudents})</span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa, thêm mới, phân lớp hoặc xóa học sinh.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Grade Tabs */}
            <div className="inline-flex items-center border border-border rounded-xs bg-surface-muted/50 p-0.5 text-xs font-bold flex-shrink-0">
              {[
                { key: 'all', label: 'Tất cả khối' },
                { key: '6', label: 'Khối 6' },
                { key: '7', label: 'Khối 7' },
                { key: '8', label: 'Khối 8' },
                { key: '9', label: 'Khối 9' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setGradeFilter(tab.key as any);
                    setClassFilter('all');
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-xs transition-colors cursor-pointer text-xs whitespace-nowrap flex-shrink-0 font-medium',
                    gradeFilter === tab.key
                      ? 'bg-surface text-text-primary shadow-2xs font-extrabold border border-border'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Class Dropdown Filter (NO duplicate "Lớp Lớp") */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="h-8 bg-surface border border-border rounded-xs px-2.5 text-xs text-text-primary font-medium cursor-pointer focus:outline-none focus:border-teal whitespace-nowrap flex-shrink-0"
            >
              <option value="all">Tất cả lớp ({classes.length} lớp)</option>
              {classes
                .filter((c) => gradeFilter === 'all' || c.grade.toString() === gradeFilter)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatClassName(c.name)} (Khối {c.grade})
                  </option>
                ))}
            </select>

            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="h-8 bg-surface border border-border rounded-xs px-2.5 text-xs text-text-primary font-medium cursor-pointer focus:outline-none focus:border-teal whitespace-nowrap flex-shrink-0"
            >
              <option value="all">Tất cả giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>

            {/* Sorting Dropdown (A-Z, Z-A, Mã HS, Lớp, Tuổi) */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-8 bg-surface border border-border rounded-xs px-2.5 text-xs text-text-primary font-semibold cursor-pointer focus:outline-none focus:border-teal whitespace-nowrap flex-shrink-0"
                title="Sắp xếp danh sách học sinh"
              >
                <option value="class_asc">Theo Khối (Khối 6 &rarr; Khối 9)</option>
                <option value="name_asc">Sắp xếp: Tên A &rarr; Z (Tiếng Việt)</option>
                <option value="name_desc">Sắp xếp: Tên Z &rarr; A</option>
                <option value="code_asc">Mã HS: Tăng dần (A &rarr; Z)</option>
                <option value="code_desc">Mã HS: Giảm dần (Z &rarr; A)</option>
                <option value="dob_desc">Tuổi: Nhỏ nhất</option>
                <option value="dob_asc">Tuổi: Lớn nhất</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px] h-8 flex-shrink-0">
              <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm mã, tên, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full bg-surface border border-border rounded-xs pl-8 pr-3 text-xs text-text-primary focus:outline-none focus:border-teal"
              />
            </div>
          </div>
        </div>

        {/* The Table */}
        <div className="w-full border border-border rounded-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-muted/60 border-b border-border text-text-secondary font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                <th className="py-2.5 px-3 w-10 text-center whitespace-nowrap">STT</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Mã HS</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Họ và tên</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Lớp & Khối</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center">Giới tính</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Ngày sinh</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Phụ huynh & SĐT</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Địa chỉ</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center">Trạng thái</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Thao tác Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredStudents.map((stu, idx) => {
                const stuClass = classes.find((c) => c.id === stu.class_id);

                return (
                  <tr
                    key={stu.id}
                    className="hover:bg-surface-muted/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center text-text-muted font-mono whitespace-nowrap">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-text-primary whitespace-nowrap">
                      {stu.student_code}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xs bg-teal-subtle text-teal font-extrabold text-[11px] flex items-center justify-center flex-shrink-0 border border-teal/30">
                          {stu.full_name.trim().split(' ').slice(-1)[0][0]}
                        </div>
                        <div>
                          <Link
                            href={`/admin/students/${stu.id}`}
                            className="font-bold text-text-primary hover:text-teal transition-colors block text-xs"
                            title="Xem hồ sơ chi tiết"
                          >
                            {stu.full_name}
                          </Link>
                          {stu.email && (
                            <span className="text-[10px] text-text-muted block">{stu.email}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-text-primary">
                          {formatClassName(stuClass?.name)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-surface-muted text-text-muted font-mono border border-border whitespace-nowrap">
                          Khối {stuClass?.grade}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {stu.gender === 'male' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-xs border border-blue-200">
                          <GenderMale size={12} weight="bold" />
                          Nam
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#964253] bg-[#fcf0f2] px-2 py-0.5 rounded-xs border border-[#964253]/30">
                          <GenderFemale size={12} weight="bold" />
                          Nữ
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-text-secondary whitespace-nowrap">
                      {stu.date_of_birth || '---'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-text-primary text-[11px]">
                          {stu.parent_name || 'Phụ huynh'}
                        </div>
                        {stu.phone ? (
                          <a
                            href={`tel:${stu.phone}`}
                            className="text-[10px] text-text-muted hover:text-teal font-mono transition-colors block"
                          >
                            {stu.phone}
                          </a>
                        ) : (
                          <span className="text-[10px] text-text-muted/60 italic block">Chưa có SĐT</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-text-secondary text-[11px] max-w-[200px] truncate" title={stu.address || 'Chưa cập nhật'}>
                      {stu.address || 'Chưa cập nhật'}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <StudentStatusBadge status={stu.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {/* View detail button */}
                        <Link href={`/admin/students/${stu.id}`} className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs font-semibold cursor-pointer text-text-secondary hover:text-text-primary gap-1 whitespace-nowrap flex-shrink-0"
                            title="Xem hồ sơ học sinh"
                          >
                            <Eye size={13} />
                            <span>Hồ sơ</span>
                          </Button>
                        </Link>

                        {/* Edit button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(stu)}
                          className="h-7 px-2 text-xs font-bold cursor-pointer text-teal hover:text-white bg-teal-subtle/50 hover:bg-teal border border-teal/30 hover:border-teal gap-1 transition-colors whitespace-nowrap flex-shrink-0"
                          title="Chỉnh sửa thông tin hoặc chuyển lớp học sinh"
                        >
                          <PencilSimple size={13} weight="bold" />
                          <span>Sửa</span>
                        </Button>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setStudentToDelete(stu);
                            setIsDeleteModalOpen(true);
                          }}
                          className="h-7 px-2 text-xs font-bold cursor-pointer text-danger hover:text-white hover:bg-danger border border-transparent hover:border-danger gap-1 transition-colors whitespace-nowrap flex-shrink-0"
                          title="Xóa học sinh khỏi hệ thống"
                        >
                          <Trash size={13} weight="bold" />
                          <span>Xóa</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-text-muted italic">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =============================================
          MODAL: THÊM / CHỈNH SỬA HỌC SINH
          ============================================= */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingStudent ? `Chỉnh sửa thông tin: ${editingStudent.full_name}` : 'Thêm học sinh mới'}
        description={editingStudent ? 'Cập nhật thông tin chi tiết hoặc chuyển lớp cho học sinh.' : 'Nhập thông tin học sinh mới vào hệ thống quản lý.'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddEditModalOpen(false)}
              className="cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveStudent}
              className="cursor-pointer bg-teal hover:bg-teal-hover text-white font-bold gap-1.5"
            >
              <CheckCircle size={15} weight="bold" />
              <span>{editingStudent ? 'Lưu thay đổi' : 'Tạo mới học sinh'}</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Student Code */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Mã học sinh <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: HS06001"
                value={formData.student_code}
                onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none focus:border-teal"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Họ và tên học sinh <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn An"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-medium focus:outline-none focus:border-teal"
              />
            </div>

            {/* Class Assignment (NO duplicate "Lớp Lớp") */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Lớp học <span className="text-danger">*</span>
              </label>
              <select
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-medium focus:outline-none focus:border-teal cursor-pointer"
              >
                <option value="">-- Chọn lớp học --</option>
                {[6, 7, 8, 9].map((grade) => (
                  <optgroup key={grade} label={`Khối ${grade}`}>
                    {classes
                      .filter((c) => c.grade === grade)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {formatClassName(c.name)} (GVCN: {c.teacher_id ? teachers.find((t) => t.id === c.teacher_id)?.name || 'Chưa gán' : 'Chưa gán'})
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Giới tính <span className="text-danger">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-medium focus:outline-none focus:border-teal cursor-pointer"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Ngày sinh <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-teal cursor-pointer"
              />
            </div>

            {/* Parent Name */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Họ tên phụ huynh
              </label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn Bình (Bố)"
                value={formData.parent_name || ''}
                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-teal"
              />
            </div>

            {/* Parent Phone */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                placeholder="VD: 0912345678"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-teal"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Email phụ huynh / học sinh
              </label>
              <input
                type="email"
                placeholder="VD: phuhuynh@email.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Địa chỉ thường trú / Nơi ở
            </label>
            <input
              type="text"
              placeholder="VD: Số 12 phố Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, Hà Nội"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-teal"
            />
          </div>
        </div>
      </Modal>

      {/* =============================================
          MODAL: NHẬP HỌC SINH TỪ EXCEL / CSV
          ============================================= */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập danh sách học sinh từ File Excel / CSV"
        description="Tải lên tệp danh sách để nhập tự động học sinh vào lớp học."
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadStudentImportTemplate}
              className="cursor-pointer gap-1.5 text-xs text-teal border-teal/30 hover:bg-teal-subtle"
            >
              <DownloadSimple size={14} weight="bold" />
              <span>Tải file mẫu (.csv)</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(false)}
                className="cursor-pointer"
                disabled={isImporting}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmImport}
                disabled={parsedImportRows.length === 0 || isImporting}
                className="cursor-pointer bg-teal hover:bg-teal-hover text-white font-bold gap-1.5"
              >
                <CheckCircle size={15} weight="bold" />
                <span>{isImporting ? 'Đang nhập...' : `Xác nhận nhập (${parsedImportRows.length} HS)`}</span>
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 py-1 text-xs">
          {/* Target Class Selection (NO duplicate "Lớp Lớp") */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Chọn Lớp học đích tiếp nhận danh sách <span className="text-danger">*</span>
            </label>
            <select
              value={importTargetClassId}
              onChange={(e) => setImportTargetClassId(e.target.value)}
              className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-medium focus:outline-none focus:border-teal cursor-pointer"
            >
              {classes.map((c) => {
                const curCount = students.filter((s) => s.class_id === c.id && s.status === 'active').length;
                return (
                  <option key={c.id} value={c.id}>
                    {formatClassName(c.name)} (Khối {c.grade} · Đang có {curCount}/30 học sinh)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Upload Box */}
          <div className="border-2 border-dashed border-border-strong rounded-xs p-5 text-center bg-surface-muted/30 hover:bg-surface-muted/60 transition-colors">
            <input
              type="file"
              id="admin-student-file-input"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label htmlFor="admin-student-file-input" className="cursor-pointer block space-y-2">
              <UploadSimple size={28} className="mx-auto text-teal" weight="duotone" />
              <div className="text-xs font-bold text-text-primary">
                {importFileName ? (
                  <span className="text-teal font-mono">{importFileName}</span>
                ) : (
                  'Nhấn để chọn tệp tin (.csv) hoặc kéo thả vào đây'
                )}
              </div>
              <p className="text-[11px] text-text-muted">
                Định dạng hỗ trợ: UTF-8 CSV với các cột: Mã học sinh, Họ và tên, Giới tính, Ngày sinh, SĐT, Phụ huynh, Địa chỉ.
              </p>
            </label>
          </div>

          {/* Errors Preview */}
          {importErrors.length > 0 && (
            <div className="p-3 rounded-xs border border-danger/30 bg-danger-bg text-danger space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <WarningCircle size={15} weight="fill" />
                <span>Phát hiện lỗi định dạng:</span>
              </div>
              <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                {importErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedImportRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-text-primary text-xs">
                <span>Xem trước danh sách ({parsedImportRows.length} học sinh):</span>
                <span className="text-teal text-[11px]">Hợp lệ và sẵn sàng nhập</span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-border rounded-xs divide-y divide-border/60">
                {parsedImportRows.slice(0, 8).map((r, i) => (
                  <div key={i} className="p-2 flex items-center justify-between text-[11px] bg-surface">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-text-muted w-6">{i + 1}.</span>
                      <span className="font-mono font-bold text-text-primary">{r.student_code}</span>
                      <span className="font-semibold text-text-primary">{r.full_name}</span>
                    </div>
                    <span className="text-text-muted font-mono">{r.gender === 'male' ? 'Nam' : 'Nữ'} · {r.date_of_birth}</span>
                  </div>
                ))}
                {parsedImportRows.length > 8 && (
                  <div className="p-2 text-center text-[11px] text-text-muted bg-surface-muted italic">
                    ...và còn {parsedImportRows.length - 8} học sinh khác.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* =============================================
          MODAL: XÁC NHẬN XÓA HỌC SINH
          ============================================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xác nhận xóa học sinh"
        description="Thao tác này sẽ xóa hồ sơ học sinh khỏi hệ thống quản lý."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              className="cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold border border-red-700 gap-1.5"
            >
              <Trash size={14} weight="bold" />
              <span>Xóa học sinh</span>
            </Button>
          </div>
        }
      >
        {studentToDelete && (
          <div className="space-y-3 py-1 text-xs">
            <div className="p-3.5 rounded-sm border-2 border-red-500 bg-red-50/90 text-text-primary text-xs flex items-start gap-3 shadow-2xs">
              <WarningCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" weight="fill" />
              <div className="leading-relaxed space-y-1">
                <span className="font-extrabold text-red-700 uppercase tracking-wide text-[11px] block">
                  CẢNH BÁO XÓA HỒ SƠ
                </span>
                <p className="text-text-primary text-xs font-medium">
                  Bạn có chắc chắn muốn xóa học sinh{' '}
                  <strong className="text-red-700 font-bold">{studentToDelete.full_name}</strong>{' '}
                  (Mã: <strong className="font-mono text-red-700">{studentToDelete.student_code}</strong>) thuộc{' '}
                  <strong>{formatClassName(classes.find((c) => c.id === studentToDelete.class_id)?.name)}</strong> khỏi cơ sở dữ liệu?
                </p>
                <p className="text-[11px] text-text-muted mt-1">
                  Học sinh sẽ bị xóa khỏi danh sách lớp, sơ đồ chỗ ngồi và dữ liệu liên quan.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
