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
} from '@phosphor-icons/react';
import { StudentService, SeatingService } from '@/services';
import { StudentRow, DeskWithSeats, StudentFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { StudentStatusBadge } from '@/components/ui/badge';
import { EmptyStateView } from '@/components/ui/state-views';
import { exportStudentsToExcel } from '@/lib/export';
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
            <span className="px-3 py-1 text-xs font-semibold bg-accent-subtle text-accent rounded-full border border-accent/20">
              {students.length} học sinh
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1.5">
            Quản lý hồ sơ, thông tin liên lạc và vị trí chỗ ngồi của <span className="font-medium text-text-primary">{currentClass?.name || 'lớp học'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap no-print">
          <Button variant="secondary" onClick={handleExportExcel} className="gap-2" title="Xuất danh sách ra file Excel">
            <FileXls size={18} className="text-emerald-600" />
            <span>Xuất Excel</span>
          </Button>

          <Button variant="secondary" onClick={handlePrint} className="gap-2" title="In danh sách học sinh khổ A4">
            <Printer size={18} />
            <span>In danh sách</span>
          </Button>

          {isHomeroom && (
            <Button variant="primary" onClick={handleOpenAdd} className="gap-2">
              <Plus size={18} weight="bold" />
              <span>Thêm học sinh</span>
            </Button>
          )}
        </div>
      </div>

      {/* Role Banner for Subject Teachers */}
      {isSubjectTeacher && (
        <div className="p-4 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl flex items-center justify-between text-sm text-indigo-900 no-print shadow-2xs">
          <span className="leading-relaxed">
            Bạn đang xem danh sách học sinh lớp <strong className="font-semibold">{currentClass?.name}</strong> với vai trò <strong className="font-semibold">Giáo viên Bộ môn ({teacherSubjects.map((s) => s.name).join(', ')})</strong>. Chế độ tra cứu hồ sơ.
          </span>
          <span className="px-2.5 py-1 rounded-md bg-indigo-100 font-semibold text-xs text-indigo-800 ml-4 flex-shrink-0">Chỉ xem</span>
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
            className="w-full pl-10 pr-4 h-[46px] text-sm bg-surface rounded-xl border border-border focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 shadow-2xs placeholder:text-text-muted transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="h-[46px] px-3.5 text-sm bg-surface rounded-xl border border-border text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 shadow-2xs cursor-pointer"
          >
            <option value="all">Tất cả giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[46px] px-3.5 text-sm bg-surface rounded-xl border border-border text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 shadow-2xs cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang học</option>
            <option value="inactive">Đã chuyển/nghỉ</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs printable-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-surface-subtle/80 text-xs font-semibold text-text-muted uppercase border-b border-border tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-14 text-center">STT</th>
                <th className="px-4 py-3.5 w-24">Mã HS</th>
                <th className="px-5 py-3.5">Học sinh</th>
                <th className="px-4 py-3.5 w-28">Giới tính</th>
                <th className="px-4 py-3.5 w-32">Ngày sinh</th>
                <th className="px-5 py-3.5 w-44">Vị trí chỗ ngồi</th>
                <th className="px-4 py-3.5 w-32">Trạng thái</th>
                <th className="px-4 py-3.5 w-28 text-right no-print">Thao tác</th>
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
                      className="hover:bg-surface-subtle/70 transition-colors group min-h-[60px]"
                    >
                      <td className="px-4 py-4 text-center text-text-muted font-mono text-xs">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs font-semibold text-text-secondary">
                        {student.student_code}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent-subtle text-accent font-semibold text-sm flex items-center justify-center flex-shrink-0 border border-accent/20">
                            {initial}
                          </div>
                          <div>
                            <Link
                              href={`/students/${student.id}`}
                              className="font-semibold text-text-primary hover:text-accent transition-colors block text-sm"
                            >
                              {student.full_name}
                            </Link>
                            {student.phone ? (
                              <a
                                href={`tel:${student.phone}`}
                                className="text-xs text-text-muted hover:text-text-primary block mt-0.5 transition-colors"
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
                      <td className="px-4 py-4">
                        {student.gender === 'male' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200/60">
                            <GenderMale size={14} weight="bold" className="text-blue-600" />
                            Nam
                          </span>
                        ) : student.gender === 'female' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200/60">
                            <GenderFemale size={14} weight="bold" className="text-rose-600" />
                            Nữ
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-text-secondary">
                        {student.date_of_birth || '—'}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {seatInfo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-muted text-text-primary font-medium border border-border/80">
                            <Armchair size={14} weight="duotone" className="text-accent" />
                            <span>{seatInfo}</span>
                          </span>
                        ) : (
                          <span className="text-text-muted italic px-2 py-1 text-xs">Chưa xếp chỗ</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StudentStatusBadge status={student.status} />
                      </td>
                      <td className="px-4 py-4 text-right no-print">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/students/${student.id}`}>
                            <button
                              type="button"
                              title="Xem chi tiết hồ sơ"
                              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
                            >
                              <Eye size={17} />
                            </button>
                          </Link>
                          {isHomeroom && (
                            <>
                              <button
                                type="button"
                                title="Sửa thông tin học sinh"
                                onClick={() => handleOpenEdit(student)}
                                className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-surface-muted transition-colors cursor-pointer"
                              >
                                <PencilSimple size={17} />
                              </button>
                              <button
                                type="button"
                                title="Xoá học sinh"
                                onClick={() => setStudentToDelete(student)}
                                className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger-subtle transition-colors cursor-pointer"
                              >
                                <Trash size={17} />
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
