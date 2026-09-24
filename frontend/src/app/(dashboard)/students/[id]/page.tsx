'use client';

import { useState, useEffect } from 'react';
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
} from '@phosphor-icons/react';
import { Modal } from '@/components/ui/modal';
import {
  StudentService,
  SeatingService,
  NoteService,
  AttendanceService,
  ClassService,
} from '@/services';
import { StudentRow, DeskWithSeats, StudentNoteRow, AttendanceRow, ClassRow } from '@/types';
import { Button } from '@/components/ui/button';
import { StudentStatusBadge, AttendanceBadge } from '@/components/ui/badge';
import { formatDateVietnamese } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentClass } from '@/contexts/class-context';

export default function StudentDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;
  const { isHomeroom } = useCurrentClass();

  const [student, setStudent] = useState<StudentRow | null>(null);
  const [studentClass, setStudentClass] = useState<ClassRow | null>(null);
  const [desks, setDesks] = useState<DeskWithSeats[]>([]);
  const [notes, setNotes] = useState<StudentNoteRow[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRow[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);

  const loadData = () => {
    if (!studentId) return;
    const stu = StudentService.getStudentById(studentId);
    if (!stu) {
      toast.error('Không tìm thấy học sinh');
      router.push('/students');
      return;
    }
    setStudent(stu);
    setStudentClass(ClassService.getClassById(stu.class_id));
    setDesks(SeatingService.getDesks(stu.class_id));
    setNotes(NoteService.getNotesForStudent(studentId));

    // Get attendance records for this student
    const allAtt = AttendanceService.getAttendanceRecords(stu.class_id);
    const stuAtt = allAtt.filter((a) => a.student_id === studentId);
    // Sort descending by date
    stuAtt.sort((a, b) => b.date.localeCompare(a.date));
    setAttendanceRecords(stuAtt);
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  if (!student) {
    return (
      <div className="p-8 space-y-4">
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

  const handleDeleteNote = (noteId: string) => {
    const res = NoteService.deleteNote(student.id, noteId, user);
    if (!res.success) {
      toast.error(res.error || 'Xoá ghi chú thất bại');
      return;
    }
    toast.success('Đã xoá ghi chú');
    setNotes(NoteService.getNotesForStudent(student.id));
  };

  const cleanPhone = student.phone ? student.phone.replace(/[^0-9]/g, '') : '';

  const templates = [
    {
      id: 'absent',
      title: 'Thông báo vắng mặt',
      description: 'Gửi khi học sinh vắng mặt đầu giờ chưa rõ lý do',
      body: `Kính gửi phụ huynh em ${student.full_name}, GVCN ${studentClass?.name || 'lớp'} Trường THCS Nguyễn Tất Thành xin thông báo: Hôm nay em chưa có mặt tại lớp. Kính mong gia đình sớm xác nhận tình hình của em với GVCN qua số điện thoại này. Trân trọng!`,
    },
    {
      id: 'late',
      title: 'Nhắc nhở đi học muộn',
      description: 'Nhắc nhở phụ huynh khi học sinh đến lớp muộn',
      body: `Kính gửi phụ huynh em ${student.full_name}, GVCN ${studentClass?.name || 'lớp'} xin thông báo: Hôm nay em đến lớp muộn. Kính mong gia đình nhắc nhở em chuẩn bị và đi học đúng giờ để đảm bảo tiếp thu trọn vẹn bài học.`,
    },
    {
      id: 'attendance_report',
      title: 'Báo cáo chuyên cần định kỳ',
      description: 'Cập nhật số liệu tham gia học tập của học sinh',
      body: `Kính gửi phụ huynh em ${student.full_name}, GVCN ${studentClass?.name || 'lớp'} gửi cập nhật tình hình chuyên cần của em: Tỷ lệ đi học đạt ${attendanceRate}% (${presentDays} buổi có mặt, ${absentDays} buổi vắng, ${lateDays} lần đi muộn). Cảm ơn sự đồng hành của gia đình!`,
    },
    {
      id: 'meeting',
      title: 'Hẹn trao đổi phụ huynh',
      description: 'Mời phụ huynh trao đổi riêng về tình hình học tập',
      body: `Kính gửi phụ huynh em ${student.full_name}, GVCN ${studentClass?.name || 'lớp'} Trường THCS Nguyễn Tất Thành mong muốn được trao đổi ngắn với phụ huynh về tình hình học tập và rèn luyện của em. Kính mong gia đình thu xếp liên hệ lại với GVCN. Trân trọng cảm ơn!`,
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 w-full mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors mb-4 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại danh sách học sinh</span>
        </Link>

        {/* Hero Card */}
        <div className="bg-surface rounded-2xl border border-border p-6 sm:p-7 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-amber-100 text-amber-950 border border-amber-300 flex items-center justify-center font-black text-2xl sm:text-3xl flex-shrink-0 shadow-2xs">
                {student.full_name.trim().split(' ').slice(-1)[0][0]}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                    {student.full_name}
                  </h1>
                  <StudentStatusBadge status={student.status} />
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-text-secondary mt-1.5 flex-wrap">
                  <span className="font-mono font-semibold text-text-primary bg-surface-muted px-2.5 py-0.5 rounded-md border border-border">
                    {student.student_code}
                  </span>
                  <span>·</span>
                  <span>Lớp: <strong className="text-text-primary font-semibold">{studentClass?.name || '—'}</strong></span>
                  <span>·</span>
                  <span>Niên khoá: <strong className="text-text-primary font-medium">{studentClass?.school_year || '2026 - 2027'}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/seating">
                <Button variant="secondary" className="gap-2">
                  <Armchair size={18} weight="duotone" className="text-teal" />
                  <span>Xem vị trí chỗ ngồi</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Col 1: Basic Info */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4 shadow-2xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted border-b border-border pb-3 flex items-center gap-2">
            <User size={18} className="text-teal" weight="duotone" />
            Thông tin cá nhân
          </h2>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs text-text-muted block font-medium">Giới tính</span>
              <div className="flex items-center gap-1.5 text-text-primary font-semibold mt-1">
                {student.gender === 'male' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60">
                    <GenderMale size={15} weight="bold" className="text-blue-600" />
                    Nam
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200/60">
                    <GenderFemale size={15} weight="bold" className="text-rose-600" />
                    Nữ
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-text-muted block font-medium">Ngày sinh</span>
              <div className="flex items-center gap-2 text-text-primary font-medium mt-1">
                <Calendar size={16} className="text-text-muted" />
                <span>{student.date_of_birth || 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-text-muted block font-medium">Email học sinh</span>
              <div className="flex items-center gap-2 text-text-primary font-medium mt-1">
                <EnvelopeSimple size={16} className="text-text-muted" />
                <span>{student.email || 'Chưa có email'}</span>
              </div>
            </div>

            {/* Parent Contact Card */}
            <div className="pt-3 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  Liên hệ Phụ huynh
                </span>
                {student.phone && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Khả dụng
                  </span>
                )}
              </div>

              {student.phone ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-text-primary font-bold text-base bg-surface-subtle p-2.5 rounded-xl border border-border/80">
                    <Phone size={18} className="text-teal flex-shrink-0" />
                    <span className="font-mono">{student.phone}</span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={`tel:${student.phone}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                      title="Gọi điện trực tiếp cho phụ huynh"
                    >
                      <PhoneCall size={14} weight="bold" />
                      <span>Gọi điện</span>
                    </a>

                    <a
                      href={`https://zalo.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                      title="Mở ứng dụng Zalo nhắn tin cho phụ huynh"
                    >
                      <ChatCircleDots size={14} weight="bold" />
                      <span>Zalo</span>
                    </a>

                    <a
                      href={`sms:${student.phone}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-subtle border border-border text-text-primary shadow-2xs transition-colors"
                      title="Nhắn tin SMS cho phụ huynh"
                    >
                      <PaperPlaneTilt size={14} weight="bold" className="text-teal" />
                      <span>SMS</span>
                    </a>
                  </div>

                  {/* 1-Click Message Template Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsMessageModalOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-100/90 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-all cursor-pointer shadow-2xs"
                  >
                    <ChatText size={16} weight="bold" className="text-amber-800" />
                    <span>Mẫu tin nhắn thông báo 1-chạm</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-surface-muted/60 border border-border text-center text-xs text-text-muted">
                  Học sinh chưa có số điện thoại phụ huynh để liên hệ nhanh.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Col 2: Seating Position & Desk Partner */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4 shadow-2xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted border-b border-border pb-3 flex items-center gap-2">
            <Armchair size={18} className="text-teal" weight="duotone" />
            Vị trí lớp & Bạn cùng bàn
          </h2>

          {currentDesk ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-muted/70 border border-border/80 text-center">
                <span className="text-xs font-mono font-medium text-text-muted uppercase">Vị trí thực tế</span>
                <p className="text-xl font-bold text-text-primary mt-1">
                  Bàn số {currentDesk.desk_number} · Ghế {currentSeatSide === 'left' ? 'Trái' : 'Phải'}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Dãy {currentDesk.col_num} · Hàng {currentDesk.row_num} (Khu vực học tập)
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-text-muted block mb-1.5">Bạn ngồi cùng bàn:</span>
                {deskPartner ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-subtle border border-border/80">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-950 flex items-center justify-center font-bold text-xs border border-amber-300 flex-shrink-0">
                      {deskPartner.full_name.trim().split(' ').slice(-1)[0][0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/students/${deskPartner.id}`}
                        className="text-sm font-semibold text-text-primary hover:text-teal hover:underline truncate block"
                      >
                        {deskPartner.full_name}
                      </Link>
                      <span className="text-xs text-text-muted font-mono block">
                        {deskPartner.student_code}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-surface-subtle border border-dashed border-border text-center">
                    <p className="text-xs text-text-muted italic">
                      Đang ngồi một mình (ghế bên cạnh còn trống)
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-1">
                <Link href="/seating">
                  <Button variant="secondary" className="w-full text-xs gap-1.5 h-10">
                    <span>Mở sơ đồ chỗ ngồi</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-text-muted italic">Học sinh này hiện chưa được xếp chỗ ngồi.</p>
              <Link href="/seating">
                <Button variant="primary" className="gap-2">
                  <Armchair size={16} />
                  <span>Xếp chỗ ngay</span>
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Col 3: Attendance Summary */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4 shadow-2xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted border-b border-border pb-3 flex items-center gap-2">
            <CalendarCheck size={18} className="text-teal" weight="duotone" />
            Thống kê chuyên cần
          </h2>

          <div className="grid grid-cols-2 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-success-bg border border-success/20 shadow-2xs">
              <span className="text-xs text-success font-semibold block">Có mặt</span>
              <span className="text-2xl font-bold text-success mt-0.5 block">{presentDays}</span>
              <span className="text-[11px] text-text-muted block">buổi học</span>
            </div>

            <div className="p-3 rounded-xl bg-danger-bg border border-danger/20 shadow-2xs">
              <span className="text-xs text-danger font-semibold block">Vắng</span>
              <span className="text-2xl font-bold text-danger mt-0.5 block">{absentDays}</span>
              <span className="text-[11px] text-text-muted block">buổi học</span>
            </div>

            <div className="p-3 rounded-xl bg-warning-bg border border-warning/20 shadow-2xs">
              <span className="text-xs text-warning font-semibold block">Đi muộn</span>
              <span className="text-2xl font-bold text-warning mt-0.5 block">{lateDays}</span>
              <span className="text-[11px] text-text-muted block">lần</span>
            </div>

            <div className="p-3 rounded-xl bg-surface-muted border border-border shadow-2xs">
              <span className="text-xs text-text-secondary font-semibold block">Có phép</span>
              <span className="text-2xl font-bold text-text-primary mt-0.5 block">{excusedDays}</span>
              <span className="text-[11px] text-text-muted block">buổi</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border text-center">
            <span className="text-xs text-text-muted font-medium">Tỷ lệ tham gia học tập:</span>
            <div className="text-2xl font-black text-text-primary mt-0.5">{attendanceRate}%</div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Notes & Attendance History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teacher's Notes on Student */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border pb-3.5">
            <div className="flex items-center gap-2">
              <NotePencil size={20} className="text-teal" weight="duotone" />
              <h2 className="text-base font-bold text-text-primary">
                Sổ ghi chú của giáo viên
              </h2>
            </div>
            {isHomeroom && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAddingNote(!isAddingNote)}
                className="gap-1.5"
              >
                <Plus size={14} weight="bold" />
                <span>Thêm ghi chú</span>
              </Button>
            )}
          </div>

          {isHomeroom && isAddingNote && (
            <form onSubmit={handleAddNote} className="p-4 bg-surface-subtle rounded-xl border border-border space-y-3">
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Ghi chú về học lực, thái độ, sức khoẻ hoặc dặn dò phụ huynh..."
                rows={3}
                className="w-full text-sm p-3 bg-surface rounded-xl border border-border focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 placeholder:text-text-muted text-text-primary transition-all"
                required
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingNote(false)}
                >
                  Huỷ
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Lưu ghi chú
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-sm text-text-muted py-8 text-center italic">
                Chưa có ghi chú nào về học sinh này.
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-xl bg-surface-subtle border border-border/80 text-sm space-y-1.5 relative group hover:border-border transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span className="font-medium">{formatDateVietnamese(note.created_at)}</span>
                    {isHomeroom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger p-1 rounded transition-all cursor-pointer"
                        title="Xoá ghi chú"
                      >
                        <Trash size={15} />
                      </button>
                    )}
                  </div>
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap text-sm">
                    {note.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detailed Attendance Records */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border pb-3.5">
            <h2 className="text-base font-bold text-text-primary">
              Lịch sử điểm danh gần đây
            </h2>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="text-xs text-teal hover:text-teal-hover hover:underline font-bold">
                Xem toàn bộ lớp →
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-border overflow-y-auto max-h-80 pr-1">
            {attendanceRecords.length === 0 ? (
              <p className="text-sm text-text-muted py-8 text-center italic">
                Chưa có dữ liệu điểm danh cho học sinh này.
              </p>
            ) : (
              attendanceRecords.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-mono font-medium text-text-primary">
                      {formatDateVietnamese(item.date)}
                    </span>
                    {item.note && (
                      <p className="text-xs text-text-muted italic mt-0.5">
                        Lý do: {item.note}
                      </p>
                    )}
                  </div>
                  <AttendanceBadge status={item.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 1-Click Quick Message Modal */}
      {student.phone && (
        <Modal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          title="Mẫu tin nhắn liên hệ phụ huynh 1-chạm"
          description={`Gửi thông báo nhanh về học sinh ${student.full_name} (${student.student_code}) tới SĐT ${student.phone}`}
          size="2xl"
        >
          <div className="space-y-4">
            {/* Template Selector Cards */}
            <div className="grid grid-cols-2 gap-2">
              {templates.map((tpl, idx) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateIndex(idx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${selectedTemplateIndex === idx
                    ? 'border-accent bg-accent-subtle/50 text-text-primary shadow-xs'
                    : 'border-border bg-surface hover:bg-surface-subtle text-text-secondary'
                    }`}
                >
                  <p className={`text-xs font-bold ${selectedTemplateIndex === idx ? 'text-amber-950 font-black' : 'text-text-primary'}`}>
                    {tpl.title}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                    {tpl.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Message Preview Box */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                Nội dung tin nhắn:
              </span>
              <div className="p-4 rounded-xl bg-surface-subtle border border-border text-xs leading-relaxed text-text-primary font-medium whitespace-pre-wrap select-all">
                {templates[selectedTemplateIndex]?.body}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const text = templates[selectedTemplateIndex]?.body || '';
                  navigator.clipboard.writeText(text);
                  toast.success('Đã sao chép nội dung tin nhắn!');
                }}
                className="gap-1.5"
              >
                <Copy size={15} weight="bold" className="text-text-muted" />
                <span>Sao chép tin nhắn</span>
              </Button>

              <div className="flex items-center gap-2">
                <a
                  href={`sms:${student.phone}?body=${encodeURIComponent(templates[selectedTemplateIndex]?.body || '')}`}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-subtle border border-border text-text-primary shadow-2xs transition-colors"
                >
                  <PaperPlaneTilt size={14} weight="bold" className="text-teal" />
                  <span>Gửi qua SMS</span>
                </a>

                <a
                  href={`https://zalo.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    const text = templates[selectedTemplateIndex]?.body || '';
                    navigator.clipboard.writeText(text);
                    toast.info('Đã sao chép tin nhắn. Hãy dán vào ô chat Zalo với phụ huynh!');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                >
                  <ChatCircleDots size={14} weight="bold" />
                  <span>Mở Zalo gửi tin</span>
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
