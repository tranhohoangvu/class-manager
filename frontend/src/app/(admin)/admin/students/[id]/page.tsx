'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Armchair,
  CalendarCheck,
  NotePencil,
  Plus,
  Trash,
  GenderMale,
  GenderFemale,
  Phone,
  PhoneCall,
  EnvelopeSimple,
  Calendar,
  ChatCircleDots,
  ChatText,
  Copy,
  Check,
  PaperPlaneTilt,
  PencilSimple,
  ShieldCheck,
  ArrowsClockwise,
  WarningCircle,
  Chalkboard,
  ArrowsLeftRight,
} from '@phosphor-icons/react';
import { Modal } from '@/components/ui/modal';
import {
  StudentService,
  SeatingService,
  NoteService,
  AttendanceService,
  ClassService,
} from '@/services';
import { StudentRow, DeskWithSeats, StudentNoteRow, AttendanceRow, ClassRow, StudentFormData, UserRow, StudentStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { StudentStatusBadge, AttendanceBadge } from '@/components/ui/badge';
import { formatDateVietnamese, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { LocalStore } from '@/lib/store';

// Helper to normalize class display name
const formatClassName = (name?: string | null) => {
  if (!name) return '---';
  const clean = name.replace(/^lớp\s+/i, '').trim();
  return `Lớp ${clean}`;
};

export default function AdminStudentDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<StudentRow | null>(null);
  const [studentClass, setStudentClass] = useState<ClassRow | null>(null);
  const [allClasses, setAllClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [desks, setDesks] = useState<DeskWithSeats[]>([]);
  const [notes, setNotes] = useState<StudentNoteRow[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRow[]>([]);
  
  // Note state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  // Quick parent message modal
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<StudentFormData & { class_id: string; status: StudentStatus }>({
    student_code: '',
    full_name: '',
    class_id: '',
    gender: 'male',
    date_of_birth: '',
    phone: '',
    email: '',
    parent_name: '',
    address: '',
    status: 'active',
  });

  const isEditFormDirty = useMemo(() => {
    if (!student) return false;
    return (
      editFormData.student_code.trim() !== (student.student_code || '').trim() ||
      editFormData.full_name.trim() !== (student.full_name || '').trim() ||
      editFormData.class_id !== student.class_id ||
      editFormData.gender !== student.gender ||
      (editFormData.date_of_birth || '').trim() !== (student.date_of_birth || '').trim() ||
      (editFormData.phone || '').trim() !== (student.phone || '').trim() ||
      (editFormData.email || '').trim() !== (student.email || '').trim() ||
      (editFormData.parent_name || '').trim() !== (student.parent_name || '').trim() ||
      (editFormData.address || '').trim() !== (student.address || '').trim() ||
      editFormData.status !== student.status
    );
  }, [student, editFormData]);

  // Transfer Class Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetClassId, setTransferTargetClassId] = useState('');

  // Delete Student Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = () => {
    if (!studentId) return;
    const stu = StudentService.getStudentById(studentId);
    if (!stu) {
      toast.error('Không tìm thấy học sinh');
      router.push('/admin/students');
      return;
    }
    setStudent(stu);
    const cls = ClassService.getClassById(stu.class_id);
    setStudentClass(cls);
    setAllClasses(LocalStore.getClasses().filter((c) => c.status === 'active'));
    setTeachers(LocalStore.getTeachers());
    setDesks(SeatingService.getDesks(stu.class_id));
    setNotes(NoteService.getNotesForStudent(studentId));

    // Get attendance records for this student
    const allAtt = AttendanceService.getAttendanceRecords(stu.class_id);
    const stuAtt = allAtt.filter((a) => a.student_id === studentId);
    stuAtt.sort((a, b) => b.date.localeCompare(a.date));
    setAttendanceRecords(stuAtt);

    // Sync edit form
    setEditFormData({
      student_code: stu.student_code,
      full_name: stu.full_name,
      class_id: stu.class_id,
      gender: stu.gender || 'male',
      date_of_birth: stu.date_of_birth || '',
      phone: stu.phone || '',
      email: stu.email || '',
      parent_name: stu.parent_name || '',
      address: stu.address || '',
      status: stu.status,
    });
    setTransferTargetClassId(stu.class_id);
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  if (!student) {
    return (
      <div className="p-6 md:p-8 space-y-4 w-full mx-auto">
        <div className="h-6 w-32 bg-surface-muted rounded animate-pulse" />
        <div className="h-40 bg-surface-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  // Find seat and desk partner
  let currentDesk: DeskWithSeats | null = null;
  let currentSeatSide: 'left' | 'right' | null = null;
  let deskPartner: StudentRow | null = null;

  for (const desk of desks) {
    const seatL = desk.seats[0];
    const seatR = desk.seats[1];

    if (seatL?.student_id === student.id) {
      currentDesk = desk;
      currentSeatSide = 'left';
      deskPartner = seatR?.student || null;
      break;
    }
    if (seatR?.student_id === student.id) {
      currentDesk = desk;
      currentSeatSide = 'right';
      deskPartner = seatL?.student || null;
      break;
    }
  }

  // Calculate attendance metrics
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter((a) => a.status === 'present').length;
  const absentDays = attendanceRecords.filter((a) => a.status === 'absent').length;
  const lateDays = attendanceRecords.filter((a) => a.status === 'late').length;
  const excusedDays = attendanceRecords.filter((a) => a.status === 'excused').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  // Add note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const res = NoteService.addNote(student.id, newNoteContent.trim(), user);
    if (!res.success) {
      toast.error(res.error || 'Thêm ghi chú thất bại');
      return;
    }
    toast.success('Đã thêm ghi chú về học sinh');
    setNewNoteContent('');
    setIsAddingNote(false);
    setNotes(NoteService.getNotesForStudent(student.id));
  };

  // Delete note
  const handleDeleteNote = (noteId: string) => {
    const res = NoteService.deleteNote(student.id, noteId, user);
    if (!res.success) {
      toast.error(res.error || 'Xoá ghi chú thất bại');
      return;
    }
    toast.success('Đã xoá ghi chú');
    setNotes(NoteService.getNotesForStudent(student.id));
  };

  // Update student profile
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.full_name.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }

    const res = StudentService.updateStudent(
      student.id,
      {
        student_code: editFormData.student_code.trim(),
        full_name: editFormData.full_name.trim(),
        gender: editFormData.gender,
        date_of_birth: editFormData.date_of_birth || undefined,
        phone: editFormData.phone || undefined,
        email: editFormData.email || undefined,
        parent_name: editFormData.parent_name || undefined,
        address: editFormData.address || undefined,
      },
      user
    );

    if (!res.success) {
      toast.error(res.error || 'Cập nhật học sinh thất bại');
      return;
    }

    // If class or status changed
    if (editFormData.class_id !== student.class_id) {
      StudentService.updateStudent(student.id, { class_id: editFormData.class_id } as any, user);
    }
    if (editFormData.status !== student.status) {
      StudentService.updateStudent(student.id, { status: editFormData.status } as any, user);
    }

    toast.success('Cập nhật hồ sơ học sinh thành công!');
    setIsEditModalOpen(false);
    loadData();
  };

  // Quick Transfer Class
  const handleTransferClass = () => {
    if (!transferTargetClassId || transferTargetClassId === student.class_id) {
      toast.error('Vui lòng chọn lớp học mới khác lớp hiện tại');
      return;
    }

    const res = StudentService.updateStudent(student.id, { class_id: transferTargetClassId } as any, user);
    if (!res.success) {
      toast.error(res.error || 'Chuyển lớp thất bại');
      return;
    }

    const targetClass = allClasses.find((c) => c.id === transferTargetClassId);
    toast.success(`Đã chuyển học sinh sang ${formatClassName(targetClass?.name)} thành công!`);
    setIsTransferModalOpen(false);
    loadData();
  };

  // Delete student
  const handleDeleteStudent = () => {
    setIsDeleting(true);
    const res = StudentService.deleteStudent(student.id, user);
    setIsDeleting(false);

    if (!res.success) {
      toast.error(res.error || 'Xóa học sinh thất bại');
      return;
    }

    toast.success(`Đã xóa học sinh ${student.full_name} khỏi hệ thống!`);
    router.push('/admin/students');
  };

  const cleanPhone = student.phone ? student.phone.replace(/[^0-9]/g, '') : '';

  const templates = [
    {
      id: 'absent',
      title: 'Thông báo vắng mặt',
      description: 'Gửi khi học sinh vắng mặt đầu giờ chưa rõ lý do',
      body: `Kính gửi phụ huynh em ${student.full_name}, Ban Giám hiệu & GVCN ${formatClassName(studentClass?.name)} Trường THCS Nguyễn Tất Thành xin thông báo: Hôm nay em chưa có mặt tại lớp. Kính mong gia đình sớm xác nhận tình hình của em qua số điện thoại này. Trân trọng!`,
    },
    {
      id: 'late',
      title: 'Nhắc nhở đi học muộn',
      description: 'Nhắc nhở phụ huynh khi học sinh đến lớp muộn',
      body: `Kính gửi phụ huynh em ${student.full_name}, Nhà trường xin thông báo: Hôm nay em đến lớp muộn. Kính mong gia đình nhắc nhở em chuẩn bị và đi học đúng giờ để đảm bảo tiếp thu trọn vẹn bài học.`,
    },
    {
      id: 'attendance_report',
      title: 'Báo cáo chuyên cần định kỳ',
      description: 'Cập nhật số liệu tham gia học tập của học sinh',
      body: `Kính gửi phụ huynh em ${student.full_name}, Nhà trường gửi cập nhật tình hình chuyên cần của em: Tỷ lệ đi học đạt ${attendanceRate}% (${presentDays} buổi có mặt, ${absentDays} buổi vắng, ${lateDays} lần đi muộn). Cảm ơn sự đồng hành của gia đình!`,
    },
    {
      id: 'meeting',
      title: 'Hẹn trao đổi phụ huynh',
      description: 'Mời phụ huynh trao đổi riêng về tình hình học tập',
      body: `Kính gửi phụ huynh em ${student.full_name}, Ban Giám hiệu & GVCN ${formatClassName(studentClass?.name)} Trường THCS Nguyễn Tất Thành mong muốn được trao đổi với phụ huynh về tình hình học tập và rèn luyện của em. Kính mong gia đình thu xếp liên hệ lại. Trân trọng cảm ơn!`,
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full mx-auto">
      {/* =============================================
          1. TOP NAVIGATION & HERO CARD
          ============================================= */}
      <div>
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-teal hover:underline transition-colors mb-3 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại Quản lý Học sinh (Admin Portal)</span>
        </Link>

        {/* Hero Card */}
        <div className="bg-surface rounded-sm border border-border p-5 md:p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-sm bg-teal-subtle text-teal border border-teal/40 flex items-center justify-center font-extrabold text-2xl sm:text-3xl flex-shrink-0 shadow-2xs">
                {student.full_name.trim().split(' ').slice(-1)[0][0]}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                    {student.full_name}
                  </h1>
                  <StudentStatusBadge status={student.status} />
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-teal-subtle text-teal border border-teal/30 text-xs font-bold">
                    <ShieldCheck size={13} weight="bold" />
                    Admin Quản lý
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-secondary mt-2 flex-wrap">
                  <span className="font-mono font-bold text-text-primary bg-surface-muted px-2 py-0.5 rounded-xs border border-border">
                    {student.student_code}
                  </span>
                  <span>·</span>
                  <span>Lớp: <strong className="text-text-primary font-bold">{formatClassName(studentClass?.name)}</strong> (Khối {studentClass?.grade})</span>
                  <span>·</span>
                  <span>Niên khoá: <strong className="text-text-primary font-medium">{studentClass?.school_year || '2026 - 2027'}</strong></span>
                </div>
              </div>
            </div>

            {/* Admin Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="gap-1.5 h-8 px-3 text-xs font-bold cursor-pointer bg-teal hover:bg-teal-hover text-white shadow-xs"
              >
                <PencilSimple size={14} weight="bold" />
                <span>Chỉnh sửa hồ sơ</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsTransferModalOpen(true)}
                className="gap-1.5 h-8 px-3 text-xs font-bold cursor-pointer bg-surface hover:bg-surface-muted text-text-primary border-border shadow-2xs"
              >
                <ArrowsLeftRight size={14} weight="bold" className="text-teal" />
                <span>Chuyển lớp</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="gap-1.5 h-8 px-3 text-xs font-bold cursor-pointer text-danger hover:text-white hover:bg-danger border border-danger/30 hover:border-danger transition-colors"
              >
                <Trash size={14} weight="bold" />
                <span>Xóa</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* =============================================
          2. MAIN 3-COLUMN METRICS & DETAILS
          ============================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Col 1: Basic Information */}
        <div className="bg-surface rounded-sm border border-border p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <User size={16} className="text-teal" weight="duotone" />
              <span>Thông tin cá nhân & Liên lạc</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="text-teal hover:underline text-xs font-bold cursor-pointer"
            >
              Sửa
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-[11px] text-text-muted block font-medium">Giới tính</span>
              <div className="mt-1">
                {student.gender === 'male' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-xs border border-blue-200">
                    <GenderMale size={13} weight="bold" />
                    Nam
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#964253] bg-[#fcf0f2] px-2 py-0.5 rounded-xs border border-[#964253]/30">
                    <GenderFemale size={13} weight="bold" />
                    Nữ
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-text-muted block font-medium">Ngày sinh</span>
              <div className="flex items-center gap-2 text-text-primary font-semibold mt-1">
                <Calendar size={14} className="text-text-muted" />
                <span>{student.date_of_birth ? formatDateVietnamese(student.date_of_birth) : 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-text-muted block font-medium">Số điện thoại phụ huynh</span>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2 text-text-primary font-semibold font-mono">
                  <Phone size={14} className="text-text-muted" />
                  <span>{student.phone || 'Chưa cập nhật'}</span>
                </div>
                {student.phone && (
                  <div className="flex items-center gap-1">
                    <a
                      href={`tel:${cleanPhone}`}
                      className="p-1 rounded-xs bg-surface-muted hover:bg-teal-subtle text-text-secondary hover:text-teal transition-colors"
                      title="Gọi điện"
                    >
                      <PhoneCall size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsMessageModalOpen(true)}
                      className="p-1 rounded-xs bg-surface-muted hover:bg-teal-subtle text-text-secondary hover:text-teal transition-colors"
                      title="Gửi tin nhắn mẫu"
                    >
                      <ChatCircleDots size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-text-muted block font-medium">Họ tên Phụ huynh</span>
              <div className="text-text-primary font-semibold mt-1">
                {student.parent_name || 'Chưa cập nhật'}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-text-muted block font-medium">Email</span>
              <div className="flex items-center gap-2 text-text-primary font-semibold mt-1">
                <EnvelopeSimple size={14} className="text-text-muted" />
                <span className="truncate">{student.email || 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-text-muted block font-medium">Địa chỉ thường trú</span>
              <div className="text-text-secondary font-medium mt-1 leading-relaxed">
                {student.address || 'Chưa cập nhật'}
              </div>
            </div>
          </div>
        </div>

        {/* Col 2: Seating & Class Assignment */}
        <div className="bg-surface rounded-sm border border-border p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Armchair size={16} className="text-teal" weight="duotone" />
              <span>Lớp học & Vị trí chỗ ngồi</span>
            </h2>
            <Link
              href={`/admin/seating?classId=${student.class_id}`}
              className="text-teal hover:underline text-xs font-bold"
            >
              Sơ đồ
            </Link>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-[11px] text-text-muted block font-medium">Lớp hiện tại</span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-bold text-text-primary text-sm">
                  {formatClassName(studentClass?.name)}
                </span>
                <span className="font-mono text-xs text-text-muted bg-surface-muted px-2 py-0.5 rounded-xs border border-border">
                  Khối {studentClass?.grade}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-text-muted block font-medium">Giáo viên chủ nhiệm (GVCN)</span>
              <div className="text-text-primary font-semibold mt-1">
                {studentClass?.teacher_id
                  ? teachers.find((t) => t.id === studentClass.teacher_id)?.name || 'Chưa phân công'
                  : 'Chưa phân công'}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-text-muted block font-medium">Vị trí bàn học</span>
              <div className="mt-1">
                {currentDesk ? (
                  <div className="p-3 rounded-xs bg-surface-muted/60 border border-border space-y-1.5">
                    <div className="font-bold text-text-primary">
                      Dãy {currentDesk.col_num || 1} · Hàng {currentDesk.row_num || 1} (Bàn số {currentDesk.desk_number || 1})
                    </div>
                    <div className="text-[11px] text-text-secondary">
                      Vị trí ghế: <strong className="text-text-primary">{currentSeatSide === 'left' ? 'Bên trái (Vị trí 1)' : 'Bên phải (Vị trí 2)'}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xs bg-surface-muted/40 border border-dashed border-border text-text-muted italic text-[11px]">
                    Chưa được xếp chỗ ngồi trong sơ đồ lớp.
                  </div>
                )}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-text-muted block font-medium">Bạn cùng bàn</span>
              <div className="mt-1">
                {deskPartner ? (
                  <div className="flex items-center justify-between p-2 rounded-xs bg-surface-muted/40 border border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-xs bg-teal-subtle text-teal font-bold text-[10px] flex items-center justify-center border border-teal/20">
                        {deskPartner.full_name.trim().split(' ').slice(-1)[0][0]}
                      </div>
                      <span className="font-bold text-text-primary">{deskPartner.full_name}</span>
                    </div>
                    <Link
                      href={`/admin/students/${deskPartner.id}`}
                      className="text-teal hover:underline text-[11px] font-semibold"
                    >
                      Hồ sơ
                    </Link>
                  </div>
                ) : (
                  <span className="text-text-muted text-[11px] italic">Ngồi một mình hoặc bàn đơn</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Attendance Quick Card */}
        <div className="bg-surface rounded-sm border border-border p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <CalendarCheck size={16} className="text-teal" weight="duotone" />
              <span>Chuyên cần cá nhân</span>
            </h2>
            <Link
              href="/admin/attendance"
              className="text-teal hover:underline text-xs font-bold"
            >
              Toàn trường
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-xs bg-surface-muted/60 border border-border">
              <div className="text-[10px] text-text-muted font-medium">Tỷ lệ chuyên cần</div>
              <div className="text-xl font-extrabold font-mono text-teal mt-0.5">{attendanceRate}%</div>
            </div>
            <div className="p-2.5 rounded-xs bg-surface-muted/60 border border-border">
              <div className="text-[10px] text-text-muted font-medium">Có mặt đầy đủ</div>
              <div className="text-xl font-extrabold font-mono text-success mt-0.5">{presentDays} buổi</div>
            </div>
            <div className="p-2.5 rounded-xs bg-danger-bg/40 border border-danger/30">
              <div className="text-[10px] text-text-muted font-medium">Vắng không phép</div>
              <div className="text-xl font-extrabold font-mono text-danger mt-0.5">{absentDays} buổi</div>
            </div>
            <div className="p-2.5 rounded-xs bg-amber-50 dark:bg-amber-950/20 border border-amber-300">
              <div className="text-[10px] text-amber-900 font-medium">Đi muộn</div>
              <div className="text-xl font-extrabold font-mono text-amber-800 mt-0.5">{lateDays} lần</div>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <span className="text-[11px] text-text-muted block mb-2 font-medium">Ghi nhận vắng / muộn gần nhất:</span>
            {attendanceRecords.filter((a) => a.status !== 'present').length > 0 ? (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {attendanceRecords
                  .filter((a) => a.status !== 'present')
                  .slice(0, 4)
                  .map((rec, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] p-1.5 rounded-xs bg-surface-muted/40 border border-border">
                      <span className="font-mono text-text-secondary">{rec.date}</span>
                      <AttendanceBadge status={rec.status} />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-3 text-center rounded-xs bg-success-bg/30 border border-success/30 text-success text-[11px] font-bold">
                ✓ Không có vi phạm vắng hoặc muộn
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =============================================
          3. STUDENT NOTES & DISCIPLINARY LOGS
          ============================================= */}
      <div className="bg-surface rounded-sm border border-border p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xs bg-teal-subtle text-teal border border-teal/30 flex items-center justify-center font-bold">
              <NotePencil size={15} weight="bold" />
            </span>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Sổ tay Theo dõi & Đánh giá Học sinh
              </h2>
              <p className="text-[11px] text-text-muted">
                Ghi chú nề nếp, biểu dương thành tích hoặc lưu ý học tập từ Ban Giám hiệu và Giáo viên.
              </p>
            </div>
          </div>

          {!isAddingNote && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNote(true)}
              className="gap-1 h-7 px-2.5 text-xs font-bold cursor-pointer"
            >
              <Plus size={13} weight="bold" />
              <span>Thêm ghi chú</span>
            </Button>
          )}
        </div>

        {/* Add Note Form */}
        {isAddingNote && (
          <form onSubmit={handleAddNote} className="p-3 rounded-xs border border-teal/40 bg-teal-subtle/20 space-y-2.5">
            <label className="block text-xs font-bold text-text-primary">
              Nội dung ghi chú / Đánh giá mới:
            </label>
            <textarea
              rows={2}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Nhập nhận xét về nề nếp, chuyên cần, đóng góp hoặc lưu ý phụ huynh..."
              className="w-full bg-surface border border-border rounded-xs p-2 text-xs text-text-primary focus:outline-none focus:border-teal"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNoteContent('');
                }}
                className="h-7 text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!newNoteContent.trim()}
                className={cn(
                  'h-7 text-xs font-bold bg-teal hover:bg-teal-hover text-white',
                  !newNoteContent.trim() && 'opacity-40 cursor-not-allowed'
                )}
              >
                Lưu ghi chú
              </Button>
            </div>
          </form>
        )}

        {/* Notes List */}
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-xs bg-surface-muted/30 border border-border/80 flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <p className="text-text-primary font-medium leading-relaxed">{note.content}</p>
                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                  <span>Thời gian: <strong className="text-text-secondary">{formatDateVietnamese(note.created_at)}</strong></span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteNote(note.id)}
                className="text-text-muted hover:text-danger p-1 rounded-xs transition-colors cursor-pointer"
                title="Xóa ghi chú"
              >
                <Trash size={13} />
              </button>
            </div>
          ))}

          {notes.length === 0 && !isAddingNote && (
            <div className="py-6 text-center text-text-muted italic text-xs">
              Chưa có ghi chú nào về học sinh này. Nhấn &quot;Thêm ghi chú&quot; để tạo nhận xét đầu tiên.
            </div>
          )}
        </div>
      </div>

      {/* =============================================
          MODAL: EDIT STUDENT (ADMIN FULL RIGHTS)
          ============================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa Hồ sơ Học sinh"
        description="Quản trị viên có toàn quyền cập nhật thông tin cá nhân, chuyển lớp hoặc đổi trạng thái học sinh."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              className="cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveEdit}
              disabled={!isEditFormDirty}
              className={cn(
                'cursor-pointer bg-teal hover:bg-teal-hover text-white font-bold',
                !isEditFormDirty && 'opacity-40 cursor-not-allowed'
              )}
            >
              Lưu thay đổi
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 py-1 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Mã học sinh <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={editFormData.student_code}
                onChange={(e) => setEditFormData({ ...editFormData, student_code: e.target.value })}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-teal"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Họ và tên <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-bold focus:outline-none focus:border-teal"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Lớp học <span className="text-danger">*</span>
              </label>
              <select
                value={editFormData.class_id}
                onChange={(e) => setEditFormData({ ...editFormData, class_id: e.target.value })}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-medium focus:outline-none focus:border-teal cursor-pointer"
              >
                {allClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {formatClassName(cls.name)} (Khối {cls.grade})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Giới tính
              </label>
              <select
                value={editFormData.gender}
                onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as any })}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-medium focus:outline-none focus:border-teal cursor-pointer"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                value={editFormData.date_of_birth}
                onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Trạng thái học tập
              </label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-medium focus:outline-none focus:border-teal cursor-pointer"
              >
                <option value="active">Đang học</option>
                <option value="inactive">Tạm nghỉ / Đã chuyển trường</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Số điện thoại phụ huynh
              </label>
              <input
                type="tel"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="0912 345 678"
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Họ tên Phụ huynh
              </label>
              <input
                type="text"
                value={editFormData.parent_name}
                onChange={(e) => setEditFormData({ ...editFormData, parent_name: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Địa chỉ thường trú
            </label>
            <input
              type="text"
              value={editFormData.address}
              onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              placeholder="Số nhà, đường, phường/xã, quận/huyện..."
              className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-teal"
            />
          </div>
        </form>
      </Modal>

      {/* =============================================
          MODAL: QUICK TRANSFER CLASS
          ============================================= */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Chuyển lớp cho Học sinh"
        description={`Điều phối học sinh ${student.full_name} từ ${formatClassName(studentClass?.name)} sang lớp học mới.`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTransferModalOpen(false)}
              className="cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleTransferClass}
              className="cursor-pointer bg-teal hover:bg-teal-hover text-white font-bold"
            >
              Xác nhận chuyển lớp
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1 text-xs">
          <div className="p-3 rounded-xs bg-surface-muted/60 border border-border space-y-1">
            <div className="text-[11px] text-text-muted">Lớp học hiện tại:</div>
            <div className="text-sm font-bold text-text-primary">
              {formatClassName(studentClass?.name)} (Khối {studentClass?.grade})
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Chọn Lớp học chuyển đến:
            </label>
            <select
              value={transferTargetClassId}
              onChange={(e) => setTransferTargetClassId(e.target.value)}
              className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-medium focus:outline-none focus:border-teal cursor-pointer"
            >
              {allClasses
                .filter((c) => c.id !== student.class_id)
                .map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {formatClassName(cls.name)} (Khối {cls.grade} · Niên khóa: {cls.school_year})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* =============================================
          MODAL: DELETE STUDENT CONFIRMATION
          ============================================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xác nhận Xóa Học sinh"
        description="Thao tác xóa này sẽ gỡ bỏ học sinh khỏi danh sách lớp và hệ thống quản lý."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteStudent}
              disabled={isDeleting}
              className="cursor-pointer bg-danger hover:bg-danger-hover text-white font-bold shadow-xs gap-1.5"
            >
              <Trash size={14} weight="bold" />
              <span>{isDeleting ? 'Đang xóa...' : 'Xác nhận Xóa vĩnh viễn'}</span>
            </Button>
          </div>
        }
      >
        <div className="p-4 rounded-xs border-2 border-danger bg-danger-bg/40 text-xs space-y-2">
          <div className="flex items-center gap-2 text-danger font-bold text-sm">
            <WarningCircle size={18} weight="fill" />
            <span>CẢNH BÁO QUẢN TRỊ VIÊN</span>
          </div>
          <p className="text-text-primary leading-relaxed">
            Bạn có chắc chắn muốn xóa học sinh <strong className="text-danger font-bold">{student.full_name}</strong> (Mã HS: <span className="font-mono font-bold">{student.student_code}</span>) khỏi <strong>{formatClassName(studentClass?.name)}</strong>?
          </p>
          <p className="text-text-muted text-[11px]">
            Lịch sử chuyên cần và hồ sơ của học sinh này sẽ bị loại bỏ khỏi các báo cáo tổng hợp.
          </p>
        </div>
      </Modal>

      {/* =============================================
          MODAL: QUICK PARENT MESSAGES
          ============================================= */}
      <Modal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        title="Gửi Tin nhắn Mẫu cho Phụ huynh"
        description={`Soạn sẵn nội dung trao đổi cho phụ huynh em ${student.full_name}`}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMessageModalOpen(false)}
              className="cursor-pointer"
            >
              Đóng
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(templates[selectedTemplateIndex].body);
                toast.success('Đã sao chép nội dung tin nhắn!');
              }}
              className="cursor-pointer bg-teal hover:bg-teal-hover text-white font-bold gap-1.5"
            >
              <Copy size={14} />
              <span>Sao chép nội dung</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1 text-xs">
          <div className="grid grid-cols-2 gap-2">
            {templates.map((tpl, idx) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplateIndex(idx)}
                className={cn(
                  'p-2.5 rounded-xs border text-left transition-all cursor-pointer',
                  selectedTemplateIndex === idx
                    ? 'border-teal bg-teal-subtle/50 text-text-primary font-bold shadow-2xs'
                    : 'border-border bg-surface hover:bg-surface-muted text-text-secondary font-medium'
                )}
              >
                <div className="text-xs">{tpl.title}</div>
                <div className="text-[10px] text-text-muted truncate mt-0.5">{tpl.description}</div>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Nội dung gửi:
            </label>
            <textarea
              rows={4}
              readOnly
              value={templates[selectedTemplateIndex].body}
              className="w-full bg-surface-muted/50 border border-border rounded-xs p-3 text-xs text-text-primary leading-relaxed focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
