'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Shuffle,
  ArrowsClockwise,
  UserPlus,
  X,
  ArrowsLeftRight,
  Info,
  Check,
  Armchair,
  GenderMale,
  GenderFemale,
  Printer,
  ChalkboardTeacher,
  Chalkboard,
  Door,
  Desktop,
  ArrowDown,
  ArrowUp,
  ArrowsDownUp,
  CheckCircle,
  Sparkle,
  CalendarCheck,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react';
import { SeatingService, StudentService, AttendanceService } from '@/services';
import { LocalStore } from '@/lib/store';
import { DeskWithSeats, StudentRow, SeatWithStudent } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentClass } from '@/contexts/class-context';
import { getTodayISO, formatDateVietnamese, cn } from '@/lib/utils';

const PERSISTENCE_KEY = 'cm_seating_perspective';

export default function SeatingPage() {
  const { user } = useAuth();
  const { currentClassId, currentClass, isHomeroom, isSubjectTeacher, teacherSubjects } = useCurrentClass();
  const [desks, setDesks] = useState<DeskWithSeats[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // View mode with persistence:
  // 'nhin_tu_duoi_len' (View A: Looking from back toward board - default)
  // 'nhin_tu_buc_giang' (View B: Looking from teaching platform down toward back)
  const [viewPerspective, setViewPerspective] = useState<'nhin_tu_duoi_len' | 'nhin_tu_buc_giang'>(
    'nhin_tu_duoi_len'
  );

  // Enhancement: Attendance overlay state & data
  const [showAttendanceOverlay, setShowAttendanceOverlay] = useState(false);
  const [todayAttendanceMap, setTodayAttendanceMap] = useState<Map<string, string>>(new Map());

  // Enhancement: Gender filter state
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  // Load saved perspective from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PERSISTENCE_KEY);
      if (saved === 'nhin_tu_duoi_len' || saved === 'nhin_tu_buc_giang') {
        setViewPerspective(saved);
      }
    }
  }, []);

  const handleTogglePerspective = () => {
    const next = viewPerspective === 'nhin_tu_duoi_len' ? 'nhin_tu_buc_giang' : 'nhin_tu_duoi_len';
    setViewPerspective(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PERSISTENCE_KEY, next);
    }
  };

  const teacherName = useMemo(() => {
    if (!currentClass?.teacher_id) return null;
    const t = LocalStore.getTeachers().find((u) => u.id === currentClass.teacher_id);
    return t ? t.name : null;
  }, [currentClass]);

  const loadData = () => {
    if (!currentClassId) return;
    setDesks(SeatingService.getDesks(currentClassId));
    setStudents(StudentService.getStudents(currentClassId));
    setSelectedSeatId(null);

    // Load today's attendance records for overlay
    const todayStr = getTodayISO();
    const todayAtts = AttendanceService.getAttendanceForDate(todayStr, currentClassId);
    const attMap = new Map<string, string>();
    todayAtts.forEach((att) => {
      attMap.set(att.student_id, att.status);
    });
    setTodayAttendanceMap(attMap);

    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, [currentClassId]);

  // Calculate unseated students
  const unseatedStudents = useMemo(() => {
    const seatedStudentIds = new Set<string>();
    desks.forEach((desk) => {
      desk.seats.forEach((seat) => {
        if (seat.student_id) seatedStudentIds.add(seat.student_id);
      });
    });
    return students.filter((s) => s.status === 'active' && !seatedStudentIds.has(s.id));
  }, [desks, students]);

  // Total seated count
  const seatedCount = useMemo(() => {
    let count = 0;
    desks.forEach((d) => {
      d.seats.forEach((s) => {
        if (s.student_id) count++;
      });
    });
    return count;
  }, [desks]);

  // Total capacity: desks.length * 2
  const totalCapacity = desks.length * 2 || 40;

  // Gender statistics
  const genderStats = useMemo(() => {
    const maleCount = students.filter((s) => s.gender === 'male').length;
    const femaleCount = students.filter((s) => s.gender === 'female').length;
    return { maleCount, femaleCount };
  }, [students]);

  // Today attendance counts for the class
  const todayAbsentCount = useMemo(() => {
    let absent = 0;
    todayAttendanceMap.forEach((status) => {
      if (status === 'absent' || status === 'late' || status === 'excused') absent++;
    });
    return absent;
  }, [todayAttendanceMap]);

  // Handle seat click (for swap or assignment)
  const handleSeatClick = (seat: SeatWithStudent) => {
    if (!isHomeroom) {
      if (seat.student) {
        const att = todayAttendanceMap.get(seat.student.id);
        const attLabel = att === 'absent' ? ' (Hôm nay Vắng)' : att === 'late' ? ' (Hôm nay Đi muộn)' : '';
        toast.info(
          `Vị trí: ${seat.side === 'left' ? 'Vị trí 01' : 'Vị trí 02'} · Học sinh: ${seat.student.full_name} (${seat.student.student_code})${attLabel}`
        );
      } else {
        toast.info(`Ghế trống (${seat.side === 'left' ? 'Vị trí 01' : 'Vị trí 02'})`);
      }
      return;
    }

    if (!selectedSeatId) {
      // First selection
      setSelectedSeatId(seat.id);
      if (seat.student) {
        toast.info(`Đang chọn ghế của ${seat.student.full_name}. Nhấp ghế thứ 2 để hoán đổi chỗ.`);
      } else {
        toast.info(`Đã chọn ghế trống. Nhấp vào học sinh bên dưới để xếp vào đây.`);
      }
    } else if (selectedSeatId === seat.id) {
      // Deselect
      setSelectedSeatId(null);
    } else {
      // Second selection: SWAP
      const res = SeatingService.swapSeats(selectedSeatId, seat.id, currentClassId || '', user);
      if (!res.success) {
        toast.error(res.error || 'Hoán đổi chỗ ngồi thất bại');
        return;
      }
      toast.success('Đã hoán đổi vị trí chỗ ngồi!');
      setSelectedSeatId(null);
      loadData();
    }
  };

  // Assign unseated student to selected seat
  const handleAssignUnseated = (studentId: string) => {
    if (!selectedSeatId) {
      // Find first empty seat
      let emptySeatId: string | null = null;
      for (const desk of desks) {
        for (const seat of desk.seats) {
          if (!seat.student_id) {
            emptySeatId = seat.id;
            break;
          }
        }
        if (emptySeatId) break;
      }

      if (!emptySeatId) {
        toast.error('Lớp học không còn ghế trống!');
        return;
      }

      const res = SeatingService.assignSeat(emptySeatId, studentId, currentClassId || '', user);
      if (!res.success) {
        toast.error(res.error || 'Xếp chỗ thất bại');
        return;
      }
      toast.success('Đã xếp học sinh vào ghế trống đầu tiên');
      loadData();
    } else {
      const res = SeatingService.assignSeat(selectedSeatId, studentId, currentClassId || '', user);
      if (!res.success) {
        toast.error(res.error || 'Xếp chỗ thất bại');
        return;
      }
      toast.success('Đã xếp học sinh vào ghế đã chọn');
      setSelectedSeatId(null);
      loadData();
    }
  };

  // Remove student from seat
  const handleRemoveFromSeat = (e: React.MouseEvent, seatId: string) => {
    e.stopPropagation();
    const res = SeatingService.assignSeat(seatId, null, currentClassId || '', user);
    if (!res.success) {
      toast.error(res.error || 'Gỡ học sinh thất bại');
      return;
    }
    if (selectedSeatId === seatId) setSelectedSeatId(null);
    toast.success('Đã đưa học sinh ra khỏi chỗ ngồi');
    loadData();
  };

  // Randomize all seats
  const handleRandomize = () => {
    const res = SeatingService.randomizeSeating(currentClassId || '', user);
    if (!res.success) {
      toast.error(res.error || 'Xáo trộn chỗ ngồi thất bại');
      return;
    }
    if (res.data) setDesks(res.data);
    setSelectedSeatId(null);
    toast.success('Đã xáo trộn ngẫu nhiên chỗ ngồi cho cả lớp bằng thuật toán Fisher-Yates!');
  };

  // Clear all seats
  const handleClearAll = () => {
    const res = SeatingService.clearAllSeats(currentClassId || '', user);
    if (!res.success) {
      toast.error(res.error || 'Xếp lại từ đầu thất bại');
      return;
    }
    if (res.data) setDesks(res.data);
    setSelectedSeatId(null);
    toast.success('Đã làm trống toàn bộ sơ đồ chỗ ngồi');
  };

  // Selected seat object
  const selectedSeatObj = useMemo(() => {
    if (!selectedSeatId) return null;
    for (const d of desks) {
      for (const s of d.seats) {
        if (s.id === selectedSeatId) return s;
      }
    }
    return null;
  }, [desks, selectedSeatId]);

  const selectedStudent = selectedSeatObj?.student;

  // Dynamic row and column detection:
  const distinctRowNumbers = useMemo(() => {
    const set = new Set<number>();
    desks.forEach((d) => set.add(d.row_num));
    return Array.from(set).sort((a, b) => a - b);
  }, [desks]);

  const distinctColNumbers = useMemo(() => {
    const set = new Set<number>();
    desks.forEach((d) => set.add(d.col_num));
    return Array.from(set).sort((a, b) => a - b);
  }, [desks]);

  // View A ("nhìn từ dưới lên"): Rows 1..N, Cols 1..4
  // View B ("nhìn từ bục giảng xuống"): Rows N..1, Cols 4..1
  const orderedRowNumbers = useMemo(() => {
    return viewPerspective === 'nhin_tu_duoi_len'
      ? [...distinctRowNumbers]
      : [...distinctRowNumbers].reverse();
  }, [viewPerspective, distinctRowNumbers]);

  const orderedColNumbers = useMemo(() => {
    return viewPerspective === 'nhin_tu_duoi_len'
      ? [...distinctColNumbers]
      : [...distinctColNumbers].reverse();
  }, [viewPerspective, distinctColNumbers]);

  if (!isLoaded) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-64 bg-surface-muted rounded-xs animate-pulse" />
        <div className="h-[600px] bg-surface-muted rounded-sm animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* FORMAL PRINT HEADER (Displayed ONLY when printing) */}
      {/* ========================================================================= */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div className="text-left">
            <div className="font-bold text-xs uppercase tracking-wider text-black">TRƯỜNG THCS NGUYỄN TẤT THÀNH</div>
            <div className="text-[11px] text-black">Năm học 2026 - 2027</div>
          </div>
          <div className="text-right text-[11px] text-black">
            <div>Phòng học: {currentClass?.room_name || 'Phòng học chuẩn'}</div>
            <div>Ngày in: {formatDateVietnamese(new Date())}</div>
          </div>
        </div>
        <h1 className="text-xl font-bold uppercase mt-2.5 text-black tracking-tight">
          SƠ ĐỒ CHỖ NGỒI LỚP {currentClass ? currentClass.name : ''}
        </h1>
        <p className="text-xs italic text-black mt-0.5">
          Sĩ số: {students.length}/40 học sinh ({genderStats.maleCount} Nam · {genderStats.femaleCount} Nữ) · Đã xếp: {seatedCount} vị trí · GVCN: {teacherName || '...'}
        </p>
      </div>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border no-print">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 text-xs font-bold bg-teal text-surface border border-teal-700 rounded-xs inline-flex items-center gap-1.5 shadow-xs">
              <Chalkboard size={14} weight="bold" />
              Trường THCS Nguyễn Tất Thành
            </span>
            <span className="px-2.5 py-1 text-xs font-bold bg-surface text-text-primary border border-border-strong rounded-xs shadow-xs">
              {currentClass ? currentClass.name : 'Lớp học'} · Phòng {currentClass?.room_name || '101'}
            </span>
            <span className="px-2.5 py-1 text-xs font-bold font-mono bg-emerald-100 text-emerald-950 border border-emerald-400 rounded-xs shadow-xs">
              {seatedCount}/{totalCapacity} chỗ đã xếp
            </span>
            <span className="px-2.5 py-1 text-xs font-bold font-mono text-amber-950 bg-amber-100 rounded-xs border border-amber-400 shadow-xs">
              {genderStats.maleCount} Nam · {genderStats.femaleCount} Nữ
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase text-text-primary mt-2">
            SƠ ĐỒ CHỖ NGỒI {currentClass ? currentClass.name : 'LỚP HỌC'}
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">
            Sơ đồ phòng học: {distinctColNumbers.length || 4} dãy bàn đôi · {distinctRowNumbers.length || 5} hàng ({desks.length} bàn · sức chứa tối đa {totalCapacity} học sinh).
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2.5 flex-wrap no-print">
          {/* Perspective Switcher */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePerspective}
            title="Đổi hướng nhìn lớp học: Nhìn từ dưới lên vs Nhìn từ bục giảng xuống"
            className="gap-1.5 whitespace-nowrap"
          >
            <ArrowsDownUp size={16} weight="bold" />
            <span>
              {viewPerspective === 'nhin_tu_duoi_len'
                ? 'Hướng nhìn: Dưới lên'
                : 'Hướng nhìn: Bục giảng'}
            </span>
          </Button>

          {/* Today Attendance Overlay Toggle */}
          <Button
            variant={showAttendanceOverlay ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowAttendanceOverlay((prev) => !prev)}
            title="Bật/Tắt đánh dấu học sinh vắng mặt hoặc đi muộn hôm nay trên sơ đồ"
            className="gap-1.5 relative"
          >
            <CalendarCheck size={16} weight="bold" />
            <span>Chuyên cần hôm nay</span>
            {todayAbsentCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse absolute -top-1 -right-1" />
            )}
          </Button>

          {/* Gender Filter Segmented Control */}
          <div className="inline-flex items-center rounded-xs border border-border-strong bg-surface p-0.5 gap-0.5 text-xs shadow-xs">
            <button
              type="button"
              onClick={() => setGenderFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-xs font-semibold transition-all cursor-pointer text-[12px]',
                genderFilter === 'all'
                  ? 'bg-accent text-accent-text font-bold shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('male')}
              className={cn(
                'px-2 py-1 rounded-xs font-semibold transition-all flex items-center gap-1 cursor-pointer text-[12px]',
                genderFilter === 'male'
                  ? 'bg-teal text-surface font-bold shadow-xs'
                  : 'text-text-muted hover:text-teal'
              )}
            >
              <GenderMale size={13} weight="bold" />
              <span>Nam ({genderStats.maleCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('female')}
              className={cn(
                'px-2 py-1 rounded-xs font-semibold transition-all flex items-center gap-1 cursor-pointer text-[12px]',
                genderFilter === 'female'
                  ? 'bg-[#964253] text-surface font-bold shadow-xs'
                  : 'text-text-muted hover:text-[#964253]'
              )}
            >
              <GenderFemale size={13} weight="bold" />
              <span>Nữ ({genderStats.femaleCount})</span>
            </button>
          </div>

          {/* Print Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            title="In sơ đồ chỗ ngồi khổ A4 ngang"
            className="gap-1.5"
          >
            <Printer size={16} weight="bold" />
            <span>In sơ đồ A4</span>
          </Button>

          {isHomeroom && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRandomize}
                title="Xáo trộn ngẫu nhiên chỗ ngồi (Fisher-Yates)"
                className="gap-1.5"
              >
                <Shuffle size={16} weight="bold" />
                <span>Đổi chỗ ngẫu nhiên</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-text-muted hover:text-danger gap-1.5"
              >
                <ArrowsClockwise size={16} />
                <span>Xếp lại từ đầu</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Role Banner for Subject Teachers */}
      {isSubjectTeacher && (
        <div className="p-3.5 bg-teal-subtle border border-teal/30 rounded-sm flex items-center justify-between text-sm text-text-primary no-print shadow-xs">
          <div className="flex items-center gap-2.5">
            <ChalkboardTeacher size={20} className="text-teal flex-shrink-0" weight="duotone" />
            <span>
              Bạn đang tra cứu sơ đồ {currentClass?.name} với vai trò <strong>Giáo viên Bộ môn ({teacherSubjects.map((s) => s.name).join(', ')})</strong>.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-xs bg-surface border border-teal/30 font-bold text-xs text-teal">
            Chế độ tra cứu
          </span>
        </div>
      )}

      {/* Floating Action Banner when seat is selected */}
      {selectedSeatId && (
        <div className="p-3.5 bg-accent/20 border-2 border-accent rounded-sm flex items-center justify-between text-sm shadow-xs no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs bg-accent text-accent-text border border-border-strong flex items-center justify-center flex-shrink-0 animate-pulse shadow-xs">
              <ArrowsLeftRight size={18} weight="bold" />
            </div>
            <div>
              <span className="font-bold text-text-primary text-[15px]">
                Đang chọn: {selectedStudent ? selectedStudent.full_name : 'Ghế trống'}
              </span>
              <span className="text-text-secondary ml-2 text-xs font-medium">
                (Nhấp ghế khác trên sơ đồ để hoán đổi, hoặc bấm học sinh chưa xếp bên dưới để gán vào)
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSeatId(null)}
            className="text-text-muted hover:text-text-primary h-8 px-3 border border-border bg-surface"
          >
            <X size={16} />
            <span>Hủy chọn</span>
          </Button>
        </div>
      )}

      {/* Helper notice when Attendance Overlay is active */}
      {showAttendanceOverlay && (
        <div className="p-3 bg-warning-bg border border-warning/40 rounded-sm flex items-center justify-between text-xs text-warning no-print shadow-xs">
          <div className="flex items-center gap-2">
            <CalendarCheck size={16} className="text-warning flex-shrink-0" weight="bold" />
            <span>
              Đang bật lớp phủ <strong>Chuyên cần hôm nay ({formatDateVietnamese(new Date())})</strong>: Ghế học sinh Vắng được đánh dấu viền đỏ, Đi muộn viền vàng.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAttendanceOverlay(false)}
            className="text-text-primary hover:underline font-bold cursor-pointer"
          >
            Tắt lớp phủ
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CLASSROOM SEATING MAP CONTAINER */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-sm border border-border-strong p-6 md:p-8 shadow-xs space-y-7 printable-card">
        {/* Back Wall Marker (Rendered on top when viewPerspective === 'nhin_tu_buc_giang') */}
        {viewPerspective === 'nhin_tu_buc_giang' && (
          <div className="w-full pb-3 border-b-2 border-dashed border-border-strong flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-2 font-medium">
              <div className="w-2.5 h-2.5 rounded-full bg-border-strong" />
              <span>Cửa sổ thông gió & Tường sau phòng học</span>
            </div>
            <div className="font-bold uppercase tracking-widest text-text-muted inline-flex items-center gap-1.5 font-mono">
              <span>PHÍA SAU LỚP</span>
              <ArrowUp size={14} weight="bold" />
            </div>
          </div>
        )}

        {/* Front Area when in 'nhin_tu_duoi_len' perspective (View A: Nhìn từ dưới lên - Board at top) */}
        {viewPerspective === 'nhin_tu_duoi_len' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b-2 border-border-strong">
            {/* Front Left: BÀN GIÁO VIÊN (Aligned with Dãy 1) */}
            <div className="bg-amber-50/80 border-2 border-amber-300 rounded-sm p-3.5 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xs bg-amber-300 text-amber-950 border border-amber-400 flex items-center justify-center flex-shrink-0 shadow-xs">
                <ChalkboardTeacher size={22} weight="bold" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-950">BÀN GIÁO VIÊN</div>
                <div className="text-[11px] text-amber-900 truncate font-semibold mt-0.5">
                  {teacherName ? `GVCN: ${teacherName}` : 'Vị trí giảng dạy (Cạnh Dãy 1)'}
                </div>
              </div>
            </div>

            {/* Front Center: BẢNG LỚP HỌC (Aligned with Dãy 2 & 3) */}
            <div className="md:col-span-2 bg-[#0e271f] text-white border-2 border-[#225745] rounded-sm p-4 text-center shadow-xs relative flex flex-col justify-center">
              <div className="text-xs font-black uppercase tracking-widest text-[#85e3be] flex items-center justify-center gap-2">
                <Chalkboard size={18} weight="bold" />
                <span>BỤC GIẢNG & BẢNG VIẾT PHẤN</span>
              </div>
              <div className="text-[11px] text-[#e0f5ed] mt-1 font-mono font-semibold">
                Bảng từ chống lóa 4.0m · Hướng nhìn từ cuối lớp lên bục giảng
              </div>
            </div>

            {/* Front Right: CỬA VÀO (Aligned with Dãy 4) */}
            <div className="bg-teal-50/80 border-2 border-teal/40 rounded-sm p-3.5 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xs bg-teal text-surface border border-teal-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                <Door size={22} weight="bold" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-teal">CỬA RA VÀO</div>
                <div className="text-[11px] text-teal-900 font-semibold mt-0.5">Lối vào lớp học (Cạnh Dãy 4)</div>
              </div>
            </div>
          </div>
        )}

        {/* 4 Column Header Labels (Ordered according to viewpoint) */}
        <div className="grid grid-cols-4 gap-4 md:gap-6 text-center">
          {orderedColNumbers.map((col) => {
            const colInfo =
              col === 1
                ? { label: 'DÃY 1', note: 'Sát bàn GV / Cửa sổ', color: 'bg-amber-100/70 border-amber-300 text-amber-950' }
                : col === 2
                ? { label: 'DÃY 2', note: 'Giữa trái', color: 'bg-teal-100/70 border-teal/40 text-teal' }
                : col === 3
                ? { label: 'DÃY 3', note: 'Giữa phải', color: 'bg-teal-100/70 border-teal/40 text-teal' }
                : { label: 'DÃY 4', note: 'Sát cửa ra vào', color: 'bg-amber-100/70 border-amber-300 text-amber-950' };

            return (
              <div
                key={col}
                className={cn('py-2 px-2 rounded-xs border-2 flex flex-col items-center justify-center shadow-xs', colInfo.color)}
              >
                <span className="text-xs font-black tracking-wider font-mono">{colInfo.label}</span>
                <span className="text-[10px] font-semibold opacity-90 mt-0.5">{colInfo.note}</span>
              </div>
            );
          })}
        </div>

        {/* =================================================================== */}
        {/* DESK GRID: 5 Rows × 4 Columns = 20 Desks */}
        {/* =================================================================== */}
        <div className="space-y-5">
          {orderedRowNumbers.map((rowNum) => {
            const rowDesks = desks.filter((d) => d.row_num === rowNum);
            rowDesks.sort(
              (a, b) => orderedColNumbers.indexOf(a.col_num) - orderedColNumbers.indexOf(b.col_num)
            );

            return (
              <div key={`row-${rowNum}`} className="space-y-1.5">
                {/* Row Indicator */}
                <div className="flex items-center justify-between px-1 text-[11px] font-mono text-text-muted">
                  <span className="font-bold uppercase tracking-wider">
                    HÀNG {rowNum} {rowNum === 1 ? '(Bàn đầu / Gần bảng)' : rowNum === 5 ? '(Bàn cuối lớp)' : ''}
                  </span>
                  <span className="text-[10px] opacity-70">4 bàn đôi · 8 chỗ</span>
                </div>

                {/* Desks in this row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {rowDesks.map((desk) => {
                    const seat01 = desk.seats[0]; // logical Seat 01
                    const seat02 = desk.seats[1]; // logical Seat 02

                    // Seat rendering order inside each desk:
                    // "Nhìn từ dưới lên" (View A): Left is Seat 01, Right is Seat 02
                    // "Nhìn từ bục giảng xuống" (View B): Left is Seat 02, Right is Seat 01
                    const [seatDisplayLeft, seatDisplayRight] =
                      viewPerspective === 'nhin_tu_duoi_len'
                        ? [seat01, seat02]
                        : [seat02, seat01];

                    // Helper to render individual seat with overlay and gender filtering
                    const renderSeatItem = (seatItem: SeatWithStudent) => {
                      const student = seatItem.student;
                      const isSeatSelected = selectedSeatId === seatItem.id;
                      const attStatus = student ? todayAttendanceMap.get(student.id) : null;
                      const isMale = student?.gender === 'male';
                      const isFemale = student?.gender === 'female';

                      // Gender filter logic
                      const isDimmedByGender =
                        student &&
                        ((genderFilter === 'male' && !isMale) ||
                          (genderFilter === 'female' && !isFemale));

                      const isHighlightedByGender =
                        student &&
                        ((genderFilter === 'male' && isMale) ||
                          (genderFilter === 'female' && isFemale));

                      // Styling rules based on active overlay / filter
                      let containerClasses = isMale
                        ? 'bg-[#f0f8f8] border-teal/40 hover:border-teal hover:bg-[#e4f3f3] shadow-xs'
                        : isFemale
                        ? 'bg-[#fcf2f4] border-[#964253]/35 hover:border-[#964253] hover:bg-[#fae4e8] shadow-xs'
                        : 'bg-surface border-border-strong hover:border-accent hover:bg-surface-muted/30 shadow-xs';

                      if (isSeatSelected) {
                        containerClasses = 'bg-accent/40 border-2 border-accent-text ring-2 ring-accent shadow-xs';
                      } else if (showAttendanceOverlay && student) {
                        if (attStatus === 'absent') {
                          containerClasses = 'bg-danger-bg border-2 border-danger ring-2 ring-danger/30 shadow-xs';
                        } else if (attStatus === 'late') {
                          containerClasses = 'bg-warning-bg border-2 border-warning ring-2 ring-warning/30 shadow-xs';
                        } else if (attStatus === 'excused') {
                          containerClasses = 'bg-indigo-50 border-2 border-indigo-400 ring-2 ring-indigo-200 shadow-xs';
                        } else {
                          containerClasses = 'bg-success-bg border-2 border-success/60 shadow-xs';
                        }
                      } else if (isHighlightedByGender) {
                        if (isMale) {
                          containerClasses = 'bg-teal-subtle border-2 border-teal ring-2 ring-teal/30 shadow-xs';
                        } else if (isFemale) {
                          containerClasses = 'bg-[#fcf0f2] border-2 border-[#964253] ring-2 ring-[#964253]/30 shadow-xs';
                        }
                      } else if (!student) {
                        containerClasses = 'bg-[#fffcf7] border-2 border-dashed border-border-strong/40 hover:bg-accent/20 hover:border-border-strong text-text-muted shadow-2xs';
                      }

                      return (
                        <div
                          onClick={() => handleSeatClick(seatItem)}
                          className={cn(
                            'p-2.5 rounded-xs border-2 text-xs cursor-pointer transition-all relative group min-h-[88px] flex flex-col justify-between',
                            containerClasses,
                            isDimmedByGender && 'opacity-25 filter grayscale'
                          )}
                        >
                          {student ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-text-secondary font-bold">
                                  {student.student_code}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className={cn(
                                    "text-[9px] font-bold font-mono px-1.5 py-0.2 rounded-xs border",
                                    isMale
                                      ? "bg-teal-100 text-teal border-teal/30"
                                      : "bg-rose-100 text-[#964253] border-rose-300"
                                  )}>
                                    {seatItem === seat01 ? '01' : '02'}
                                  </span>
                                  {isMale ? (
                                    <GenderMale size={14} weight="bold" className="text-teal" />
                                  ) : (
                                    <GenderFemale size={14} weight="bold" className="text-[#964253]" />
                                  )}
                                </div>
                              </div>

                              <div
                                className="font-black text-text-primary text-[14px] leading-tight truncate"
                                title={student.full_name}
                              >
                                {student.full_name.split(' ').slice(-1)[0]}
                              </div>
                              <div className="text-[11px] text-text-secondary font-semibold truncate leading-tight">
                                {student.full_name.split(' ').slice(0, -1).join(' ')}
                              </div>

                              {/* Attendance Status Badge if Overlay is Active */}
                              {showAttendanceOverlay && attStatus && (
                                <div className="pt-0.5">
                                  {attStatus === 'absent' && (
                                    <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-danger text-white tracking-wider font-mono">
                                      VẮNG
                                    </span>
                                  )}
                                  {attStatus === 'late' && (
                                    <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-warning text-accent-text tracking-wider font-mono">
                                      MUỘN
                                    </span>
                                  )}
                                  {attStatus === 'excused' && (
                                    <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-black bg-indigo-100 border border-indigo-400 text-indigo-950 tracking-wider font-mono">
                                      PHÉP
                                    </span>
                                  )}
                                  {attStatus === 'present' && (
                                    <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-success text-white tracking-wider font-mono">
                                      CÓ MẶT
                                    </span>
                                  )}
                                </div>
                              )}

                              {isHomeroom && (
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveFromSeat(e, seatItem.id)}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger text-white rounded-xs border border-border-strong flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs no-print cursor-pointer"
                                  title="Gỡ khỏi ghế"
                                >
                                  <X size={11} weight="bold" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="py-3.5 text-center space-y-1">
                              <div className="text-[11px] font-bold text-text-secondary">
                                {seatItem === seat01 ? '+ Ghế 01' : '+ Ghế 02'}
                              </div>
                              <div className="text-[9px] text-text-muted font-mono">
                                Trống · Bấm để xếp
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    };

                    return (
                      <div
                        key={desk.id}
                        className="bg-[#faf6ee] rounded-sm border-2 border-border-strong p-3 shadow-xs hover:border-accent-text transition-all flex flex-col justify-between"
                      >
                        {/* Desk Header Badge */}
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-border-strong/40">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-amber-950 text-[13px] font-mono px-2 py-0.5 rounded-xs bg-amber-200/80 border border-amber-400 shadow-2xs">
                              Bàn {desk.desk_number.toString().padStart(2, '0')}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold font-mono text-text-secondary bg-surface px-2 py-0.5 rounded-xs border border-border-strong shadow-2xs">
                            Dãy {desk.col_num} · H{desk.row_num}
                          </span>
                        </div>

                        {/* 2 Seats with Viewpoint-dependent visual order */}
                        <div className="grid grid-cols-2 gap-2 pt-2.5">
                          {renderSeatItem(seatDisplayLeft)}
                          {renderSeatItem(seatDisplayRight)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* =================================================================== */}
        {/* BOTTOM AREA DEPENDING ON PERSPECTIVE */}
        {/* =================================================================== */}
        {/* Back Wall Marker when in 'nhin_tu_duoi_len' (View A: Back wall at bottom) */}
        {viewPerspective === 'nhin_tu_duoi_len' && (
          <div className="w-full pt-5 border-t-2 border-dashed border-border-strong flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-2 font-medium">
              <div className="w-2.5 h-2.5 rounded-full bg-border-strong" />
              <span>Cửa sổ thông gió & Tường sau phòng học</span>
            </div>
            <div className="font-bold uppercase tracking-widest text-text-muted inline-flex items-center gap-1.5 font-mono">
              <span>PHÍA SAU LỚP</span>
              <ArrowDown size={14} weight="bold" />
            </div>
          </div>
        )}

        {/* Front Area when in 'nhin_tu_buc_giang' (View B: Nhìn từ bục giảng xuống - Board at bottom) */}
        {viewPerspective === 'nhin_tu_buc_giang' && (
          <div className="pt-6 border-t-2 border-border-strong space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted font-mono">
              <ArrowDown size={14} weight="bold" />
              <span>BỤC GIẢNG & BẢNG LỚP HỌC</span>
              <ArrowDown size={14} weight="bold" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
              {/* Front Left: CỬA RA VÀO (Aligned with Dãy 4) */}
              <div className="bg-teal-50/80 border-2 border-teal/40 rounded-sm p-4 flex items-center gap-3.5 shadow-xs">
                <div className="w-11 h-11 rounded-xs bg-teal text-surface border border-teal-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Door size={24} weight="bold" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-teal">
                    CỬA RA VÀO
                  </div>
                  <div className="text-[11px] text-teal-900 font-semibold mt-0.5">
                    Lối vào lớp học (Cạnh Dãy 4)
                  </div>
                </div>
              </div>

              {/* Front Center: BẢNG VIẾT PHẤN & BỤC GIẢNG (Aligned with Dãy 3 & Dãy 2) */}
              <div className="md:col-span-2 bg-[#0e271f] text-white border-2 border-[#225745] rounded-sm p-4 shadow-xs relative flex flex-col justify-center text-center">
                <div className="text-[13px] font-black uppercase tracking-widest text-[#85e3be] flex items-center justify-center gap-2">
                  <Chalkboard size={20} weight="bold" />
                  <span>BỤC GIẢNG & BẢNG VIẾT PHẤN</span>
                </div>
                <div className="text-[11px] text-[#e0f5ed] mt-1 font-mono font-semibold">
                  Bảng từ chống lóa 4.0m · Hướng nhìn từ bục giảng xuống lớp
                </div>

                {/* Chalk Tray Styling */}
                <div className="w-48 h-1.5 bg-[#091714] rounded-full mx-auto mt-2 flex items-center justify-center gap-1.5">
                  <div className="w-4 h-1 bg-white rounded-xs opacity-90" />
                  <div className="w-3 h-1 bg-accent rounded-xs opacity-90" />
                  <div className="w-6 h-1 bg-teal rounded-xs" />
                </div>
              </div>

              {/* Front Right: BÀN GIÁO VIÊN (Aligned with Dãy 1) */}
              <div className="bg-amber-50/80 border-2 border-amber-300 rounded-sm p-4 flex items-center gap-3.5 shadow-xs">
                <div className="w-11 h-11 rounded-xs bg-amber-300 text-amber-950 border border-amber-400 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <ChalkboardTeacher size={24} weight="bold" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase tracking-wider text-amber-950">
                    BÀN GIÁO VIÊN
                  </div>
                  <div className="text-[11px] text-amber-900 truncate font-semibold mt-0.5">
                    {teacherName ? `GVCN: ${teacherName}` : 'Vị trí giảng bài (Cạnh Dãy 1)'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FORMAL PRINT FOOTER (Displayed ONLY when printing) */}
      {/* ========================================================================= */}
      <div className="hidden print:grid grid-cols-2 mt-6 pt-4 border-t border-black text-center text-xs text-black">
        <div>
          <div className="font-bold uppercase tracking-wider">BAN GIÁM HIỆU PHÊ DUYỆT</div>
          <div className="italic text-[10px] mt-1">(Ký và đóng dấu)</div>
          <div className="h-16" />
        </div>
        <div>
          <div className="font-bold uppercase tracking-wider">GIÁO VIÊN CHỦ NHIỆM</div>
          <div className="italic text-[10px] mt-1">(Ký và ghi rõ họ tên)</div>
          <div className="h-16" />
          <div className="font-bold">{teacherName || ''}</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UNSEATED STUDENTS SECTION */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-sm border border-border-strong p-6 shadow-xs space-y-4 no-print">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <UserPlus size={20} className="text-teal" weight="duotone" />
            <h2 className="text-base font-bold text-text-primary">
              Danh sách học sinh chưa xếp chỗ ({unseatedStudents.length})
            </h2>
          </div>
          {unseatedStudents.length > 0 && isHomeroom && (
            <span className="text-xs text-text-muted">
              Nhấp vào học sinh để xếp nhanh vào ghế trống đầu tiên hoặc ghế đang chọn
            </span>
          )}
        </div>

        {unseatedStudents.length === 0 ? (
          <div className="py-3 flex items-center gap-2.5 text-sm text-success font-semibold bg-success-bg border border-success/30 px-4 rounded-xs">
            <CheckCircle size={18} weight="bold" className="text-success" />
            <span>
              Tất cả {students.length} học sinh trong lớp đã có vị trí chỗ ngồi ổn định trên sơ đồ.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {unseatedStudents.map((student) => (
              <button
                key={student.id}
                type="button"
                disabled={!isHomeroom}
                onClick={() => isHomeroom && handleAssignUnseated(student.id)}
                className={`px-3 py-1.5 rounded-xs border border-border-strong bg-surface-muted text-xs font-semibold text-text-primary flex items-center gap-2 transition-all shadow-xs ${
                  isHomeroom
                    ? 'hover:bg-accent/20 hover:border-accent cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                <span>{student.full_name}</span>
                <span className="font-mono text-[11px] text-text-muted">({student.student_code})</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
