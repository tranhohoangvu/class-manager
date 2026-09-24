'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Trash,
  Eye,
  Armchair,
  GenderMale,
  GenderFemale,
  FileXls,
  Printer,
  UploadSimple,
  DownloadSimple,
  CheckCircle,
  WarningOctagon,
  FileArrowUp,
} from '@phosphor-icons/react';
import * as XLSX from 'xlsx';
import { StudentService, SeatingService } from '@/services';
import { StudentRow, DeskWithSeats, StudentFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { StudentStatusBadge } from '@/components/ui/badge';
import { EmptyStateView } from '@/components/ui/state-views';
import { exportStudentsToExcel, downloadStudentImportTemplate } from '@/lib/export';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentClass } from '@/contexts/class-context';

export default function StudentsPage() {
  const { user } = useAuth();
  const { currentClassId, currentClass, isHomeroom, isSubjectTeacher, teacherSubjects } = useCurrentClass();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [desks, setDesks] = useState<DeskWithSeats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRow | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentRow | null>(null);

  // Import Excel states
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<
    Array<{
      stt: number;
      student_code: string;
      full_name: string;
      gender: 'male' | 'female';
      date_of_birth: string;
      phone: string;
      email: string;
      isValid: boolean;
      errorReason?: string;
    }>
  >([]);
  const [isImporting, setIsImporting] = useState(false);

  // Form states
  const [formData, setFormData] = useState<StudentFormData>({
    student_code: '',
    full_name: '',
    gender: 'male',
    date_of_birth: '',
    phone: '',
    email: '',
  });

  const loadData = () => {
    if (!currentClassId) return;
    setStudents(StudentService.getStudents(currentClassId));
    setDesks(SeatingService.getDesks(currentClassId));
  };

  useEffect(() => {
    loadData();
  }, [currentClassId]);

  // Map studentId to seat position string
  const seatMap = useMemo(() => {
    const map = new Map<string, string>();
    desks.forEach((desk) => {
      desk.seats.forEach((seat) => {
        if (seat.student_id) {
          const sideText = seat.side === 'left' ? 'Trái' : 'Phải';
          map.set(seat.student_id, `Bàn ${desk.desk_number} (${sideText})`);
        }
      });
    });
    return map;
  }, [desks]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.phone && s.phone.includes(searchQuery));

      const matchGender = genderFilter === 'all' || s.gender === genderFilter;
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;

      return matchSearch && matchGender && matchStatus;
    });
  }, [students, searchQuery, genderFilter, statusFilter]);

  const handleOpenAdd = () => {
    const nextCode = `HS${(students.length + 1).toString().padStart(2, '0')}`;
    setEditingStudent(null);
    setFormData({
      student_code: nextCode,
      full_name: '',
      gender: 'male',
      date_of_birth: '2011-01-01',
      phone: '',
      email: '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (student: StudentRow) => {
    setEditingStudent(student);
    setFormData({
      student_code: student.student_code,
      full_name: student.full_name,
      gender: student.gender || 'male',
      date_of_birth: student.date_of_birth || '',
      phone: student.phone || '',
      email: student.email || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast.error('Vui lòng nhập họ và tên học sinh');
      return;
    }

    if (editingStudent) {
      const res = StudentService.updateStudent(editingStudent.id, formData, user);
      if (!res.success) {
        toast.error(res.error || 'Cập nhật học sinh thất bại');
        return;
      }
      toast.success(`Đã cập nhật thông tin học sinh ${formData.full_name}`);
    } else {
      const res = StudentService.createStudent(formData, currentClassId || '', user);
      if (!res.success) {
        toast.error(res.error || 'Thêm học sinh thất bại');
        return;
      }
      toast.success(`Đã thêm học sinh ${formData.full_name} vào lớp`);
    }

    setIsAddEditOpen(false);
    loadData();
  };

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      const res = StudentService.deleteStudent(studentToDelete.id, user);
      if (!res.success) {
        toast.error(res.error || 'Không thể xoá học sinh');
        return;
      }
      toast.success(`Đã xoá học sinh ${studentToDelete.full_name}`);
      setStudentToDelete(null);
      loadData();
    }
  };

  // Handle Excel file selection & parsing
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

        if (!data || data.length === 0) {
          toast.error('File Excel không có dữ liệu học sinh!');
          setParsedRows([]);
          return;
        }

        const existingCodes = new Set(
          students.map((s) => s.student_code.trim().toUpperCase())
        );
        const seenInFile = new Set<string>();

        const parsed = data.map((row, idx) => {
          const code = (
            row['Mã học sinh (*)'] ||
            row['Mã học sinh'] ||
            row['Mã HS'] ||
            row['student_code'] ||
            row['Code'] ||
            ''
          )
            .toString()
            .trim()
            .toUpperCase();

          const name = (
            row['Họ và tên (*)'] ||
            row['Họ và tên'] ||
            row['Họ tên'] ||
            row['full_name'] ||
            row['Name'] ||
            ''
          )
            .toString()
            .trim();

          const rawGender = (row['Giới tính'] || row['gender'] || '').toString().trim().toLowerCase();
          const gender: 'male' | 'female' = rawGender === 'nữ' || rawGender === 'female' ? 'female' : 'male';

          let dob = (row['Ngày sinh'] || row['date_of_birth'] || '').toString().trim();
          if (dob && dob.includes('/')) {
            const parts = dob.split('/');
            if (parts.length === 3) {
              dob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }

          const phone = (row['SĐT phụ huynh'] || row['Số điện thoại'] || row['phone'] || '').toString().trim();
          const email = (row['Email'] || row['email'] || '').toString().trim();

          let isValid = true;
          let errorReason = '';

          if (!code) {
            isValid = false;
            errorReason = 'Thiếu mã HS';
          } else if (!name) {
            isValid = false;
            errorReason = 'Thiếu họ và tên';
          } else if (seenInFile.has(code)) {
            isValid = false;
            errorReason = `Trùng mã ${code} trong file`;
          } else if (existingCodes.has(code)) {
            isValid = false;
            errorReason = `Mã ${code} đã có trong lớp`;
          }

          if (code) {
            seenInFile.add(code);
          }

          return {
            stt: idx + 1,
            student_code: code,
            full_name: name,
            gender,
            date_of_birth: dob,
            phone,
            email,
            isValid,
            errorReason,
          };
        });

        setParsedRows(parsed);
      } catch (err) {
        console.error('Lỗi đọc file Excel:', err);
        toast.error('Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng file!');
      }
    };
    reader.readAsBinaryString(file);
  };

  const validImportRows = parsedRows.filter((r) => r.isValid);
  const activeStudentsCount = students.filter((s) => s.status === 'active').length;
  const maxClassCapacity = currentClass?.max_students || 40;
  const isOverCapacity = activeStudentsCount + validImportRows.length > maxClassCapacity;

  const handleConfirmImport = () => {
    if (!currentClassId) return;
    if (validImportRows.length === 0) {
      toast.error('Không có học sinh hợp lệ nào để nhập!');
      return;
    }
    if (isOverCapacity) {
      toast.error(`Tổng sĩ số (${activeStudentsCount + validImportRows.length}) vượt quá giới hạn lớp (${maxClassCapacity} học sinh)!`);
      return;
    }

    setIsImporting(true);
    const toImport: StudentFormData[] = validImportRows.map((r) => ({
      student_code: r.student_code,
      full_name: r.full_name,
      gender: r.gender,
      date_of_birth: r.date_of_birth,
      phone: r.phone,
      email: r.email,
    }));

    const res = StudentService.importStudents(currentClassId, toImport, user);
    setIsImporting(false);

    if (!res.success) {
      toast.error(res.error || 'Nhập danh sách học sinh thất bại');
      return;
    }

    toast.success(`Đã nạp thành công ${res.data?.count} học sinh vào lớp!`);
    setIsImportOpen(false);
    setParsedRows([]);
    setImportFileName('');
    loadData();
  };

  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      toast.error('Không có dữ liệu học sinh để xuất file!');
      return;
    }
    exportStudentsToExcel(filteredStudents, currentClass?.name || 'Lớp học', seatMap);
    toast.success('Đã xuất file Excel danh sách học sinh!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Danh sách học sinh
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold font-mono bg-teal-subtle text-teal rounded-xs border border-teal/30">
              {students.length} học sinh
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1.5 font-medium">
            Quản lý hồ sơ, thông tin liên lạc và vị trí chỗ ngồi của <span className="font-semibold text-text-primary">{currentClass?.name || 'lớp học'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap no-print">
          <Button variant="secondary" onClick={handleExportExcel} className="gap-2" title="Xuất danh sách ra file Excel">
            <FileXls size={18} className="text-teal" />
            <span>Xuất Excel</span>
          </Button>

          <Button variant="secondary" onClick={handlePrint} className="gap-2" title="In danh sách học sinh khổ A4">
            <Printer size={18} />
            <span>In danh sách</span>
          </Button>

          {isHomeroom && (
            <>
              <Button
                variant="secondary"
                onClick={() => setIsImportOpen(true)}
                className="gap-2"
                title="Nhập danh sách học sinh từ file Excel"
              >
                <UploadSimple size={18} />
                <span>Nhập từ Excel</span>
              </Button>

              <Button variant="primary" onClick={handleOpenAdd} className="gap-2">
                <Plus size={18} weight="bold" />
                <span>Thêm học sinh</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Role Banner for Subject Teachers */}
      {isSubjectTeacher && (
        <div className="p-3.5 bg-teal-subtle border border-teal/30 rounded-sm flex items-center justify-between text-sm text-text-primary no-print shadow-xs">
          <span className="leading-relaxed">
            Bạn đang xem danh sách học sinh lớp <strong className="font-bold">{currentClass?.name}</strong> với vai trò <strong className="font-bold">Giáo viên Bộ môn ({teacherSubjects.map((s) => s.name).join(', ')})</strong>. Chế độ tra cứu hồ sơ.
          </span>
          <span className="px-2 py-0.5 rounded-xs bg-surface border border-teal/30 font-bold text-xs text-teal ml-4 flex-shrink-0">Chỉ xem</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 no-print">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, mã HS hoặc số điện thoại phụ huynh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-[42px] text-sm bg-surface rounded-xs border border-border-strong focus:outline-none focus:border-accent shadow-xs placeholder:text-text-muted transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="h-[42px] px-3 text-sm bg-surface rounded-xs border border-border-strong text-text-primary focus:outline-none focus:border-accent shadow-xs cursor-pointer font-medium"
          >
            <option value="all">Tất cả giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[42px] px-3 text-sm bg-surface rounded-xs border border-border-strong text-text-primary focus:outline-none focus:border-accent shadow-xs cursor-pointer font-medium"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang học</option>
            <option value="inactive">Đã chuyển/nghỉ</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-surface rounded-sm border border-border-strong overflow-hidden shadow-xs printable-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-surface-muted text-xs font-bold text-text-primary uppercase border-b border-border tracking-wider font-mono">
              <tr>
                <th className="px-4 py-3 w-14 text-center">STT</th>
                <th className="px-4 py-3 w-24">Mã HS</th>
                <th className="px-5 py-3">Học sinh</th>
                <th className="px-4 py-3 w-28">Giới tính</th>
                <th className="px-4 py-3 w-32">Ngày sinh</th>
                <th className="px-5 py-3 w-44">Vị trí chỗ ngồi</th>
                <th className="px-4 py-3 w-32">Trạng thái</th>
                <th className="px-4 py-3 w-28 text-right no-print">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyStateView
                      title="Không tìm thấy học sinh"
                      description="Không có học sinh nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc hiện tại."
                      actionText={isHomeroom ? "Thêm học sinh mới" : undefined}
                      onAction={isHomeroom ? handleOpenAdd : undefined}
                    />
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  const seatInfo = seatMap.get(student.id);
                  const lastName = student.full_name.trim().split(' ').pop() || student.full_name;
                  const initial = lastName.charAt(0).toUpperCase();

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-surface-muted/50 transition-colors group min-h-[58px]"
                    >
                      <td className="px-4 py-3.5 text-center text-text-muted font-mono text-xs">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-text-secondary">
                        {student.student_code}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xs bg-surface-muted text-text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 border border-border-strong font-mono shadow-xs">
                            {initial}
                          </div>
                          <div>
                            <Link
                              href={`/students/${student.id}`}
                              className="font-bold text-text-primary hover:text-teal transition-colors block text-sm"
                            >
                              {student.full_name}
                            </Link>
                            {student.phone ? (
                              <a
                                href={`tel:${student.phone}`}
                                className="text-xs text-text-muted hover:text-text-primary block mt-0.5 transition-colors font-mono"
                                title="Gọi điện cho phụ huynh"
                              >
                                SĐT: {student.phone}
                              </a>
                            ) : (
                              <span className="text-xs text-text-muted/60 block mt-0.5">
                                Chưa có SĐT
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {student.gender === 'male' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal bg-teal-subtle px-2 py-0.5 rounded-xs border border-teal/30">
                            <GenderMale size={13} weight="bold" className="text-teal" />
                            Nam
                          </span>
                        ) : student.gender === 'female' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#964253] bg-[#fcf0f2] px-2 py-0.5 rounded-xs border border-[#964253]/30">
                            <GenderFemale size={13} weight="bold" className="text-[#964253]" />
                            Nữ
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono font-medium text-text-secondary">
                        {student.date_of_birth || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {seatInfo ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-surface-muted text-text-primary font-medium border border-border font-mono">
                            <Armchair size={13} weight="duotone" className="text-teal" />
                            <span>{seatInfo}</span>
                          </span>
                        ) : (
                          <span className="text-text-muted italic px-2 py-0.5 text-xs">Chưa xếp chỗ</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StudentStatusBadge status={student.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right no-print">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/students/${student.id}`}>
                            <button
                              type="button"
                              title="Xem chi tiết hồ sơ"
                              className="p-1.5 rounded-xs text-text-muted hover:text-text-primary hover:bg-surface-muted border border-transparent hover:border-border transition-colors cursor-pointer"
                            >
                              <Eye size={16} />
                            </button>
                          </Link>
                          {isHomeroom && (
                            <>
                              <button
                                type="button"
                                title="Sửa thông tin học sinh"
                                onClick={() => handleOpenEdit(student)}
                                className="p-1.5 rounded-xs text-text-muted hover:text-teal hover:bg-surface-muted border border-transparent hover:border-border transition-colors cursor-pointer"
                              >
                                <PencilSimple size={16} />
                              </button>
                              <button
                                type="button"
                                title="Xoá học sinh"
                                onClick={() => setStudentToDelete(student)}
                                className="p-1.5 rounded-xs text-text-muted hover:text-danger hover:bg-danger-bg border border-transparent hover:border-danger/30 transition-colors cursor-pointer"
                              >
                                <Trash size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingStudent ? 'Sửa thông tin học sinh' : 'Thêm học sinh mới'}
        description={`Điền đầy đủ thông tin hồ sơ học sinh lớp ${currentClass?.name || 'lớp học'}`}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="student_code"
              label="Mã học sinh"
              value={formData.student_code}
              onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
              required
              placeholder="HS01"
            />
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Giới tính
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-surface rounded-lg border border-border text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>
          </div>

          <Input
            id="full_name"
            label="Họ và tên"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
            placeholder="Ví dụ: Nguyễn Văn An"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="date_of_birth"
              type="date"
              label="Ngày sinh"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
            <Input
              id="phone"
              label="Số điện thoại phụ huynh"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0912345678"
            />
          </div>

          <Input
            id="email"
            type="email"
            label="Email học sinh (nếu có)"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="hs.an@school.edu.vn"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddEditOpen(false)}
            >
              Huỷ
            </Button>
            <Button type="submit" variant="primary">
              {editingStudent ? 'Lưu thay đổi' : 'Thêm học sinh'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import Students via Excel Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          setParsedRows([]);
          setImportFileName('');
        }}
        title="Nhập danh sách học sinh từ file Excel"
        description={`Tải file Excel danh sách học sinh nạp nhanh vào ${currentClass?.name || 'lớp học'}`}
        size="3xl"
      >
        <div className="space-y-5">
          {/* Top Banner / Guidelines */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-accent-subtle/40 border border-accent/20">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-primary">
                Quy chuẩn nạp học sinh THCS Nguyễn Tất Thành
              </p>
              <p className="text-xs text-text-secondary">
                Hỗ trợ định dạng <code className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono font-bold">.xlsx</code>, <code className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono font-bold">.xls</code> hoặc <code className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono font-bold">.csv</code>. Tối đa 40 học sinh/lớp.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={downloadStudentImportTemplate}
              className="gap-2 self-start sm:self-auto text-xs whitespace-nowrap flex-shrink-0"
              title="Tải file mẫu Excel chuẩn"
            >
              <DownloadSimple size={15} weight="bold" className="text-accent" />
              <span>Tải file mẫu Excel</span>
            </Button>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-border hover:border-accent rounded-2xl p-6 transition-colors bg-surface-subtle/50 text-center relative group">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              title="Chọn file Excel"
            />
            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                <FileArrowUp size={24} weight="duotone" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {importFileName ? (
                    <span className="text-accent font-bold">{importFileName}</span>
                  ) : (
                    'Kéo thả file Excel vào đây hoặc bấm để chọn file'
                  )}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  Các cột bắt buộc: Mã học sinh (*), Họ và tên (*)
                </p>
              </div>
            </div>
          </div>

          {/* Capacity Alert */}
          {parsedRows.length > 0 && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                isOverCapacity
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {isOverCapacity ? (
                  <WarningOctagon size={18} weight="bold" className="text-rose-600 flex-shrink-0" />
                ) : (
                  <CheckCircle size={18} weight="bold" className="text-emerald-600 flex-shrink-0" />
                )}
                <span>
                  {isOverCapacity
                    ? `Cảnh báo: Sĩ số sau khi nhập (${activeStudentsCount + validImportRows.length}) vượt quá giới hạn tối đa của lớp (${maxClassCapacity} học sinh). Không thể lưu!`
                    : `Sĩ số dự kiến: ${activeStudentsCount} + ${validImportRows.length} = ${activeStudentsCount + validImportRows.length}/${maxClassCapacity} học sinh (Hợp lệ).`}
                </span>
              </div>
              <span className="font-mono font-bold whitespace-nowrap">
                {validImportRows.length} hợp lệ / {parsedRows.length - validImportRows.length} lỗi
              </span>
            </div>
          )}

          {/* Data Preview Table */}
          {parsedRows.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-subtle sticky top-0 border-b border-border font-semibold text-text-muted">
                  <tr>
                    <th className="px-3 py-2 w-12 text-center">STT</th>
                    <th className="px-3 py-2 w-20">Mã HS</th>
                    <th className="px-3 py-2">Họ và tên</th>
                    <th className="px-3 py-2 w-20">Giới tính</th>
                    <th className="px-3 py-2 w-24">Ngày sinh</th>
                    <th className="px-3 py-2 w-28">SĐT PH</th>
                    <th className="px-3 py-2 w-32 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedRows.map((row) => (
                    <tr
                      key={row.stt}
                      className={row.isValid ? 'hover:bg-surface-subtle/50' : 'bg-rose-50/50 hover:bg-rose-50'}
                    >
                      <td className="px-3 py-2 text-center font-mono text-text-muted">{row.stt}</td>
                      <td className="px-3 py-2 font-mono font-semibold">{row.student_code || '—'}</td>
                      <td className="px-3 py-2 font-medium">{row.full_name || '—'}</td>
                      <td className="px-3 py-2">{row.gender === 'male' ? 'Nam' : 'Nữ'}</td>
                      <td className="px-3 py-2 font-mono text-text-secondary">{row.date_of_birth || '—'}</td>
                      <td className="px-3 py-2 font-mono text-text-secondary">{row.phone || '—'}</td>
                      <td className="px-3 py-2 text-right">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                            <CheckCircle size={12} weight="bold" />
                            Hợp lệ
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded"
                            title={row.errorReason}
                          >
                            <WarningOctagon size={12} weight="bold" />
                            {row.errorReason}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-between items-center gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsImportOpen(false);
                setParsedRows([]);
                setImportFileName('');
              }}
            >
              Huỷ
            </Button>

            <Button
              type="button"
              variant="primary"
              disabled={validImportRows.length === 0 || isOverCapacity || isImporting}
              onClick={handleConfirmImport}
              className="gap-2"
            >
              {isImporting ? (
                <span>Đang nạp...</span>
              ) : (
                <span>Xác nhận nạp {validImportRows.length} học sinh</span>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Xoá học sinh"
        description={`Bạn có chắc chắn muốn xoá học sinh "${studentToDelete?.full_name}" khỏi danh sách lớp ${currentClass?.name || 'lớp'}? Vị trí ghế ngồi và dữ liệu liên quan sẽ bị xoá.`}
        confirmText="Xoá học sinh"
        variant="danger"
      />
    </div>
  );
}
