'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Archive,
  Chalkboard,
  UserSwitch,
  Check,
  Users,
  BookOpen,
  ShieldCheck,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { TeacherService, ClassService } from '@/services';
import { ClassRow, UserRow, StudentRow, ClassFormData, SubjectRow, SubjectAssignmentRow } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

export default function AdminClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignmentRow[]>([]);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | '6' | '7' | '8' | '9'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [isLoaded, setIsLoaded] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [selectedClassDetail, setSelectedClassDetail] = useState<ClassRow | null>(null);
  const [targetArchiveClass, setTargetArchiveClass] = useState<ClassRow | null>(null);

  // Form State
  const [formData, setFormData] = useState<ClassFormData>({
    name: '',
    grade: 9,
    room_name: '',
    school_year: '2026 - 2027',
    teacher_id: null,
    max_students: 40,
    desk_count: 20,
  });

  const loadData = () => {
    setClasses(LocalStore.getClasses());
    setTeachers(LocalStore.getTeachers());
    setStudents(LocalStore.getStudents());
    setSubjects(LocalStore.getSubjects());
    setSubjectAssignments(LocalStore.getSubjectAssignments());
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignSubjectTeacher = (subjectId: string, teacherId: string) => {
    if (!selectedClassDetail) return;
    const tId = teacherId === '' ? null : teacherId;
    const res = TeacherService.assignSubjectTeacher(selectedClassDetail.id, subjectId, tId, user);
    if (!res.success) {
      toast.error(res.error || 'Phân công môn học thất bại');
      return;
    }
    const sub = subjects.find((s) => s.id === subjectId);
    const teacher = teachers.find((t) => t.id === tId);
    if (teacher) {
      toast.success(`Đã phân công ${teacher.name} dạy môn ${sub?.name || 'môn học'}`);
    } else {
      toast.info(`Đã huỷ phân công môn ${sub?.name || 'môn học'}`);
    }
    loadData();
  };

  const handleReassignHomeroom = (teacherId: string) => {
    if (!selectedClassDetail) return;
    const tId = teacherId === '' ? null : teacherId;
    const res = TeacherService.assignHomeroomTeacher(selectedClassDetail.id, tId, user);
    if (!res.success) {
      toast.error(res.error || 'Phân công GVCN thất bại');
      return;
    }
    const teacher = teachers.find((t) => t.id === tId);
    if (teacher) {
      toast.success(`Đã đổi GVCN lớp ${selectedClassDetail.name} thành ${teacher.name}`);
    } else {
      toast.info(`Đã gỡ GVCN của lớp ${selectedClassDetail.name}`);
    }
    setSelectedClassDetail({
      ...selectedClassDetail,
      teacher_id: tId,
    });
    loadData();
  };

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchSearch =
        search.trim() === '' ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.room_name && c.room_name.toLowerCase().includes(search.toLowerCase())) ||
        c.school_year.toLowerCase().includes(search.toLowerCase());
      const matchGrade = gradeFilter === 'all' || c.grade.toString() === gradeFilter;
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchGrade && matchStatus;
    });
  }, [classes, search, gradeFilter, statusFilter]);

  const openAddModal = () => {
    setFormData({
      name: '',
      grade: 9,
      room_name: '',
      school_year: '2026 - 2027',
      teacher_id: null,
      max_students: 40,
      desk_count: 20,
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (cls: ClassRow) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      grade: cls.grade,
      room_name: cls.room_name || '',
      school_year: cls.school_year,
      teacher_id: cls.teacher_id,
      max_students: cls.max_students,
      desk_count: cls.desk_count,
    });
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên lớp học');
      return;
    }

    if (editingClass) {
      LocalStore.updateClass(editingClass.id, formData);
      toast.success('Đã cập nhật thông tin lớp học');
      setEditingClass(null);
    } else {
      const res = ClassService.addClass(formData, user);
      if (!res.success) {
        toast.error(res.error || 'Tạo lớp thất bại');
        return;
      }
      toast.success('Đã tạo lớp học mới và thiết lập sơ đồ bàn ghế');
      setIsAddModalOpen(false);
    }

    loadData();
  };

  const handleArchiveClass = () => {
    if (!targetArchiveClass) return;
    const res = ClassService.archiveClass(targetArchiveClass.id, user);
    if (!res.success) {
      toast.error(res.error || 'Lưu trữ lớp học thất bại');
      return;
    }
    toast.success(`Đã chuyển lớp ${targetArchiveClass.name} vào kho lưu trữ`);
    setTargetArchiveClass(null);
    loadData();
  };

  const activeClassesCount = classes.filter((c) => c.status === 'active').length;
  const assignedHomeroomCount = classes.filter((c) => c.teacher_id && c.status === 'active').length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-teal-subtle text-teal border border-teal/30 rounded-sm inline-flex items-center gap-1.5">
              <ShieldCheck size={14} weight="bold" />
              Trường THCS Nguyễn Tất Thành
            </span>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-surface-muted text-text-secondary border border-border rounded-sm">
              Năm học: 2026 - 2027
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mt-2">
            Quản lý Lớp học
          </h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Danh sách 16 lớp học 4 khối (6 - 9), phân công giáo viên chủ nhiệm và phòng học chuyên dụng
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openAddModal} className="gap-2 self-start md:self-auto">
          <Plus size={16} weight="bold" />
          <span>Tạo Lớp học mới</span>
        </Button>
      </div>

      {/* KPI Stats Mini Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface rounded-sm border border-border-strong p-3.5 shadow-[1px_1px_0px_#000]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Tổng số lớp học</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-text-primary">{classes.length}</span>
            <span className="text-xs text-text-muted">lớp (4 khối)</span>
          </div>
        </div>

        <div className="bg-surface rounded-sm border border-border-strong p-3.5 shadow-[1px_1px_0px_#000]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Đang hoạt động</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-success">{activeClassesCount}</span>
            <span className="text-[11px] text-success font-bold bg-success-bg px-1.5 py-0.5 rounded-sm border border-success/30">
              100% hoạt động
            </span>
          </div>
        </div>

        <div className="bg-surface rounded-sm border border-border-strong p-3.5 shadow-[1px_1px_0px_#000]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Phân công GVCN</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-teal">{assignedHomeroomCount}</span>
            <span className="text-xs text-text-muted">/{activeClassesCount} lớp</span>
          </div>
        </div>

        <div className="bg-surface rounded-sm border border-border-strong p-3.5 shadow-[1px_1px_0px_#000]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Quy mô học sinh</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-text-primary">{students.length}</span>
            <span className="text-xs text-text-muted">em toàn trường</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Tìm theo tên lớp, phòng học, năm học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-9 bg-surface border border-border-strong rounded-sm text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-text-muted shadow-[1px_1px_0px_rgba(13,1,41,0.1)] transition-all"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary">Khối:</span>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as any)}
              className="h-9 bg-surface border border-border-strong px-3 rounded-sm text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer text-text-primary shadow-[1px_1px_0px_rgba(13,1,41,0.1)]"
            >
              <option value="all">Tất cả khối</option>
              <option value="6">Khối 6</option>
              <option value="7">Khối 7</option>
              <option value="8">Khối 8</option>
              <option value="9">Khối 9</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 bg-surface border border-border-strong px-3 rounded-sm text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer text-text-primary shadow-[1px_1px_0px_rgba(13,1,41,0.1)]"
            >
              <option value="active">Đang hoạt động</option>
              <option value="archived">Đã lưu trữ</option>
              <option value="all">Tất cả</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-sm border border-border-strong overflow-hidden shadow-[2px_2px_0px_0px_rgba(13,1,41,0.15)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-surface-muted border-b border-border-strong text-[11px] text-text-primary uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Lớp học</th>
                <th className="px-4 py-3 whitespace-nowrap">Khối / Năm học</th>
                <th className="px-4 py-3 whitespace-nowrap">Phòng học</th>
                <th className="px-4 py-3 whitespace-nowrap">Giáo viên chủ nhiệm</th>
                <th className="px-4 py-3 whitespace-nowrap">Sĩ số</th>
                <th className="px-4 py-3 whitespace-nowrap">Trạng thái</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-secondary">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted text-sm">
                    Không có lớp học nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((c) => {
                  const teacher = teachers.find((t) => t.id === c.teacher_id);
                  const classStudents = students.filter((s) => s.class_id === c.id);
                  return (
                    <tr key={c.id} className="hover:bg-accent/15 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-sm bg-accent text-text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 border border-border-strong shadow-[1px_1px_0px_0px_rgba(13,1,41,0.2)]">
                            {c.grade}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedClassDetail(c)}
                              className="font-bold text-text-primary hover:text-teal transition-colors block text-xs text-left cursor-pointer"
                            >
                              {c.name}
                            </button>
                            <span className="text-[11px] text-text-muted">
                              {c.desk_count * 2} chỗ ngồi chuẩn
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-bold text-text-primary block">Khối {c.grade}</span>
                        <span className="text-[11px] text-text-muted">{c.school_year}</span>
                      </td>

                      <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                        {c.room_name || <span className="text-text-muted italic text-[11px]">Chưa xếp phòng</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {teacher ? (
                          <div className="text-xs">
                            <span className="font-bold text-text-primary block">
                              {teacher.name}
                            </span>
                            <span className="text-[11px] text-text-muted">{teacher.email}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-warning bg-warning-bg px-2 py-0.5 rounded-sm border border-warning/30 font-bold whitespace-nowrap">
                            Chưa phân công
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <span className="font-bold text-text-primary">
                          {classStudents.length}
                        </span>
                        <span className="text-[11px] text-text-muted">/{c.max_students} HS</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {c.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-success-bg text-success border border-success/30 rounded-sm whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            Đang học
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-surface-muted text-text-muted border border-border rounded-sm whitespace-nowrap">
                            Đã lưu trữ
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedClassDetail(c)}
                            title="Xem GVCN & Phân công 10 GVBM"
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-sm border border-transparent hover:border-border transition-colors cursor-pointer"
                          >
                            <Users size={16} />
                          </button>

                          <button
                            onClick={() => openEditModal(c)}
                            title="Chỉnh sửa lớp / Đổi giáo viên"
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-sm border border-transparent hover:border-border transition-colors cursor-pointer"
                          >
                            <PencilSimple size={16} />
                          </button>

                          {c.status === 'active' && (
                            <button
                              onClick={() => setTargetArchiveClass(c)}
                              title="Lưu trữ lớp học này"
                              className="p-1.5 text-text-muted hover:text-warning hover:bg-warning-bg rounded-sm border border-transparent hover:border-warning/30 transition-colors cursor-pointer"
                            >
                              <Archive size={16} />
                            </button>
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

      {/* Add / Edit Class Modal */}
      <Modal
        isOpen={isAddModalOpen || !!editingClass}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingClass(null);
        }}
        title={editingClass ? 'Chỉnh sửa Lớp học' : 'Tạo Lớp học mới'}
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                id="className"
                label="Tên lớp học *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="VD: Lớp 9A1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Khối lớp *
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
              >
                <option value={6}>Khối 6</option>
                <option value={7}>Khối 7</option>
                <option value={8}>Khối 8</option>
                <option value={9}>Khối 9</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                id="room"
                label="Phòng học"
                value={formData.room_name}
                onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                placeholder="VD: Phòng 204 — Nhà A"
              />
            </div>
            <div>
              <Input
                id="year"
                label="Năm học *"
                value={formData.school_year}
                onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
                required
                placeholder="2026 - 2027"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Giáo viên chủ nhiệm phụ trách
            </label>
            <select
              value={formData.teacher_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, teacher_id: e.target.value ? e.target.value : null })
              }
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
            >
              <option value="">-- Chưa phân công giáo viên --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email}) {t.status === 'disabled' ? '[Đã khóa]' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-text-muted mt-1">
              Chỉ giáo viên được phân công mới có quyền truy cập dữ liệu của lớp này.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                id="maxStudents"
                type="number"
                label="Sĩ số tối đa"
                value={formData.max_students.toString()}
                onChange={(e) =>
                  setFormData({ ...formData, max_students: parseInt(e.target.value, 10) || 40 })
                }
              />
            </div>
            <div>
              <Input
                id="deskCount"
                type="number"
                label="Số lượng bàn học"
                value={formData.desk_count.toString()}
                onChange={(e) =>
                  setFormData({ ...formData, desk_count: parseInt(e.target.value, 10) || 20 })
                }
                disabled={!!editingClass}
              />
              {editingClass && (
                <p className="text-[10px] text-text-muted mt-1">Cố định 20 bàn (40 chỗ ngồi chuẩn)</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingClass(null);
              }}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              {editingClass ? 'Lưu thay đổi' : 'Tạo lớp học'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Class Detail & Teacher Assignments Modal */}
      <Modal
        isOpen={!!selectedClassDetail}
        onClose={() => setSelectedClassDetail(null)}
        title={`Chi tiết & Phân công Giáo viên - ${selectedClassDetail?.name || ''}`}
        description={`Quản lý Giáo viên Chủ nhiệm (GVCN) và 10 Giáo viên Bộ môn (GVBM) cho lớp ${selectedClassDetail?.name || ''}`}
      >
        {selectedClassDetail && (
          <div className="space-y-5">
            {/* Quick overview */}
            <div className="p-3 bg-surface-muted rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-text-primary">Khối {selectedClassDetail.grade}</span>
                <span className="text-text-muted ml-2">Phòng: {selectedClassDetail.room_name || 'Chưa xếp'}</span>
                <span className="text-text-muted ml-2">Năm học: {selectedClassDetail.school_year}</span>
              </div>
              <div className="text-text-muted">
                Sĩ số: <strong className="text-text-primary">{students.filter((s) => s.class_id === selectedClassDetail.id).length}</strong>/{selectedClassDetail.max_students} HS
              </div>
            </div>

            {/* Homeroom Teacher Section */}
            <div className="p-4 rounded-xl border border-border bg-surface space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <UserSwitch size={14} className="text-emerald-600" />
                  Giáo viên Chủ nhiệm (GVCN)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                  Toàn quyền quản lý lớp
                </span>
              </div>

              <select
                value={selectedClassDetail.teacher_id || ''}
                onChange={(e) => handleReassignHomeroom(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-border rounded-lg text-xs font-medium focus:outline-none focus:border-accent"
              >
                <option value="">-- Chưa phân công GVCN --</option>
                {teachers
                  .filter((t) => t.status === 'active')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
              </select>
            </div>

            {/* 10 Subject Teachers Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <BookOpen size={14} className="text-accent" />
                  10 Giáo viên Bộ môn (GVBM)
                </span>
                <span className="text-[11px] text-text-muted">
                  Quyền điểm danh & tra cứu sơ đồ
                </span>
              </div>

              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border text-xs max-h-80 overflow-y-auto">
                {subjects.map((sub) => {
                  const currentAssignment = subjectAssignments.find(
                    (sa) => sa.class_id === selectedClassDetail.id && sa.subject_id === sub.id
                  );
                  const assignedTeacher = currentAssignment
                    ? teachers.find((t) => t.id === currentAssignment.teacher_id)
                    : null;

                  return (
                    <div
                      key={sub.id}
                      className="p-2.5 flex items-center justify-between gap-3 hover:bg-surface-subtle/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-32">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-muted text-text-secondary font-semibold">
                          {sub.code}
                        </span>
                        <span className="font-medium text-text-primary">{sub.name}</span>
                      </div>

                      <div className="flex-1 max-w-xs">
                        <select
                          value={currentAssignment?.teacher_id || ''}
                          onChange={(e) => handleAssignSubjectTeacher(sub.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-md text-xs text-text-secondary focus:outline-none focus:border-accent"
                        >
                          <option value="">-- Chưa gán GVBM --</option>
                          {teachers
                            .filter((t) => t.status === 'active')
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setSelectedClassDetail(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Archive Class Dialog */}
      <ConfirmDialog
        isOpen={!!targetArchiveClass}
        onClose={() => setTargetArchiveClass(null)}
        onConfirm={handleArchiveClass}
        title="Lưu trữ lớp học"
        description={`Bạn có chắc chắn muốn lưu trữ lớp "${targetArchiveClass?.name}"? Lớp sẽ được ẩn khỏi danh sách lớp hoạt động và giải phóng giáo viên chủ nhiệm.`}
        confirmText="Lưu trữ lớp"
        variant="danger"
      />
    </div>
  );
}
