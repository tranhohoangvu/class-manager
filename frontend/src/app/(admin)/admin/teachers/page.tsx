'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Lock,
  LockOpen,
  Key,
  ChalkboardTeacher,
  Phone,
  EnvelopeSimple,
  Check,
  Eye,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Chalkboard,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { TeacherService, ClassService } from '@/services';
import { UserRow, ClassRow, TeacherFormData, SubjectRow, SubjectAssignmentRow } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

const getSubjectBadgeStyle = (code?: string) => {
  switch (code) {
    case 'TOAN':
      return 'bg-blue-50 text-blue-700 border-blue-200/80';
    case 'VAN':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    case 'ANH':
      return 'bg-purple-50 text-purple-700 border-purple-200/80';
    case 'KHTN':
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    case 'LS_DL':
      return 'bg-orange-50 text-orange-700 border-orange-200/80';
    case 'TIN':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200/80';
    case 'GDCD':
      return 'bg-teal-50 text-teal-700 border-teal-200/80';
    case 'CONG_NGHE':
      return 'bg-stone-100 text-stone-700 border-stone-300';
    case 'AM_NHAC':
      return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80';
    case 'MY_THUAT':
      return 'bg-rose-50 text-rose-700 border-rose-200/80';
    case 'GDTC':
      return 'bg-lime-50 text-lime-800 border-lime-200/80';
    default:
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
  }
};

