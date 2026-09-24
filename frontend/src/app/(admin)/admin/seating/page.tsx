'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Armchair,
  Shuffle,
  ArrowsClockwise,
  UserPlus,
  X,
  ArrowsLeftRight,
  Info,
  Check,
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
  ShieldCheck,
  Student,
} from '@phosphor-icons/react';
import { SeatingService, StudentService, AttendanceService, ClassService } from '@/services';
import { LocalStore } from '@/lib/store';
import { DeskWithSeats, StudentRow, SeatWithStudent, ClassRow, UserRow } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { getTodayISO, formatDateVietnamese, cn } from '@/lib/utils';
import { getGradeShift } from '@/lib/constants';
import { PrintHeader, PrintSignatures } from '@/components/common/printable-paper';

const PERSISTENCE_KEY = 'cm_admin_seating_perspective';

// Helper to normalize class display name without duplicate "Lớp Lớp"
const formatClassName = (name?: string | null) => {
  if (!name) return '---';
  const clean = name.replace(/^lớp\s+/i, '').trim();
  return `Lớp ${clean}`;
};

export default function AdminSeatingPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const urlClassId = searchParams.get('classId');

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<'all' | '6' | '7' | '8' | '9'>('6');

  const [desks, setDesks] = useState<DeskWithSeats[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState(() => LocalStore.getSchoolSettings());

  useEffect(() => {
    const handleSettingsUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setSchoolSettings(detail);
      else setSchoolSettings(LocalStore.getSchoolSettings());
    };
    window.addEventListener('school-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('school-settings-updated', handleSettingsUpdate);
  }, []);

  // View perspective:
  // 'nhin_tu_duoi_len' (View A: Looking from back toward board - default)
  // 'nhin_tu_buc_giang' (View B: Looking from teaching platform down toward back)
  const [viewPerspective, setViewPerspective] = useState<'nhin_tu_duoi_len' | 'nhin_tu_buc_giang'>('nhin_tu_duoi_len');

  // Attendance overlay state & data
  const [showAttendanceOverlay, setShowAttendanceOverlay] = useState(false);
  const [todayAttendanceMap, setTodayAttendanceMap] = useState<Map<string, string>>(new Map());

  // Gender filter state
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

  // Initial load classes
  useEffect(() => {
    const activeClasses = LocalStore.getClasses().filter((c) => c.status === 'active');
    const teacherList = LocalStore.getTeachers();
    setClasses(activeClasses);
    setTeachers(teacherList);

    if (activeClasses.length > 0) {
      if (urlClassId && activeClasses.some((c) => c.id === urlClassId)) {
        setSelectedClassId(urlClassId);
        const target = activeClasses.find((c) => c.id === urlClassId);
        if (target) setGradeFilter(target.grade.toString() as any);
      } else {
        setSelectedClassId(activeClasses[0].id);
        setGradeFilter(activeClasses[0].grade.toString() as any);
      }
    }
  }, [urlClassId]);

  // Load seating data for selected class
  const loadClassSeating = (classId: string) => {
    if (!classId) return;
    setDesks(SeatingService.getDesks(classId));
    setStudents(StudentService.getStudents(classId));
    setSelectedSeatId(null);

    // Load today's attendance records for overlay
    const todayStr = getTodayISO();
    const todayAtts = AttendanceService.getAttendanceForDate(todayStr, classId);
    const attMap = new Map<string, string>();
    todayAtts.forEach((att) => {
      attMap.set(att.student_id, att.status);
    });
    setTodayAttendanceMap(attMap);
    setIsLoaded(true);
  };

  useEffect(() => {
    if (selectedClassId) {
      loadClassSeating(selectedClassId);
    }
  }, [selectedClassId]);

  // Current class details
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  const teacherName = useMemo(() => {
    if (!currentClass?.teacher_id) return null;
    const t = teachers.find((u) => u.id === currentClass.teacher_id);
    return t ? t.name : null;
  }, [currentClass, teachers]);

  // Unseated students
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
      const res = SeatingService.swapSeats(selectedSeatId, seat.id, selectedClassId, user);
      if (!res.success) {
        toast.error(res.error || 'Hoán đổi chỗ ngồi thất bại');
        return;
      }
      toast.success('Đã hoán đổi vị trí chỗ ngồi!');
      setSelectedSeatId(null);
      loadClassSeating(selectedClassId);
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

      const res = SeatingService.assignSeat(emptySeatId, studentId, selectedClassId, user);
      if (!res.success) {
        toast.error(res.error || 'Xếp chỗ thất bại');
        return;
      }
      toast.success('Đã xếp học sinh vào ghế trống đầu tiên');
      loadClassSeating(selectedClassId);
    } else {
      const res = SeatingService.assignSeat(selectedSeatId, studentId, selectedClassId, user);
      if (!res.success) {
        toast.error(res.error || 'Xếp chỗ thất bại');
        return;
      }
      toast.success('Đã xếp học sinh vào ghế đã chọn');
      setSelectedSeatId(null);
      loadClassSeating(selectedClassId);
    }
  };

  // Remove student from seat
  const handleRemoveFromSeat = (e: React.MouseEvent, seatId: string) => {
    e.stopPropagation();
    const res = SeatingService.assignSeat(seatId, null, selectedClassId, user);
    if (!res.success) {
      toast.error(res.error || 'Gỡ học sinh thất bại');
      return;
    }
    if (selectedSeatId === seatId) setSelectedSeatId(null);
    toast.success('Đã đưa học sinh ra khỏi chỗ ngồi');
    loadClassSeating(selectedClassId);
  };

  // Randomize all seats
  const handleRandomize = () => {
    const res = SeatingService.randomizeSeating(selectedClassId, user);
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
    const res = SeatingService.clearAllSeats(selectedClassId, user);
    if (!res.success) {
      toast.error(res.error || 'Xếp lại từ đầu thất bại');
      return;
    }
    if (res.data) setDesks(res.data);
    setSelectedSeatId(null);
    toast.success('Đã làm trống toàn bộ sơ đồ chỗ ngồi');
  };

  // Alternate gender seating
  const handleAlternateGender = () => {
    const activeStudents = [...students].filter((s) => s.status === 'active');
    const males = activeStudents.filter((s) => s.gender === 'male');
    const females = activeStudents.filter((s) => s.gender === 'female');

    // Shuffle arrays
    for (let i = males.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [males[i], males[j]] = [males[j], males[i]];
    }
    for (let i = females.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [females[i], females[j]] = [females[j], females[i]];
    }

    const updatedDesks = desks.map((d) => ({
      ...d,
      seats: d.seats.map((s) => ({ ...s, student_id: null as string | null, student: null as StudentRow | null })),
    }));

    updatedDesks.forEach((desk) => {
      const leftSeat = desk.seats[0];
      const rightSeat = desk.seats[1];

      if (leftSeat && males.length > 0) {
        const m = males.pop()!;
        leftSeat.student_id = m.id;
        leftSeat.student = m;
      } else if (leftSeat && females.length > 0) {
        const f = females.pop()!;
        leftSeat.student_id = f.id;
        leftSeat.student = f;
      }

      if (rightSeat && females.length > 0) {
        const f = females.pop()!;
        rightSeat.student_id = f.id;
        rightSeat.student = f;
      } else if (rightSeat && males.length > 0) {
        const m = males.pop()!;
        rightSeat.student_id = m.id;
        rightSeat.student = m;
      }
    });

    LocalStore.saveDesks(selectedClassId, updatedDesks);
    setDesks(updatedDesks);
    setSelectedSeatId(null);
    toast.success('Đã tự động xếp chỗ ngồi xen kẽ Nam - Nữ cho cả lớp!');
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

  // Distinct rows and cols
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

  if (!isLoaded || !currentClass) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full mx-auto">
        <div className="h-8 w-64 bg-surface-muted rounded animate-pulse" />
        <div className="h-[600px] bg-surface-muted rounded-sm animate-pulse" />
      </div>
    );
  }

  const shift = getGradeShift(currentClass.grade);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full mx-auto">
      {/* ========================================================================= */}
      {/* FORMAL PRINT VIEW (A4 Landscape Seating Chart Table) */}
      {/* ========================================================================= */}
      <div className="hidden print:block p-2 max-w-[100%] mx-auto text-black bg-white printable-card">
        <PrintHeader
          settings={schoolSettings}
          title={`SƠ ĐỒ CHỖ NGỒI ${formatClassName(currentClass?.name)}`}
          metaLines={[
            `Phòng học: ${currentClass?.room_name || 'Phòng học chính'} · Sĩ số: ${students.length}/40 học sinh (${genderStats.maleCount} Nam · ${genderStats.femaleCount} Nữ)`,
            `Đã xếp: ${seatedCount}/40 vị trí · Hướng nhìn: ${viewPerspective === 'nhin_tu_duoi_len' ? 'Từ cuối lớp lên Bảng' : 'Từ bục giảng xuống Lớp'} · GVCN: ${teacherName || '...'}`,
          ]}
        />

        {/* Podium / Black Board Header */}
        <div className="border-2 border-black py-1.5 px-4 mb-3 text-center bg-gray-100 font-bold uppercase tracking-wider text-[9.5pt] flex justify-between items-center">
          <span className="text-[8.5pt]">[ CỬA VÀO LỚP ]</span>
          <span className="text-[10pt] font-black">BỤC GIẢNG & BẢNG LỚP HỌC</span>
          <span className="text-[8.5pt]">[ BÀN GIÁO VIÊN ]</span>
        </div>

        {/* Seating Grid Table */}
        <table className="w-full border-collapse border-2 border-black text-center text-[8.5pt]">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black font-bold uppercase text-[9pt]">
              <th className="border border-black py-1.5 w-14">Vị trí</th>
              {orderedColNumbers.map((colNum) => (
                <th key={colNum} className="border border-black py-1.5 w-1/4">
                  DÃY {colNum}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedRowNumbers.map((rowNum) => (
              <tr key={rowNum} className="border-b border-black">
                <td className="border border-black py-2 font-bold bg-gray-50 text-[8.5pt]">
                  Bàn {rowNum}
                </td>
                {orderedColNumbers.map((colNum) => {
                  const desk = desks.find((d) => d.row_num === rowNum && d.col_num === colNum);
                  const seat01 = desk?.seats[0];
                  const seat02 = desk?.seats[1];
                  const [leftSeat, rightSeat] =
                    viewPerspective === 'nhin_tu_duoi_len'
                      ? [seat01, seat02]
                      : [seat02, seat01];

                  return (
                    <td key={colNum} className="border border-black p-1 align-top bg-white">
                      <div className="grid grid-cols-2 gap-1 min-h-[50px]">
                        {/* Left Seat */}
                        <div className="border border-black/60 p-1 text-left flex flex-col justify-between bg-gray-50/50">
                          <div className="font-bold text-[8.5pt] text-black leading-tight truncate">
                            {leftSeat?.student?.full_name || <span className="text-gray-400 italic font-normal">Trống</span>}
                          </div>
                          <div className="text-[7pt] text-gray-700 font-mono mt-0.5 flex justify-between">
                            <span>{leftSeat?.student?.student_code || 'G1'}</span>
                            <span>{leftSeat?.student?.gender === 'female' ? 'Nữ' : leftSeat?.student ? 'Nam' : ''}</span>
                          </div>
                        </div>

                        {/* Right Seat */}
                        <div className="border border-black/60 p-1 text-left flex flex-col justify-between bg-gray-50/50">
                          <div className="font-bold text-[8.5pt] text-black leading-tight truncate">
                            {rightSeat?.student?.full_name || <span className="text-gray-400 italic font-normal">Trống</span>}
                          </div>
                          <div className="text-[7pt] text-gray-700 font-mono mt-0.5 flex justify-between">
                            <span>{rightSeat?.student?.student_code || 'G2'}</span>
                            <span>{rightSeat?.student?.gender === 'female' ? 'Nữ' : rightSeat?.student ? 'Nam' : ''}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Back Wall Marker */}
        <div className="border border-dashed border-black/60 py-1 px-4 mt-2 mb-2 text-center text-[8pt] text-gray-700 font-mono uppercase">
          PHÍA CUỐI PHÒNG HỌC & CỬA SỔ
        </div>

        <PrintSignatures
          settings={schoolSettings}
          creatorRoleTitle="GIÁO VIÊN CHỦ NHIỆM"
          creatorName={teacherName || 'Nguyễn Văn An'}
        />
      </div>

      {/* =============================================
          1. HEADER & CLASS SELECTOR
          ============================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border no-print">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide uppercase text-text-primary">
              QUẢN LÝ SƠ ĐỒ CHỖ NGỒI TOÀN TRƯỜNG
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-teal-subtle text-teal border border-teal/30 font-bold text-xs whitespace-nowrap flex-shrink-0">
              <Armchair size={14} weight="bold" />
              16 Lớp THCS
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-surface-muted text-text-secondary border border-border font-bold text-xs whitespace-nowrap flex-shrink-0">
              <ShieldCheck size={14} weight="bold" className="text-teal" />
              Toàn quyền Quản trị
            </span>
          </div>
          <p className="text-xs md:text-sm text-text-muted mt-1 font-medium">
            Giám sát và điều phối sơ đồ bàn học 16 lớp THCS. Hoán đổi vị trí, xếp chỗ thông minh, hiển thị chuyên cần và in ấn sơ đồ lớp.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePerspective}
            className="h-8 px-2.5 text-xs font-semibold cursor-pointer border-border hover:border-teal gap-1.5 whitespace-nowrap flex-shrink-0"
            title="Đổi hướng quan sát sơ đồ lớp"
          >
            <ArrowsDownUp size={14} weight="bold" className="text-teal" />
            <span className="hidden sm:inline">Góc nhìn:</span>
            <strong className="text-text-primary">
              {viewPerspective === 'nhin_tu_duoi_len' ? 'Cuối lớp ➔ Bảng' : 'Bục giảng ➔ Lớp'}
            </strong>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAttendanceOverlay(!showAttendanceOverlay)}
            className={cn(
              'h-8 px-2.5 text-xs font-semibold cursor-pointer border gap-1.5 whitespace-nowrap flex-shrink-0 transition-colors',
              showAttendanceOverlay
                ? 'bg-teal-subtle text-teal border-teal/40 font-bold'
                : 'bg-surface text-text-secondary border-border hover:border-text-muted'
            )}
            title="Hiển thị tình trạng có mặt / vắng / muộn hôm nay trên ghế"
          >
            {showAttendanceOverlay ? <Eye size={14} weight="bold" /> : <EyeSlash size={14} />}
            <span>Chuyên cần hôm nay</span>
            {todayAbsentCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-danger text-white">
                {todayAbsentCount}
              </span>
            )}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            className="h-8 px-2.5 text-xs font-semibold cursor-pointer bg-surface hover:bg-surface-muted text-text-primary border-border shadow-2xs gap-1.5 whitespace-nowrap flex-shrink-0"
            title="In sơ đồ lớp học ra máy in hoặc lưu PDF"
          >
            <Printer size={14} weight="bold" />
            <span>In sơ đồ</span>
          </Button>
        </div>
      </div>

      {/* =============================================
          2. GRADE & CLASS SWITCHER (STRICT SINGLE-LINE TABS)
          ============================================= */}
      <div className="bg-surface rounded-sm border border-border p-4 shadow-xs space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-text-primary tracking-wide">
              Chọn Lớp học để xem & điều phối sơ đồ:
            </span>
          </div>

          {/* Grade selection tabs */}
          <div className="inline-flex items-center border border-border rounded-xs bg-surface-muted/50 p-0.5 text-xs font-bold flex-shrink-0">
            {['6', '7', '8', '9'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setGradeFilter(g as any);
                  const firstOfGrade = classes.find((c) => c.grade.toString() === g);
                  if (firstOfGrade) setSelectedClassId(firstOfGrade.id);
                }}
                className={cn(
                  'px-3 py-1 rounded-xs transition-colors cursor-pointer text-xs whitespace-nowrap flex-shrink-0 font-medium',
                  gradeFilter === g
                    ? 'bg-surface text-text-primary shadow-2xs font-extrabold border border-border'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                Khối {g}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Class Buttons of the selected grade */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {classes
            .filter((c) => c.grade.toString() === gradeFilter)
            .map((cls) => {
              const isSelected = cls.id === selectedClassId;
              const gvcn = cls.teacher_id ? teachers.find((t) => t.id === cls.teacher_id)?.name : 'Chưa phân công';

              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => setSelectedClassId(cls.id)}
                  className={cn(
                    'p-3 rounded-xs border text-left transition-all cursor-pointer relative',
                    isSelected
                      ? 'bg-teal-subtle/50 border-teal text-text-primary shadow-2xs ring-1 ring-teal'
                      : 'bg-surface hover:bg-surface-muted/50 border-border text-text-secondary'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-text-primary">
                      {formatClassName(cls.name)}
                    </span>
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-xs font-mono font-bold border whitespace-nowrap',
                      isSelected ? 'bg-teal text-white border-teal' : 'bg-surface-muted text-text-muted border-border'
                    )}>
                      {cls.room_name || 'Phòng học'}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-muted truncate mt-1">
                    GVCN: <strong className="text-text-primary font-medium">{gvcn}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-muted mt-2 pt-1.5 border-t border-border/50">
                    <span>Sĩ số: <strong className="text-text-primary font-mono">{cls.max_students || 30} HS</strong></span>
                    <span>16 Bàn · 32 Ghế</span>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* =============================================
          3. CLASS INFO & SEATING TOOLBAR
          ============================================= */}
      <div className="bg-surface rounded-sm border border-border p-4 shadow-xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Class Quick Overview */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xs bg-teal-subtle text-teal border border-teal/40 flex items-center justify-center font-extrabold text-lg flex-shrink-0 shadow-2xs">
              {currentClass.name.replace(/^lớp\s+/i, '').trim()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-text-primary">
                  {formatClassName(currentClass.name)}
                </span>
                <span className={cn(
                  'px-2 py-0.5 rounded-xs font-bold text-xs border whitespace-nowrap',
                  shift === 'morning' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-teal-100 text-teal-900 border-teal-300'
                )}>
                  {shift === 'morning' ? 'Ca Sáng (07:15 - 11:35)' : 'Ca Chiều (12:45 - 17:05)'}
                </span>
                <span className="text-xs text-text-muted font-medium">· Phòng: <strong>{currentClass.room_name || 'Chưa cập nhật'}</strong></span>
              </div>
              <div className="text-xs text-text-muted mt-1 flex items-center gap-3 flex-wrap">
                <span>GVCN: <strong className="text-text-primary">{teacherName || 'Chưa phân công'}</strong></span>
                <span>·</span>
                <span>Đã xếp chỗ: <strong className="text-teal font-mono font-bold">{seatedCount} / {students.length}</strong> học sinh</span>
                <span>·</span>
                <span>Tỷ lệ Nam/Nữ: <strong className="text-blue-700 font-mono">{genderStats.maleCount} Nam</strong> / <strong className="text-rose-700 font-mono">{genderStats.femaleCount} Nữ</strong></span>
              </div>
            </div>
          </div>

          {/* Seating Management Actions (Admin Full Rights) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Gender filter */}
            <div className="flex items-center border border-border rounded-xs bg-surface p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setGenderFilter('all')}
                className={cn('px-2.5 py-1 rounded-xs transition-colors cursor-pointer text-xs', genderFilter === 'all' ? 'bg-surface-muted text-text-primary font-bold' : 'text-text-muted')}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('male')}
                className={cn('px-2.5 py-1 rounded-xs transition-colors cursor-pointer text-xs', genderFilter === 'male' ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200' : 'text-text-muted')}
              >
                Nam ({genderStats.maleCount})
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('female')}
                className={cn('px-2.5 py-1 rounded-xs transition-colors cursor-pointer text-xs', genderFilter === 'female' ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200' : 'text-text-muted')}
              >
                Nữ ({genderStats.femaleCount})
              </button>
            </div>

            {/* Smart Gender Alternation */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAlternateGender}
              className="h-8 px-2.5 text-xs font-bold cursor-pointer text-teal border-teal/40 hover:bg-teal-subtle gap-1 whitespace-nowrap"
              title="Xếp chỗ xen kẽ 1 nam 1 nữ trên từng bàn"
            >
              <Sparkle size={14} weight="bold" />
              <span>Xen kẽ Nam-Nữ</span>
            </Button>

            {/* Randomize */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRandomize}
              className="h-8 px-2.5 text-xs font-semibold cursor-pointer border-border hover:border-text-muted gap-1 whitespace-nowrap"
              title="Xáo trộn ngẫu nhiên chỗ ngồi (Thuật toán Fisher-Yates)"
            >
              <Shuffle size={14} />
              <span>Xáo trộn</span>
            </Button>

            {/* Clear All */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-8 px-2.5 text-xs font-semibold cursor-pointer text-danger hover:bg-danger-bg gap-1 whitespace-nowrap"
              title="Làm trống toàn bộ sơ đồ"
            >
              <ArrowsClockwise size={14} />
              <span>Xếp lại</span>
            </Button>
          </div>
        </div>
      </div>

      {/* =============================================
          4. INTERACTIVE SEATING CHART (16 DESKS · 32 SEATS)
          ============================================= */}
      <div className="bg-surface rounded-sm border border-border p-4 sm:p-6 shadow-xs space-y-6 no-print">
        {/* Selection Hint Banner */}
        {selectedSeatId && (
          <div className="p-3 rounded-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-2xs animate-fade-in">
            <div className="flex items-center gap-2">
              <ArrowsLeftRight size={16} weight="bold" className="text-amber-800" />
              <span>
                Đang chọn ghế: <strong className="font-bold underline">{selectedSeatObj?.student ? selectedSeatObj.student.full_name : 'Ghế trống'}</strong>. Nhấp vào ghế thứ 2 để hoán đổi vị trí chỗ ngồi!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSeatId(null)}
              className="p-1 rounded-xs hover:bg-amber-200 text-amber-950 cursor-pointer"
              title="Hủy chọn"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        )}

        {/* FRONT OF CLASSROOM (PODIUM, BOARD, DOOR, TEACHER DESK) */}
        {viewPerspective === 'nhin_tu_duoi_len' && (
          <div className="grid grid-cols-4 gap-3 text-xs border-b border-border pb-4">
            <div className="p-2.5 rounded-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-amber-900 text-center flex flex-col items-center justify-center">
              <ChalkboardTeacher size={18} weight="duotone" className="text-amber-800" />
              <span className="font-bold mt-0.5">Bàn Giáo viên</span>
              <span className="text-[10px] text-text-muted truncate max-w-full">
                {teacherName ? `GVCN: ${teacherName}` : 'Vị trí giảng dạy'}
              </span>
            </div>
            <div className="col-span-2 p-2.5 rounded-xs bg-teal-subtle/40 border border-teal/30 text-teal text-center flex flex-col items-center justify-center">
              <Chalkboard size={20} weight="duotone" />
              <span className="font-bold mt-0.5">BẢNG LỚP HỌC & BỤC GIẢNG</span>
              <span className="text-[10px] text-text-muted">Khu vực trung tâm quan sát</span>
            </div>
            <div className="p-2.5 rounded-xs bg-surface-muted/60 border border-border text-text-secondary text-center flex flex-col items-center justify-center">
              <Door size={18} weight="duotone" className="text-text-muted" />
              <span className="font-bold mt-0.5">Cửa vào lớp</span>
              <span className="text-[10px] text-text-muted">Cạnh Dãy 4</span>
            </div>
          </div>
        )}

        {/* 16 DESKS MATRIX (4 COLUMNS X 4 ROWS) */}
        <div className="space-y-4">
          {orderedRowNumbers.map((rowNum) => {
            return (
              <div key={rowNum} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {orderedColNumbers.map((colNum) => {
                  const desk = desks.find((d) => d.row_num === rowNum && d.col_num === colNum);
                  if (!desk) return <div key={colNum} className="h-28 rounded-xs border border-dashed border-border/40" />;

                  const seat01 = desk.seats[0]; // logical Seat 01 (left when viewed from back)
                  const seat02 = desk.seats[1]; // logical Seat 02 (right when viewed from back)

                  // Seat rendering order inside each desk:
                  // "Nhìn từ cuối lớp lên bảng" (View A): Left is Seat 01, Right is Seat 02
                  // "Nhìn từ bục giảng xuống lớp" (View B): Left is Seat 02, Right is Seat 01 (mirrored)
                  const [seatDisplayLeft, seatDisplayRight] =
                    viewPerspective === 'nhin_tu_duoi_len'
                      ? [seat01, seat02]
                      : [seat02, seat01];

                  return (
                    <div
                      key={desk.id}
                      className="p-2.5 rounded-xs border border-border bg-surface-muted/40 hover:bg-surface transition-all space-y-2 relative shadow-2xs"
                    >
                      {/* Desk Header */}
                      <div className="flex items-center justify-between text-[11px] pb-1 border-b border-border/60">
                        <span className="font-mono font-bold text-text-secondary">
                          Dãy {desk.col_num} · Hàng {desk.row_num}
                        </span>
                        <span className="text-[10px] px-1 py-0.2 rounded-xs bg-surface text-text-muted font-mono border border-border">
                          Bàn {desk.desk_number}
                        </span>
                      </div>

                      {/* 2 Seats per Desk */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {[seatDisplayLeft, seatDisplayRight].map((seat, seatIdx) => {
                          if (!seat) return null;
                          const isSelected = selectedSeatId === seat.id;
                          const stu = seat.student;
                          const attStatus = stu ? todayAttendanceMap.get(stu.id) : null;
                          const isDimmed = genderFilter !== 'all' && stu && stu.gender !== genderFilter;

                          return (
                            <div
                              key={seat.id}
                              onClick={() => handleSeatClick(seat)}
                              className={cn(
                                'p-2 rounded-xs border text-left transition-all cursor-pointer relative min-h-[68px] flex flex-col justify-between group',
                                isSelected
                                  ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400 font-bold'
                                  : stu
                                  ? stu.gender === 'male'
                                    ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 hover:border-blue-400'
                                    : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 hover:border-rose-400'
                                  : 'bg-surface/80 border-dashed border-border hover:border-text-muted',
                                isDimmed && 'opacity-30'
                              )}
                              title={
                                stu
                                  ? `${stu.full_name} (${stu.student_code}) · Nhấp để hoán đổi`
                                  : 'Ghế trống · Nhấp để xếp học sinh'
                              }
                            >
                              {/* Seat Student Info */}
                              {stu ? (
                                <>
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="font-bold text-[11px] text-text-primary line-clamp-1 leading-tight">
                                      {stu.full_name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => handleRemoveFromSeat(e, seat.id)}
                                      className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-opacity p-0.5 rounded cursor-pointer"
                                      title="Gỡ khỏi ghế"
                                    >
                                      <X size={11} weight="bold" />
                                    </button>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-text-muted font-mono mt-1">
                                    <span>{stu.student_code}</span>
                                    {stu.gender === 'male' ? (
                                      <GenderMale size={11} weight="bold" className="text-blue-600" />
                                    ) : (
                                      <GenderFemale size={11} weight="bold" className="text-rose-600" />
                                    )}
                                  </div>

                                  {/* Attendance Overlay Badge */}
                                  {showAttendanceOverlay && attStatus && (
                                    <div className="mt-1 pt-1 border-t border-border/40">
                                      {attStatus === 'present' ? (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-success">
                                          <CheckCircle size={10} weight="fill" /> Có mặt
                                        </span>
                                      ) : attStatus === 'late' ? (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-100 px-1 rounded-xs">
                                          Đi muộn
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-white bg-danger px-1 rounded-xs">
                                          Vắng
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-text-muted py-2">
                                  <Armchair size={15} className="opacity-40 mb-0.5" />
                                  <span className="text-[10px] font-mono">Ghế trống</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* FRONT OF CLASSROOM (PODIUM) IF VIEW B (LOOKING DOWN FROM PODIUM) */}
        {viewPerspective === 'nhin_tu_buc_giang' && (
          <div className="grid grid-cols-4 gap-3 text-xs border-t border-border pt-4">
            <div className="p-2.5 rounded-xs bg-surface-muted/60 border border-border text-text-secondary text-center flex flex-col items-center justify-center">
              <Door size={18} weight="duotone" className="text-text-muted" />
              <span className="font-bold mt-0.5">Cửa vào lớp</span>
              <span className="text-[10px] text-text-muted">Cạnh Dãy 4</span>
            </div>
            <div className="col-span-2 p-2.5 rounded-xs bg-teal-subtle/40 border border-teal/30 text-teal text-center flex flex-col items-center justify-center">
              <Chalkboard size={20} weight="duotone" />
              <span className="font-bold mt-0.5">BẢNG LỚP HỌC & BỤC GIẢNG</span>
              <span className="text-[10px] text-text-muted">Vị trí đứng của Thầy / Cô</span>
            </div>
            <div className="p-2.5 rounded-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-amber-900 text-center flex flex-col items-center justify-center">
              <ChalkboardTeacher size={18} weight="duotone" className="text-amber-800" />
              <span className="font-bold mt-0.5">Bàn Giáo viên</span>
              <span className="text-[10px] text-text-muted truncate max-w-full">
                {teacherName ? `GVCN: ${teacherName}` : 'Vị trí giảng dạy'}
              </span>
            </div>
          </div>
        )}
      </div>



      {/* =============================================
          5. UNSEATED STUDENTS DRAWER (HỌC SINH CHƯA XẾP CHỖ)
          ============================================= */}
      {unseatedStudents.length > 0 && (
        <div className="bg-surface rounded-sm border border-amber-300 bg-amber-50/20 p-4 space-y-3 shadow-xs no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-amber-800" weight="bold" />
              <h2 className="text-xs font-bold uppercase text-amber-950 tracking-wider">
                Học sinh chưa xếp chỗ ngồi ({unseatedStudents.length} em)
              </h2>
            </div>
            <span className="text-[11px] text-text-muted">
              Nhấp vào học sinh để tự động xếp vào ghế trống hoặc ghế đang chọn
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {unseatedStudents.map((stu) => (
              <button
                key={stu.id}
                type="button"
                onClick={() => handleAssignUnseated(stu.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs bg-surface border border-border hover:border-teal hover:bg-teal-subtle/30 text-xs font-semibold text-text-primary transition-colors cursor-pointer shadow-2xs"
              >
                <span>{stu.full_name}</span>
                <span className="text-[10px] font-mono text-text-muted">({stu.student_code})</span>
                <UserPlus size={12} weight="bold" className="text-teal" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
