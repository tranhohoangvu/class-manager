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
  EnvelopeSimple,
  Calendar,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { StudentRow, DeskWithSeats, StudentNoteRow, AttendanceRow } from '@/types';
import { Button } from '@/components/ui/button';
import { StudentStatusBadge, AttendanceBadge } from '@/components/ui/badge';
import { formatDateVietnamese } from '@/lib/utils';
import { toast } from 'sonner';
import { useCurrentClass } from '@/contexts/class-context';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;
  const { isHomeroom } = useCurrentClass();

  const [student, setStudent] = useState<StudentRow | null>(null);
  const [desks, setDesks] = useState<DeskWithSeats[]>([]);
  const [notes, setNotes] = useState<StudentNoteRow[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRow[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const loadData = () => {
    if (!studentId) return;
    const stu = LocalStore.getStudentById(studentId);
    if (!stu) {
      toast.error('Không tìm thấy học sinh');
      router.push('/students');
      return;
    }
    setStudent(stu);
    setDesks(LocalStore.getDesks(stu.class_id));
    setNotes(LocalStore.getNotesForStudent(studentId));

    // Get attendance records for this student
    const allAtt = LocalStore.getAttendanceRecords(stu.class_id);
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

    LocalStore.addNoteForStudent(student.id, newNoteContent.trim(), student.class_id);
    toast.success('Đã thêm ghi chú về học sinh');
    setNewNoteContent('');
    setIsAddingNote(false);
    setNotes(LocalStore.getNotesForStudent(student.id));
  };

  const handleDeleteNote = (noteId: string) => {
    LocalStore.deleteNote(student.id, noteId);
    toast.success('Đã xoá ghi chú');
    setNotes(LocalStore.getNotesForStudent(student.id));
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          <span>Quay lại danh sách học sinh</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent-subtle text-accent flex items-center justify-center font-semibold text-lg">
              {student.full_name.split(' ').slice(-1)[0][0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                  {student.full_name}
                </h1>
                <StudentStatusBadge status={student.status} />
              </div>
              <p className="text-xs text-text-muted font-mono mt-0.5">
                Mã học sinh: {student.student_code} · Lớp 9A1
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Col 1: Basic Info */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary border-b border-border pb-2 flex items-center gap-2">
            <User size={16} className="text-accent" />
            Thông tin cá nhân
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-text-muted block">Giới tính</span>
              <div className="flex items-center gap-1 text-text-secondary mt-0.5">
                {student.gender === 'male' ? (
                  <>
                    <GenderMale size={15} className="text-blue-500" />
                    <span>Nam</span>
                  </>
                ) : (
                  <>
                    <GenderFemale size={15} className="text-rose-500" />
                    <span>Nữ</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-text-muted block">Ngày sinh</span>
              <div className="flex items-center gap-1.5 text-text-secondary mt-0.5">
                <Calendar size={14} className="text-text-muted" />
                <span>{student.date_of_birth || 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-text-muted block">Số điện thoại liên lạc</span>
              <div className="flex items-center gap-1.5 text-text-secondary mt-0.5">
                <Phone size={14} className="text-text-muted" />
                <span>{student.phone || 'Chưa có SĐT'}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-text-muted block">Email học sinh</span>
              <div className="flex items-center gap-1.5 text-text-secondary mt-0.5">
                <EnvelopeSimple size={14} className="text-text-muted" />
                <span>{student.email || 'Chưa có email'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Col 2: Seating Position */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary border-b border-border pb-2 flex items-center gap-2">
            <Armchair size={16} className="text-accent" />
            Vị trí chỗ ngồi
          </h2>

          {currentDesk ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-surface-subtle border border-border/80 text-center">
                <span className="text-xs font-mono text-text-muted uppercase">Vị trí hiện tại</span>
                <p className="text-lg font-semibold text-text-primary mt-1">
                  Bàn số {currentDesk.desk_number} (Ghế {currentSeatSide === 'left' ? 'bên Trái' : 'bên Phải'})
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Dãy {currentDesk.col_num} · Hàng {currentDesk.row_num}
                </p>
              </div>

              <div>
                <span className="text-xs text-text-muted block">Bạn cùng bàn:</span>
                {deskPartner ? (
                  <div className="flex items-center gap-2 mt-1.5 p-2.5 rounded-lg bg-surface-muted/50 border border-border/60">
                    <div className="w-7 h-7 rounded-full bg-accent-subtle text-accent flex items-center justify-center font-medium text-xs">
                      {deskPartner.full_name.split(' ').slice(-1)[0][0]}
                    </div>
                    <div>
                      <Link
                        href={`/students/${deskPartner.id}`}
                        className="text-xs font-medium text-text-primary hover:text-accent"
                      >
                        {deskPartner.full_name}
                      </Link>
                      <span className="text-[10px] text-text-muted block font-mono">
                        {deskPartner.student_code}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic mt-1">
                    Ngồi một mình (chỗ bên cạnh còn trống)
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Link href="/seating">
                  <Button variant="secondary" size="sm" className="w-full text-xs">
                    Mở sơ đồ để đổi chỗ
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs text-text-muted italic">Học sinh này hiện chưa được xếp chỗ ngồi.</p>
              <Link href="/seating">
                <Button variant="primary" size="sm" className="text-xs">
                  Xếp chỗ ngay
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Col 3: Attendance Summary */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary border-b border-border pb-2 flex items-center gap-2">
            <CalendarCheck size={16} className="text-accent" />
            Thống kê chuyên cần
          </h2>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-success-subtle/50 border border-success/20">
              <span className="text-xs text-success block">Có mặt</span>
              <span className="text-lg font-semibold text-success">{presentDays}</span>
              <span className="text-[10px] text-text-muted block">buổi</span>
            </div>

            <div className="p-2.5 rounded-lg bg-danger-subtle/50 border border-danger/20">
              <span className="text-xs text-danger block">Vắng</span>
              <span className="text-lg font-semibold text-danger">{absentDays}</span>
              <span className="text-[10px] text-text-muted block">buổi</span>
            </div>

            <div className="p-2.5 rounded-lg bg-warning-subtle/50 border border-warning/20">
              <span className="text-xs text-warning block">Đi muộn</span>
              <span className="text-lg font-semibold text-warning">{lateDays}</span>
              <span className="text-[10px] text-text-muted block">buổi</span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-muted border border-border">
              <span className="text-xs text-text-secondary block">Có phép</span>
              <span className="text-lg font-semibold text-text-secondary">{excusedDays}</span>
              <span className="text-[10px] text-text-muted block">buổi</span>
            </div>
          </div>

          <div className="pt-2 text-center">
            <span className="text-xs text-text-muted">Tỉ lệ tham gia học tập:</span>
            <div className="text-xl font-bold text-accent mt-0.5">{attendanceRate}%</div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Notes & Attendance History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teacher's Notes on Student */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <NotePencil size={18} className="text-accent" />
              <h2 className="text-base font-semibold text-text-primary">
                Sổ ghi chú của giáo viên
              </h2>
            </div>
            {isHomeroom && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAddingNote(!isAddingNote)}
              >
                <Plus size={14} />
                <span>Thêm ghi chú</span>
              </Button>
            )}
          </div>

          {isHomeroom && isAddingNote && (
            <form onSubmit={handleAddNote} className="p-3 bg-surface-subtle rounded-lg border border-border space-y-2">
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Ghi chú về học lực, hành vi, sức khoẻ hoặc dặn dò phụ huynh..."
                rows={3}
                className="w-full text-xs p-2.5 bg-surface rounded-md border border-border focus:outline-none focus:border-accent"
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
              <p className="text-xs text-text-muted py-6 text-center">
                Chưa có ghi chú nào về học sinh này.
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-lg bg-surface-subtle border border-border/70 text-xs space-y-1 relative group"
                >
                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <span>{formatDateVietnamese(note.created_at)}</span>
                    {isHomeroom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-opacity"
                        title="Xoá ghi chú"
                      >
                        <Trash size={13} />
                      </button>
                    )}
                  </div>
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detailed Attendance Records */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-base font-semibold text-text-primary">
              Lịch sử điểm danh gần đây
            </h2>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="text-xs text-accent">
                Xem toàn lớp →
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-border overflow-y-auto max-h-80">
            {attendanceRecords.length === 0 ? (
              <p className="text-xs text-text-muted py-6 text-center">
                Chưa có dữ liệu điểm danh cho học sinh này.
              </p>
            ) : (
              attendanceRecords.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-text-secondary">
                      {formatDateVietnamese(item.date)}
                    </span>
                    {item.note && (
                      <p className="text-[11px] text-text-muted italic mt-0.5">
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
    </div>
  );
}
