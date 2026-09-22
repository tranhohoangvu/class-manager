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
} from '@phosphor-icons/react';
import { SeatingService, StudentService } from '@/services';
import { LocalStore } from '@/lib/store';
import { DeskWithSeats, StudentRow, SeatWithStudent } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentClass } from '@/contexts/class-context';

export default function SeatingPage() {
  const { user } = useAuth();
  const { currentClassId, currentClass, isHomeroom, isSubjectTeacher, teacherSubjects } = useCurrentClass();
  const [desks, setDesks] = useState<DeskWithSeats[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  // View mode:
  // 'nhin_tu_duoi_len' (View A: Looking from back toward teaching platform - default matching reference)
  // 'nhin_tu_buc_giang' (View B: Looking from teaching platform down toward back)
  const [viewPerspective, setViewPerspective] = useState<'nhin_tu_duoi_len' | 'nhin_tu_buc_giang'>(
    'nhin_tu_duoi_len'
  );

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

  // Handle seat click (for swap or assignment)
  const handleSeatClick = (seat: SeatWithStudent) => {
    if (!isHomeroom) {
      if (seat.student) {
        toast.info(
          `Vị trí: ${seat.side === 'left' ? 'Vị trí 01' : 'Vị trí 02'} · Học sinh: ${seat.student.full_name} (${seat.student.student_code})`
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

  // View A ("nhìn từ dưới lên"): Rows 1..N, Cols 1..4 (D1 near Teacher on Left, D4 near Door on Right)
  // View B ("nhìn từ bục giảng xuống"): Rows N..1, Cols 4..1 (D4 near Door on Left, D1 near Teacher on Right)
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
        <div className="h-8 w-64 bg-surface-muted rounded-xl animate-pulse" />
        <div className="h-[600px] bg-surface-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-lg inline-flex items-center gap-1.5 shadow-2xs">
              <Chalkboard size={14} weight="bold" />
              Trường THCS Nguyễn Tất Thành
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold bg-surface-muted text-text-secondary border border-border rounded-lg">
              {currentClass ? currentClass.name : 'Lớp học'} · Phòng {currentClass?.room_name || '101'}
            </span>
            <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              {seatedCount}/{totalCapacity} chỗ đã xếp
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mt-2">
            Sơ đồ Chỗ ngồi {currentClass ? currentClass.name : 'Lớp học'}
          </h1>
          <p className="text-sm text-text-muted mt-1 font-medium">
            Sơ đồ phòng học: {distinctColNumbers.length || 4} dãy bàn đôi · {distinctRowNumbers.length || 5} hàng ({desks.length} bàn · sức chứa {totalCapacity} học sinh).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap no-print">
          {/* Perspective Switcher */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setViewPerspective((prev) =>
                prev === 'nhin_tu_duoi_len' ? 'nhin_tu_buc_giang' : 'nhin_tu_duoi_len'
              )
            }
            title="Đổi hướng nhìn lớp học: Nhìn từ dưới lên vs Nhìn từ bục giảng xuống"
            className="gap-1.5 whitespace-nowrap"
          >
            <ArrowsDownUp size={16} weight="bold" />
            <span>
              {viewPerspective === 'nhin_tu_duoi_len'
                ? 'Hướng nhìn: Dưới lên (Bảng ở trên)'
                : 'Hướng nhìn: Từ bục giảng (Bảng ở dưới)'}
            </span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            title="In sơ đồ chỗ ngồi khổ A4 ngang"
            className="gap-1.5"
          >
            <Printer size={16} weight="bold" />
            <span>In sơ đồ</span>
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
                className="text-text-muted hover:text-rose-600 gap-1.5"
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
        <div className="p-4 bg-indigo-50 border border-indigo-200/80 rounded-2xl flex items-center justify-between text-sm text-indigo-950 no-print shadow-2xs">
          <div className="flex items-center gap-2.5">
            <ChalkboardTeacher size={20} className="text-indigo-600 flex-shrink-0" weight="duotone" />
            <span>
              Bạn đang tra cứu sơ đồ {currentClass?.name} với vai trò <strong>Giáo viên Bộ môn ({teacherSubjects.map((s) => s.name).join(', ')})</strong>.
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-100/80 font-bold text-xs text-indigo-700">
            Chế độ tra cứu
          </span>
        </div>
      )}

      {/* Floating Action Banner when seat is selected */}
      {selectedSeatId && (
        <div className="p-4 bg-indigo-50 border-2 border-indigo-300 rounded-2xl flex items-center justify-between text-sm shadow-xs no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse shadow-xs">
              <ArrowsLeftRight size={18} weight="bold" />
            </div>
            <div>
              <span className="font-bold text-text-primary text-[15px]">
                Đang chọn: {selectedStudent ? selectedStudent.full_name : 'Ghế trống'}
              </span>
              <span className="text-text-muted ml-2 text-xs">
                (Nhấp ghế khác trên sơ đồ để hoán đổi, hoặc bấm học sinh chưa xếp bên dưới để gán vào)
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSeatId(null)}
            className="text-text-muted hover:text-text-primary h-8 px-3"
          >
            <X size={16} />
            <span>Hủy chọn</span>
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CLASSROOM SEATING MAP CONTAINER */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-3xl border border-border p-6 md:p-8 shadow-sm space-y-7 printable-card">
        {/* Back Wall Marker (Rendered on top when viewPerspective === 'nhin_tu_buc_giang') */}
        {viewPerspective === 'nhin_tu_buc_giang' && (
          <div className="w-full pb-3 border-b-2 border-dashed border-border/80 flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-2 font-medium">
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span>Cửa sổ thông gió & Tường sau phòng học</span>
            </div>
            <div className="font-bold uppercase tracking-widest text-text-muted inline-flex items-center gap-1.5">
              <span>PHÍA SAU LỚP</span>
              <ArrowUp size={14} weight="bold" />
            </div>
          </div>
        )}

        {/* Front Area when in 'nhin_tu_duoi_len' perspective (View A: Nhìn từ dưới lên - Board at top) */}
        {viewPerspective === 'nhin_tu_duoi_len' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b-2 border-border/80">
            {/* Front Left: BÀN GIÁO VIÊN (Aligned with Dãy 1) */}
            <div className="bg-amber-50/70 border-2 border-amber-200/90 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <ChalkboardTeacher size={22} weight="bold" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-800">BÀN GIÁO VIÊN</div>
                <div className="text-[11px] text-amber-700 truncate font-medium mt-0.5">
                  {teacherName ? `GVCN: ${teacherName}` : 'Vị trí giảng dạy (Cạnh Dãy 1)'}
                </div>
              </div>
            </div>

            {/* Front Center: BẢNG LỚP HỌC (Aligned with Dãy 2 & 3) */}
            <div className="md:col-span-2 bg-[#132a24] text-white border-2 border-[#244b3f] rounded-2xl p-4 text-center shadow-sm relative flex flex-col justify-center">
              <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-100 flex items-center justify-center gap-2">
                <Chalkboard size={18} weight="bold" />
                <span>BỤC GIẢNG & BẢNG VIẾT PHẤN</span>
              </div>
              <div className="text-[11px] text-emerald-300/80 mt-1 font-mono font-medium">
                Bảng từ chống lóa 4.0m · Hướng nhìn từ cuối lớp lên bục giảng
              </div>
            </div>

            {/* Front Right: CỬA VÀO (Aligned with Dãy 4) */}
            <div className="bg-emerald-50/70 border-2 border-emerald-200/90 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Door size={22} weight="bold" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">CỬA RA VÀO</div>
                <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Lối vào lớp học (Cạnh Dãy 4)</div>
              </div>
            </div>
          </div>
        )}

        {/* 4 Column Header Labels (Ordered according to viewpoint) */}
        <div className="grid grid-cols-4 gap-4 md:gap-6 text-center">
          {orderedColNumbers.map((col) => {
            const colInfo =
              col === 1
                ? { label: 'DÃY 1', note: 'Sát bàn GV / Cửa sổ' }
                : col === 2
                ? { label: 'DÃY 2', note: 'Giữa trái' }
                : col === 3
                ? { label: 'DÃY 3', note: 'Giữa phải' }
                : { label: 'DÃY 4', note: 'Sát cửa ra vào' };

            return (
              <div
                key={col}
                className="py-2.5 px-2 bg-surface-muted/60 rounded-xl border border-border/80 flex flex-col items-center justify-center shadow-2xs"
              >
                <span className="text-xs font-extrabold tracking-wider text-text-primary">{colInfo.label}</span>
                <span className="text-[10px] text-text-muted font-medium mt-0.5">{colInfo.note}</span>
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

                    return (
                      <div
                        key={desk.id}
                        className="bg-surface rounded-2xl border-2 border-border/80 p-3 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between"
                      >
                        {/* Desk Header Badge */}
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-border/70">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-text-primary text-[13px]">
                              Bàn {desk.desk_number.toString().padStart(2, '0')}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-text-muted bg-surface-muted px-2 py-0.5 rounded-md border border-border/60">
                            Dãy {desk.col_num} · H{desk.row_num}
                          </span>
                        </div>

                        {/* 2 Seats with Viewpoint-dependent visual order */}
                        <div className="grid grid-cols-2 gap-2 pt-2.5">
                          {/* Left Seat in current viewpoint */}
                          <div
                            onClick={() => handleSeatClick(seatDisplayLeft)}
                            className={`p-2.5 rounded-xl border-2 text-xs cursor-pointer transition-all relative group min-h-[84px] flex flex-col justify-between ${
                              selectedSeatId === seatDisplayLeft.id
                                ? 'bg-indigo-50 border-indigo-600 ring-4 ring-indigo-200/80 shadow-xs'
                                : seatDisplayLeft.student
                                ? 'bg-surface-muted/40 border-border/90 hover:border-indigo-400 hover:bg-surface shadow-2xs'
                                : 'bg-surface/50 border-dashed border-border/90 hover:bg-indigo-50/30 hover:border-indigo-300 text-text-muted'
                            }`}
                          >
                            {seatDisplayLeft.student ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono text-text-muted font-bold">
                                    {seatDisplayLeft.student.student_code}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-bold text-text-muted/70 bg-surface-muted px-1 rounded">
                                      {seatDisplayLeft === seat01 ? '01' : '02'}
                                    </span>
                                    {seatDisplayLeft.student.gender === 'male' ? (
                                      <GenderMale size={13} weight="bold" className="text-blue-500" />
                                    ) : (
                                      <GenderFemale size={13} weight="bold" className="text-rose-500" />
                                    )}
                                  </div>
                                </div>
                                <div
                                  className="font-bold text-text-primary text-[13px] leading-tight truncate"
                                  title={seatDisplayLeft.student.full_name}
                                >
                                  {seatDisplayLeft.student.full_name.split(' ').slice(-1)[0]}
                                </div>
                                <div className="text-[11px] text-text-muted truncate leading-tight">
                                  {seatDisplayLeft.student.full_name.split(' ').slice(0, -1).join(' ')}
                                </div>

                                {isHomeroom && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleRemoveFromSeat(e, seatDisplayLeft.id)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                    title="Gỡ khỏi ghế"
                                  >
                                    <X size={11} weight="bold" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="py-3.5 text-center space-y-0.5">
                                <div className="text-[11px] font-semibold text-text-muted">
                                  {seatDisplayLeft === seat01 ? '+ Trống (01)' : '+ Trống (02)'}
                                </div>
                                <div className="text-[9px] text-text-muted/70">
                                  {seatDisplayLeft === seat01 ? 'Vị trí 01' : 'Vị trí 02'}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Seat in current viewpoint */}
                          <div
                            onClick={() => handleSeatClick(seatDisplayRight)}
                            className={`p-2.5 rounded-xl border-2 text-xs cursor-pointer transition-all relative group min-h-[84px] flex flex-col justify-between ${
                              selectedSeatId === seatDisplayRight.id
                                ? 'bg-indigo-50 border-indigo-600 ring-4 ring-indigo-200/80 shadow-xs'
                                : seatDisplayRight.student
                                ? 'bg-surface-muted/40 border-border/90 hover:border-indigo-400 hover:bg-surface shadow-2xs'
                                : 'bg-surface/50 border-dashed border-border/90 hover:bg-indigo-50/30 hover:border-indigo-300 text-text-muted'
                            }`}
                          >
                            {seatDisplayRight.student ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono text-text-muted font-bold">
                                    {seatDisplayRight.student.student_code}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-bold text-text-muted/70 bg-surface-muted px-1 rounded">
                                      {seatDisplayRight === seat01 ? '01' : '02'}
                                    </span>
                                    {seatDisplayRight.student.gender === 'male' ? (
                                      <GenderMale size={13} weight="bold" className="text-blue-500" />
                                    ) : (
                                      <GenderFemale size={13} weight="bold" className="text-rose-500" />
                                    )}
                                  </div>
                                </div>
                                <div
                                  className="font-bold text-text-primary text-[13px] leading-tight truncate"
                                  title={seatDisplayRight.student.full_name}
                                >
                                  {seatDisplayRight.student.full_name.split(' ').slice(-1)[0]}
                                </div>
                                <div className="text-[11px] text-text-muted truncate leading-tight">
                                  {seatDisplayRight.student.full_name.split(' ').slice(0, -1).join(' ')}
                                </div>

                                {isHomeroom && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleRemoveFromSeat(e, seatDisplayRight.id)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                    title="Gỡ khỏi ghế"
                                  >
                                    <X size={11} weight="bold" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="py-3.5 text-center space-y-0.5">
                                <div className="text-[11px] font-semibold text-text-muted">
                                  {seatDisplayRight === seat01 ? '+ Trống (01)' : '+ Trống (02)'}
                                </div>
                                <div className="text-[9px] text-text-muted/70">
                                  {seatDisplayRight === seat01 ? 'Vị trí 01' : 'Vị trí 02'}
                                </div>
                              </div>
                            )}
                          </div>
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
          <div className="w-full pt-5 border-t-2 border-dashed border-border/80 flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-2 font-medium">
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span>Cửa sổ thông gió & Tường sau phòng học</span>
            </div>
            <div className="font-bold uppercase tracking-widest text-text-muted inline-flex items-center gap-1.5">
              <span>PHÍA SAU LỚP</span>
              <ArrowDown size={14} weight="bold" />
            </div>
          </div>
        )}

        {/* Front Area when in 'nhin_tu_buc_giang' (View B: Nhìn từ bục giảng xuống - Board at bottom) */}
        {viewPerspective === 'nhin_tu_buc_giang' && (
          <div className="pt-6 border-t-2 border-border/80 space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
              <ArrowDown size={14} weight="bold" />
              <span>BỤC GIẢNG & BẢNG LỚP HỌC</span>
              <ArrowDown size={14} weight="bold" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
              {/* Front Left: CỬA RA VÀO (Aligned with Dãy 4) */}
              <div className="bg-emerald-50/80 border-2 border-emerald-200/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-emerald-300 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Door size={24} weight="bold" />
                </div>
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                    CỬA RA VÀO
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    Lối vào lớp học (Cạnh Dãy 4)
                  </div>
                </div>
              </div>

              {/* Front Center: BẢNG VIẾT PHẤN & BỤC GIẢNG (Aligned with Dãy 3 & Dãy 2) */}
              <div className="md:col-span-2 bg-[#132a24] text-white border-2 border-[#244b3f] rounded-2xl p-4 shadow-sm relative flex flex-col justify-center text-center">
                <div className="text-[13px] font-extrabold uppercase tracking-widest text-emerald-100 flex items-center justify-center gap-2">
                  <Chalkboard size={20} weight="bold" />
                  <span>BỤC GIẢNG & BẢNG VIẾT PHẤN</span>
                </div>
                <div className="text-[11px] text-emerald-300/80 mt-1 font-mono font-medium">
                  Bảng từ chống lóa 4.0m · Hướng nhìn từ bục giảng xuống lớp
                </div>

                {/* Chalk Tray Styling */}
                <div className="w-48 h-1.5 bg-emerald-950/90 rounded-full mx-auto mt-2 flex items-center justify-center gap-1.5">
                  <div className="w-4 h-1 bg-white rounded-xs opacity-90" />
                  <div className="w-3 h-1 bg-amber-300 rounded-xs opacity-90" />
                  <div className="w-6 h-1 bg-emerald-800 rounded-xs" />
                </div>
              </div>

              {/* Front Right: BÀN GIÁO VIÊN (Aligned with Dãy 1) */}
              <div className="bg-amber-50/80 border-2 border-amber-200/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-amber-300 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <ChalkboardTeacher size={24} weight="bold" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                    BÀN GIÁO VIÊN
                  </div>
                  <div className="text-[11px] text-amber-700 truncate font-medium mt-0.5">
                    {teacherName ? `GVCN: ${teacherName}` : 'Vị trí giảng bài (Cạnh Dãy 1)'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* UNSEATED STUDENTS SECTION */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4 no-print">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <UserPlus size={20} className="text-indigo-600" weight="duotone" />
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
          <div className="py-3 flex items-center gap-2.5 text-sm text-emerald-700 font-semibold bg-emerald-50/60 border border-emerald-100 px-4 rounded-xl">
            <CheckCircle size={18} weight="bold" className="text-emerald-600" />
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
                className={`px-3.5 py-2 rounded-xl border border-border bg-surface-muted text-sm font-semibold text-text-primary flex items-center gap-2 transition-all shadow-2xs ${
                  isHomeroom
                    ? 'hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                <span>{student.full_name}</span>
                <span className="font-mono text-xs text-text-muted">({student.student_code})</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
