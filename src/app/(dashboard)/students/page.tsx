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
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { StudentRow, DeskWithSeats, StudentFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { StudentStatusBadge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { useCurrentClass } from '@/contexts/class-context';

export default function StudentsPage() {
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
    setStudents(LocalStore.getStudents(currentClassId));
    setDesks(LocalStore.getDesks(currentClassId));
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
      LocalStore.updateStudent(editingStudent.id, formData);
      toast.success(`Đã cập nhật thông tin học sinh ${formData.full_name}`);
    } else {
      LocalStore.addStudent(formData, currentClassId || undefined);
      toast.success(`Đã thêm học sinh ${formData.full_name} vào lớp`);
    }

    setIsAddEditOpen(false);
    loadData();
  };

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      LocalStore.deleteStudent(studentToDelete.id);
      toast.success(`Đã xoá học sinh ${studentToDelete.full_name}`);
      setStudentToDelete(null);
      loadData();
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Danh sách học sinh
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-accent-subtle text-accent rounded-full">
              {students.length} học sinh
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Quản lý hồ sơ, thông tin liên lạc và vị trí chỗ ngồi của {currentClass?.name || 'lớp học'}
          </p>
        </div>

        {isHomeroom && (
          <Button variant="primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Thêm học sinh</span>
          </Button>
        )}
      </div>

      {/* Role Banner for Subject Teachers */}
      {isSubjectTeacher && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <span>
            Bạn đang xem danh sách học sinh lớp <strong>{currentClass?.name}</strong> với vai trò <strong>Giáo viên Bộ môn ({teacherSubjects.map((s) => s.name).join(', ')})</strong>. Chế độ chỉ xem hồ sơ.
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 font-medium text-[11px]">Chỉ xem</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, mã HS hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface rounded-lg border border-border focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-surface rounded-lg border border-border text-text-secondary focus:outline-none focus:border-accent"
          >
            <option value="all">Tất cả giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-surface rounded-lg border border-border text-text-secondary focus:outline-none focus:border-accent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang học</option>
            <option value="inactive">Đã chuyển lớp/nghỉ</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-subtle text-xs text-text-muted uppercase border-b border-border tracking-wider">
              <tr>
                <th className="px-4 py-3 w-12 text-center">STT</th>
                <th className="px-4 py-3 w-24">Mã HS</th>
                <th className="px-4 py-3">Họ và tên</th>
                <th className="px-4 py-3 w-24">Giới tính</th>
                <th className="px-4 py-3 w-32">Ngày sinh</th>
                <th className="px-4 py-3 w-36">Vị trí chỗ ngồi</th>
                <th className="px-4 py-3 w-32">Trạng thái</th>
                <th className="px-4 py-3 w-28 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  const seatInfo = seatMap.get(student.id);
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-surface-subtle/60 transition-colors group"
                    >
                      <td className="px-4 py-3 text-center text-text-muted font-mono text-xs">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-text-secondary">
                        {student.student_code}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/students/${student.id}`}
                          className="font-medium text-text-primary hover:text-accent transition-colors block"
                        >
                          {student.full_name}
                        </Link>
                        {student.phone && (
                          <span className="text-xs text-text-muted block mt-0.5">
                            SĐT: {student.phone}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {student.gender === 'male' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                            <GenderMale size={14} className="text-blue-500" />
                            Nam
                          </span>
                        ) : student.gender === 'female' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                            <GenderFemale size={14} className="text-rose-500" />
                            Nữ
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {student.date_of_birth || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {seatInfo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-muted text-text-primary font-medium">
                            <Armchair size={13} className="text-accent" />
                            {seatInfo}
                          </span>
                        ) : (
                          <span className="text-text-muted italic">Chưa xếp chỗ</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StudentStatusBadge status={student.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/students/${student.id}`}>
                            <button
                              type="button"
                              title="Xem chi tiết"
                              className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
                            >
                              <Eye size={15} />
                            </button>
                          </Link>
                          {isHomeroom && (
                            <>
                              <button
                                type="button"
                                title="Sửa thông tin"
                                onClick={() => handleOpenEdit(student)}
                                className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-surface-muted transition-colors"
                              >
                                <PencilSimple size={15} />
                              </button>
                              <button
                                type="button"
                                title="Xoá học sinh"
                                onClick={() => setStudentToDelete(student)}
                                className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger-subtle transition-colors"
                              >
                                <Trash size={15} />
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
        description="Điền đầy đủ thông tin hồ sơ học sinh lớp 9A1"
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
        description={`Bạn có chắc chắn muốn xoá học sinh "${studentToDelete?.full_name}" khỏi danh sách lớp 9A1? Vị trí ghế ngồi và dữ liệu liên quan sẽ bị xoá.`}
        confirmText="Xoá học sinh"
        variant="danger"
      />
    </div>
  );
}