export default function AdminTeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignmentRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [isLoaded, setIsLoaded] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<UserRow | null>(null);
  const [selectedTeacherDetail, setSelectedTeacherDetail] = useState<UserRow | null>(null);
  const [targetToggleUser, setTargetToggleUser] = useState<UserRow | null>(null);
  const [targetResetUser, setTargetResetUser] = useState<UserRow | null>(null);

  // Form states
  const [formData, setFormData] = useState<TeacherFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'active',
    assigned_class_ids: [],
  });

  const loadData = () => {
    setTeachers(TeacherService.getTeachers());
    setClasses(ClassService.getClasses().filter((c) => c.status === 'active'));
    setSubjects(LocalStore.getSubjects());
    setSubjectAssignments(LocalStore.getSubjectAssignments());
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        search.trim() === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.email.toLowerCase().includes(search.toLowerCase()) ||
        (t.phone && t.phone.includes(search));
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [teachers, search, statusFilter]);

  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: 'password123',
      status: 'active',
      assigned_class_ids: [],
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (teacher: UserRow) => {
    setEditingTeacher(teacher);
    // Find classes currently assigned to this teacher
    const assigned = classes.filter((c) => c.teacher_id === teacher.id).map((c) => c.id);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      status: teacher.status,
      assigned_class_ids: assigned,
    });
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Vui lòng điền đủ Họ tên và Email');
      return;
    }

    if (editingTeacher) {
      const res = TeacherService.updateTeacher(editingTeacher.id, formData, user);
      if (!res.success) {
        toast.error(res.error || 'Cập nhật giáo viên thất bại');
        return;
      }
      toast.success('Đã cập nhật thông tin giáo viên');
      setEditingTeacher(null);
    } else {
      const res = TeacherService.createTeacher(formData, user);
      if (!res.success) {
        toast.error(res.error || 'Tạo tài khoản thất bại');
        return;
      }
      toast.success('Đã tạo tài khoản giáo viên mới');
      setIsAddModalOpen(false);
    }

    loadData();
  };

  const handleToggleStatus = () => {
    if (!targetToggleUser) return;
    const res = TeacherService.toggleTeacherStatus(targetToggleUser.id, user);
    if (!res.success) {
      toast.error(res.error || 'Thao tác thất bại');
      setTargetToggleUser(null);
      return;
    }
    const updated = res.data;
    if (updated) {
      toast.success(
        updated.status === 'active'
          ? `Đã kích hoạt lại tài khoản ${updated.name}`
          : `Đã vô hiệu hóa tài khoản ${updated.name}`
      );
      loadData();
    }
    setTargetToggleUser(null);
  };

  const handleResetPassword = () => {
    if (!targetResetUser) return;
    const res = TeacherService.resetPassword(targetResetUser.id, user);
    if (!res.success) {
      toast.error(res.error || 'Đặt lại mật khẩu thất bại');
    } else {
      toast.success(`Đã reset mật khẩu của ${targetResetUser.name} về mặc định: password123`);
    }
    setTargetResetUser(null);
  };

  const toggleClassAssignment = (classId: string) => {
    const current = formData.assigned_class_ids || [];
    if (current.includes(classId)) {
      setFormData({
        ...formData,
        assigned_class_ids: current.filter((id) => id !== classId),
      });
    } else {
      setFormData({
        ...formData,
        assigned_class_ids: [...current, classId],
      });
    }
  };

  const homeroomCount = classes.filter((c) => c.teacher_id).length;
  const activeTeachersCount = teachers.filter((t) => t.status === 'active').length;
  const subjectAssignedTeachersCount = new Set(subjectAssignments.map((sa) => sa.teacher_id)).size;

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
            Quản lý Đội ngũ Giáo viên
          </h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Quản lý hồ sơ, cấp tài khoản và phân công chuyên môn giáo viên chủ nhiệm & bộ môn
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openAddModal} className="gap-2 self-start md:self-auto">
          <Plus size={16} weight="bold" />
          <span>Thêm Giáo viên</span>
        </Button>
      </div>

      {/* KPI Stats Mini Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface rounded-sm border border-border-strong p-3.5 shadow-[1px_1px_0px_#000]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Tổng số giáo viên</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-text-primary">{teachers.length}</span>
            <span className="text-xs text-text-muted">thầy cô</span>
          </div>
        </div>

        <div className="bg-surface rounded-sm border border-border-strong p-3.5 shadow-[1px_1px_0px_#000]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Phân công GVCN</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-success">{homeroomCount}</span>
            <span className="text-xs text-text-muted">/16 lớp (100%)</span>
          </div>
        </div>

        <div className="bg-surface rounded-sm border border-border-strong p-3.5 shadow-[1px_1px_0px_#000]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Giáo viên bộ môn</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-teal">{subjectAssignedTeachersCount}</span>
            <span className="text-xs text-text-muted">đã nhận lớp</span>
          </div>
        </div>

        <div className="bg-surface rounded-sm border border-border-strong p-3.5 shadow-[1px_1px_0px_#000]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Đang hoạt động</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-text-primary">{activeTeachersCount}</span>
            <span className="text-[11px] text-success font-bold bg-success-bg px-1.5 py-0.5 rounded-sm border border-success/30">
              {Math.round((activeTeachersCount / (teachers.length || 1)) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-9 bg-surface border border-border-strong rounded-sm text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-text-muted shadow-[1px_1px_0px_rgba(13,1,41,0.1)] transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-secondary">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 bg-surface border border-border-strong px-3 rounded-sm text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer text-text-primary shadow-[1px_1px_0px_rgba(13,1,41,0.1)]"
          >
            <option value="all">Tất cả ({teachers.length})</option>
            <option value="active">Đang hoạt động ({activeTeachersCount})</option>
            <option value="disabled">Đã khóa ({teachers.length - activeTeachersCount})</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-sm border border-border-strong overflow-hidden shadow-[2px_2px_0px_0px_rgba(13,1,41,0.15)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-surface-muted border-b border-border-strong text-[11px] text-text-primary uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Giáo viên</th>
                <th className="px-4 py-3 whitespace-nowrap">Môn phụ trách</th>
                <th className="px-4 py-3 whitespace-nowrap">Lớp GVCN</th>
                <th className="px-4 py-3 min-w-[220px]">Lớp GVBM</th>
                <th className="px-4 py-3 whitespace-nowrap">Trạng thái</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-secondary">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted text-sm">
                    Không tìm thấy giáo viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => {
                  const teacherAssignments = subjectAssignments.filter((sa) => sa.teacher_id === t.id);
                  const subjectId = t.subject_id || (teacherAssignments.length > 0 ? teacherAssignments[0].subject_id : null);
                  const subject = subjects.find((s) => s.id === subjectId);
                  const homeroomClass = classes.find((c) => c.teacher_id === t.id);
                  const subjectClassList = teacherAssignments
                    .map((sa) => classes.find((c) => c.id === sa.class_id))
                    .filter(Boolean) as ClassRow[];

                  // Distinct grades taught
                  const gradesTaught = Array.from(new Set(subjectClassList.map((c) => c.grade)));

                  return (
                    <tr key={t.id} className="hover:bg-accent/15 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-sm bg-accent text-text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 border border-border-strong shadow-[1px_1px_0px_0px_rgba(13,1,41,0.2)]">
                            {t.name.charAt(t.name.lastIndexOf(' ') + 1) || t.name.charAt(0)}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedTeacherDetail(t)}
                              className="font-bold text-text-primary hover:text-teal transition-colors block text-xs text-left cursor-pointer"
                            >
                              {t.name}
                            </button>
                            <span className="text-[11px] text-text-muted block">{t.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {subject ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold border shadow-[1px_1px_0px_0px_rgba(13,1,41,0.1)] whitespace-nowrap ${getSubjectBadgeStyle(
                              subject.code
                            )}`}
                          >
                            <BookOpen size={13} weight="bold" />
                            {subject.name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-text-muted italic bg-surface-muted px-2 py-0.5 rounded-sm border border-border whitespace-nowrap">
                            Chưa gán môn
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {homeroomClass ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold bg-success-bg text-success border border-success/30 shadow-[1px_1px_0px_0px_rgba(45,106,79,0.15)] whitespace-nowrap">
                            <Chalkboard size={14} weight="bold" />
                            <span>{homeroomClass.name}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted italic whitespace-nowrap">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                          {subjectClassList.length > 0 ? (
                            <>
                              {subjectClassList.slice(0, 4).map((c) => (
                                <span
                                  key={c.id}
                                  className="px-2 py-0.5 text-[11px] font-bold bg-surface-muted text-text-secondary rounded-sm border border-border whitespace-nowrap"
                                >
                                  {c.name}
                                </span>
                              ))}
                              {subjectClassList.length > 4 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-teal-subtle text-teal border border-teal/30 rounded-sm whitespace-nowrap">
                                  +{subjectClassList.length - 4}
                                </span>
                              )}
                              {gradesTaught.length > 0 && (
                                <span className="text-[10px] text-text-muted px-1 whitespace-nowrap font-medium">
                                  ({gradesTaught.length}/2 khối)
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-text-muted italic">—</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {t.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-success-bg text-success border border-success/30 rounded-sm whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-danger-bg text-danger border border-danger/30 rounded-sm whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedTeacherDetail(t)}
                            title="Xem chi tiết phân công"
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-sm border border-transparent hover:border-border transition-colors cursor-pointer"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => openEditModal(t)}
                            title="Chỉnh sửa thông tin"
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-sm border border-transparent hover:border-border transition-colors cursor-pointer"
                          >
                            <PencilSimple size={16} />
                          </button>

                          <button
                            onClick={() => setTargetResetUser(t)}
                            title="Đặt lại mật khẩu (password123)"
                            className="p-1.5 text-text-muted hover:text-warning hover:bg-warning-bg rounded-sm border border-transparent hover:border-warning/30 transition-colors cursor-pointer"
                          >
                            <Key size={16} />
                          </button>

                          <button
                            onClick={() => setTargetToggleUser(t)}
                            title={t.status === 'active' ? 'Vô hiệu hóa tài khoản' : 'Mở khóa'}
                            className={`p-1.5 rounded-sm border border-transparent transition-colors cursor-pointer ${
                              t.status === 'active'
                                ? 'text-text-muted hover:text-danger hover:bg-danger-bg hover:border-danger/30'
                                : 'text-success hover:bg-success-bg hover:border-success/30'
                            }`}
                          >
                            {t.status === 'active' ? <Lock size={16} /> : <LockOpen size={16} />}
                          </button>
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

      {/* Add / Edit Teacher Modal */}
      <Modal
        isOpen={isAddModalOpen || !!editingTeacher}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTeacher(null);
        }}
        title={editingTeacher ? 'Chỉnh sửa Giáo viên' : 'Thêm Giáo viên mới'}
      >
        <form onSubmit={handleSaveTeacher} className="space-y-4">
          <div>
            <Input
              id="name"
              label="Họ và tên giáo viên *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="VD: Thầy Nguyễn Văn Nam"
            />
          </div>

          <div>
            <Input
              id="email"
              type="email"
              label="Email đăng nhập *"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="nam.nguyen@school.edu.vn"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                id="phone"
                label="Số điện thoại"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Trạng thái
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
              >
                <option value="active">Đang hoạt động</option>
                <option value="disabled">Khóa tài khoản</option>
              </select>
            </div>
          </div>

          {!editingTeacher && (
            <div>
              <Input
                id="password"
                type="text"
                label="Mật khẩu ban đầu"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="password123"
              />
              <p className="text-[11px] text-text-muted mt-1">
                Mật khẩu mẫu ở prototype (mặc định: password123)
              </p>
            </div>
          )}

          {/* Assign Classes */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Phân công lớp phụ trách
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded-lg bg-surface-muted/30">
              {classes.map((cls) => {
                const isSelected = (formData.assigned_class_ids || []).includes(cls.id);
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => toggleClassAssignment(cls.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-accent-subtle border-accent text-accent'
                        : 'bg-surface border-border text-text-secondary hover:border-text-muted'
                    }`}
                  >
                    <span>{cls.name}</span>
                    {isSelected && <Check size={12} weight="bold" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              Nhấp để chọn một hoặc nhiều lớp học phụ trách.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingTeacher(null);
              }}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              {editingTeacher ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Teacher Detail Modal */}
      <Modal
        isOpen={!!selectedTeacherDetail}
        onClose={() => setSelectedTeacherDetail(null)}
        title="Hồ sơ & Phân công Giáo viên"
        description="Thông tin chi tiết giáo viên và các lớp chủ nhiệm, bộ môn được phân công"
      >
        {selectedTeacherDetail && (() => {
          const teacherAssignments = subjectAssignments.filter((sa) => sa.teacher_id === selectedTeacherDetail.id);
          const subjectId = selectedTeacherDetail.subject_id || (teacherAssignments.length > 0 ? teacherAssignments[0].subject_id : null);
          const subject = subjects.find((s) => s.id === subjectId);
          const homeroomClass = classes.find((c) => c.teacher_id === selectedTeacherDetail.id);
          const subjectClassList = teacherAssignments
            .map((sa) => classes.find((c) => c.id === sa.class_id))
            .filter(Boolean) as ClassRow[];

          const allAssignedClasses = [
            ...(homeroomClass ? [homeroomClass] : []),
            ...subjectClassList,
          ];
          const distinctGrades = Array.from(new Set(allAssignedClasses.map((c) => c.grade))).sort();

          return (
            <div className="space-y-5">
              {/* Teacher Bio Header */}
              <div className="p-4 bg-surface-muted rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/20 text-accent font-bold text-base flex items-center justify-center">
                    {selectedTeacherDetail.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary text-base">
                      {selectedTeacherDetail.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                      <span>{selectedTeacherDetail.email}</span>
                      {selectedTeacherDetail.phone && <span>• {selectedTeacherDetail.phone}</span>}
                    </div>
                  </div>
                </div>

                <div>
                  {selectedTeacherDetail.status === 'active' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                      Đã khóa
                    </span>
                  )}
                </div>
              </div>

              {/* Subject Specialist */}
              <div className="p-3.5 bg-surface border border-border rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-accent" />
                  <span className="text-text-muted font-medium">Bộ môn chuyên trách:</span>
                  <span className="font-semibold text-text-primary">
                    {subject ? `${subject.name} (${subject.code})` : 'Chưa phân công'}
                  </span>
                </div>
                {distinctGrades.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-surface-muted text-text-secondary text-[11px]">
                    Khối phụ trách: {distinctGrades.map((g) => `Khối ${g}`).join(', ')}
                  </span>
                )}
              </div>

              {/* Homeroom Assignment */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted block">
                  Lớp Chủ nhiệm (GVCN)
                </span>
                {homeroomClass ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                        {homeroomClass.name}
                      </span>
                      <span className="text-text-muted">
                        (Phòng: {homeroomClass.room_name || 'Chưa xếp'})
                      </span>
                    </div>
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                      Toàn quyền quản lý lớp
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic p-2.5 bg-surface-muted/50 rounded-lg">
                    Giáo viên này hiện không chủ nhiệm lớp nào.
                  </p>
                )}
              </div>

              {/* Subject Classes Assignments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Các lớp dạy Bộ môn ({subjectClassList.length} lớp)
                  </span>
                  <span className="text-[11px] text-text-muted">Quyền điểm danh tiết</span>
                </div>

                {subjectClassList.length === 0 ? (
                  <p className="text-xs text-text-muted italic p-2.5 bg-surface-muted/50 rounded-lg">
                    Chưa được phân công dạy bộ môn ở lớp nào.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {subjectClassList.map((cls) => (
                      <div
                        key={cls.id}
                        className="p-2.5 bg-surface border border-border rounded-lg text-xs flex items-center justify-between"
                      >
                        <span className="font-medium text-text-primary">{cls.name}</span>
                        <span className="text-[11px] text-text-muted">
                          {cls.room_name || `Khối ${cls.grade}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <Button variant="secondary" onClick={() => setSelectedTeacherDetail(null)}>
                  Đóng
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Confirm Lock / Unlock Dialog */}
      <ConfirmDialog
        isOpen={!!targetToggleUser}
        onClose={() => setTargetToggleUser(null)}
        onConfirm={handleToggleStatus}
        title={
          targetToggleUser?.status === 'active'
            ? 'Vô hiệu hóa tài khoản giáo viên'
            : 'Kích hoạt lại tài khoản giáo viên'
        }
        description={
          targetToggleUser?.status === 'active'
            ? `Bạn có chắc chắn muốn khóa tài khoản "${targetToggleUser?.name}"? Giáo viên này sẽ không thể đăng nhập vào hệ thống.`
            : `Mở khóa tài khoản cho "${targetToggleUser?.name}". Giáo viên sẽ có thể tiếp tục đăng nhập quản lý lớp học.`
        }
        confirmText={targetToggleUser?.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
        variant={targetToggleUser?.status === 'active' ? 'danger' : 'primary'}
      />

      {/* Confirm Reset Password Dialog */}
      <ConfirmDialog
        isOpen={!!targetResetUser}
        onClose={() => setTargetResetUser(null)}
        onConfirm={handleResetPassword}
        title="Đặt lại mật khẩu giáo viên"
        description={`Bạn có chắc chắn muốn đặt lại mật khẩu cho giáo viên "${targetResetUser?.name}" về mặc định "password123"?`}
        confirmText="Đặt lại mật khẩu"
        variant="primary"
      />
    </div>
  );
}
