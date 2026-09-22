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
} from '@phosphor-icons/react';
import { SeatingService, StudentService } from '@/services';
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

  // Handle seat click (for swap or assignment)
  const handleSeatClick = (seat: SeatWithStudent) => {
    if (!isHomeroom) {
      if (seat.student) {
        toast.info(`Vị trí: ${seat.side === 'left' ? 'Bên trái' : 'Bên phải'} · Học sinh: ${seat.student.full_name} (${seat.student.student_code})`);
      } else {
        toast.info(`Ghế trống`);
      }
      return;
    }

    if (!selectedSeatId) {
      // First selection
      setSelectedSeatId(seat.id);
      if (seat.student) {
        toast.info(`Đã chọn ghế của ${seat.student.full_name}. Nhấp ghế khác để hoán đổi.`);
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
    toast.success('Đã xáo trộn ngẫu nhiên chỗ ngồi cho cả lớp!');
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
    toast.success('Đã xoá toàn bộ sơ đồ chỗ ngồi');
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

  if (!isLoaded) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 bg-surface-muted rounded animate-pulse" />
        <div className="h-96 bg-surface-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Sơ đồ chỗ ngồi {currentClass ? currentClass.name : 'lớp học'}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-accent-subtle text-accent rounded-full">
              {seatedCount}/{desks.length * 2} chỗ đã xếp
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Bố trí 25 bàn học (5 dãy × 5 hàng), mỗi bàn 2 ghế trái/phải. {isHomeroom ? 'Nhấp chọn 2 ghế để hoán đổi vị trí.' : 'Nhấp vào ghế để xem chi tiết học sinh.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap no-print">
          <Button variant="secondary" onClick={() => window.print()} className="gap-1.5" title="In sơ đồ chỗ ngồi khổ A4 ngang">
            <Printer size={16} />
            <span>In sơ đồ</span>
          </Button>

          {isHomeroom && (
            <>
              <Button variant="secondary" onClick={handleRandomize} title="Xáo trộn ngẫu nhiên bằng thuật toán Fisher-Yates">
                <Shuffle size={16} />
                <span>Đổi chỗ ngẫu nhiên</span>
              </Button>

              <Button variant="ghost" onClick={handleClearAll} className="text-text-muted hover:text-danger">
                <ArrowsClockwise size={16} />
                <span>Xếp lại từ đầu</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Role Banner for Subject Teachers */}
      {isSubjectTeacher && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 no-print">
          <span>
            Bạn đang xem sơ đồ chỗ ngồi lớp <strong>{currentClass?.name}</strong> với vai trò <strong>Giáo viên Bộ môn ({teacherSubjects.map((s) => s.name).join(', ')})</strong>. Chế độ tra cứu vị trí học sinh khi vào lớp dạy.
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 font-medium text-[11px]">Chỉ xem sơ đồ</span>
        </div>
      )}

      {/* Notice / Action bar when seat is selected */}
      {selectedSeatId && (
        <div className="p-3 bg-accent-subtle border border-accent/30 rounded-lg flex items-center justify-between text-xs text-accent no-print">
          <div className="flex items-center gap-2">
            <ArrowsLeftRight size={16} className="animate-pulse" />
            <span>
              Đang chọn: <strong>{selectedStudent ? selectedStudent.full_name : 'Ghế trống'}</strong>.
              Nhấp vào một ghế khác để hoán đổi chỗ, hoặc chọn học sinh chưa xếp ở bảng dưới.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedSeatId(null)}
            className="p-1 hover:bg-accent/10 rounded transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Main Grid: Classroom Layout */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-8 printable-card">
        {/* Blackboard area */}
        <div className="w-full max-w-2xl mx-auto py-2.5 bg-zinc-800 text-zinc-100 rounded-lg text-center shadow-inner">
          <div className="text-xs font-semibold tracking-widest uppercase">
            Bục giảng & Bảng viết (Hướng nhìn của giáo viên)
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            Dãy 1 ← Dãy 2 ← Dãy 3 → Dãy 4 → Dãy 5
          </div>
        </div>

        {/* Classroom 5x5 Desk Grid */}
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((rowNum) => {
            const rowDesks = desks.filter((d) => d.row_num === rowNum);
            rowDesks.sort((a, b) => a.col_num - b.col_num);

            return (
              <div key={`row-${rowNum}`} className="space-y-1">
                <div className="text-[11px] font-mono font-medium text-text-muted text-center">
                  Hàng {rowNum}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                  {rowDesks.map((desk) => {
                    const seatL = desk.seats[0];
                    const seatR = desk.seats[1];

                    return (
                      <div
                        key={desk.id}
                        className="bg-surface-subtle border border-border/80 rounded-xl p-2.5 flex flex-col justify-between hover:border-accent/40 transition-colors shadow-2xs"
                      >
                        {/* Desk Header */}
                        <div className="flex items-center justify-between text-[11px] font-mono text-text-muted pb-1.5 border-b border-border/60">
                          <span className="font-semibold text-text-secondary">Bàn {desk.desk_number}</span>
                          <span className="text-[10px]">Dãy {desk.col_num}</span>
                        </div>

                        {/* 2 Seats per Desk (Left & Right) */}
                        <div className="grid grid-cols-2 gap-1.5 pt-2">
                          {/* Left Seat */}
                          <div
                            onClick={() => handleSeatClick(seatL)}
                            className={`p-2 rounded-lg border text-xs cursor-pointer transition-all relative group/seat ${
                              selectedSeatId === seatL.id
                                ? 'bg-accent-subtle border-accent ring-2 ring-accent/30'
                                : seatL.student
                                ? 'bg-surface border-border hover:border-accent/50'
                                : 'bg-surface/50 border-dashed border-border/80 hover:bg-surface'
                            }`}
                          >
                            {seatL.student ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-mono text-text-muted">
                                    {seatL.student.student_code}
                                  </span>
                                  {seatL.student.gender === 'male' ? (
                                    <GenderMale size={11} className="text-blue-500" />
                                  ) : (
                                    <GenderFemale size={11} className="text-rose-500" />
                                  )}
                                </div>
                                <div className="font-semibold text-text-primary truncate text-[11px]" title={seatL.student.full_name}>
                                  {seatL.student.full_name.split(' ').slice(-1)[0]}
                                </div>
                                <div className="text-[9px] text-text-muted truncate">
                                  {seatL.student.full_name.split(' ').slice(0, -1).join(' ')}
                                </div>
                                {isHomeroom && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleRemoveFromSeat(e, seatL.id)}
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover/seat:opacity-100 transition-opacity shadow-xs"
                                    title="Gỡ khỏi ghế"
                                  >
                                    <X size={10} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="py-2.5 text-center text-text-muted text-[10px] italic">
                                Trống (T)
                              </div>
                            )}
                          </div>

                          {/* Right Seat */}
                          <div
                            onClick={() => handleSeatClick(seatR)}
                            className={`p-2 rounded-lg border text-xs cursor-pointer transition-all relative group/seat ${
                              selectedSeatId === seatR.id
                                ? 'bg-accent-subtle border-accent ring-2 ring-accent/30'
                                : seatR.student
                                ? 'bg-surface border-border hover:border-accent/50'
                                : 'bg-surface/50 border-dashed border-border/80 hover:bg-surface'
                            }`}
                          >
                            {seatR.student ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-mono text-text-muted">
                                    {seatR.student.student_code}
                                  </span>
                                  {seatR.student.gender === 'male' ? (
                                    <GenderMale size={11} className="text-blue-500" />
                                  ) : (
                                    <GenderFemale size={11} className="text-rose-500" />
                                  )}
                                </div>
                                <div className="font-semibold text-text-primary truncate text-[11px]" title={seatR.student.full_name}>
                                  {seatR.student.full_name.split(' ').slice(-1)[0]}
                                </div>
                                <div className="text-[9px] text-text-muted truncate">
                                  {seatR.student.full_name.split(' ').slice(0, -1).join(' ')}
                                </div>
                                {isHomeroom && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleRemoveFromSeat(e, seatR.id)}
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover/seat:opacity-100 transition-opacity shadow-xs"
                                    title="Gỡ khỏi ghế"
                                  >
                                    <X size={10} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="py-2.5 text-center text-text-muted text-[10px] italic">
                                Trống (P)
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

        {/* Bottom Classroom Door / Windows notice */}
        <div className="flex items-center justify-between text-xs text-text-muted pt-4 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Info size={14} />
            <span>Mẹo: Click vào bất kỳ 2 ghế học sinh nào để hoán đổi chỗ ngồi ngay lập tức.</span>
          </div>
          <div>Cửa ra vào lớp học (Phía cuối)</div>
        </div>
      </div>

      {/* Unseated Students Section (if any) */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-3 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">
              Học sinh chưa xếp chỗ ({unseatedStudents.length})
            </h2>
          </div>
          {unseatedStudents.length > 0 && isHomeroom && (
            <span className="text-xs text-text-muted">
              Nhấp vào học sinh để tự động xếp vào ghế trống hoặc ghế đang chọn
            </span>
          )}
        </div>

        {unseatedStudents.length === 0 ? (
          <p className="text-xs text-text-muted py-2">
            Tất cả {students.length} học sinh trong lớp đều đã được xếp chỗ ngồi đầy đủ.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {unseatedStudents.map((student) => (
              <button
                key={student.id}
                type="button"
                disabled={!isHomeroom}
                onClick={() => isHomeroom && handleAssignUnseated(student.id)}
                className={`px-3 py-1.5 rounded-lg border border-border bg-surface-subtle text-xs font-medium text-text-primary flex items-center gap-2 transition-colors ${
                  isHomeroom ? 'hover:bg-accent-subtle hover:border-accent cursor-pointer' : 'cursor-default'
                }`}
              >
                <span>{student.full_name}</span>
                <span className="font-mono text-[10px] text-text-muted">({student.student_code})</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
