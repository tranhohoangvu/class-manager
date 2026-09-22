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
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              Sơ đồ chỗ ngồi {currentClass ? currentClass.name : 'lớp học'}
            </h1>
            <span className="px-3 py-1 text-[13px] font-bold bg-accent/10 text-accent rounded-full border border-accent/20">
              {seatedCount}/{desks.length * 2} chỗ đã xếp · {desks.length * 2 - seatedCount} chỗ trống
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1.5 font-medium">
            Sơ đồ phòng học (5 dãy × 5 hàng). {isHomeroom ? 'Nhấp chọn 2 ghế bất kỳ để hoán đổi vị trí chỗ ngồi.' : 'Nhấp vào ghế để tra cứu vị trí học sinh.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap no-print">
          <Button variant="secondary" size="md" onClick={() => window.print()} title="In sơ đồ chỗ ngồi khổ A4 ngang">
            <Printer size={18} weight="bold" />
            <span>In sơ đồ</span>
          </Button>

          {isHomeroom && (
            <>
              <Button variant="secondary" size="md" onClick={handleRandomize} title="Xáo trộn ngẫu nhiên bằng thuật toán Fisher-Yates">
                <Shuffle size={18} weight="bold" />
                <span>Đổi chỗ ngẫu nhiên</span>
              </Button>

              <Button variant="ghost" size="md" onClick={handleClearAll} className="text-text-muted hover:text-danger">
                <ArrowsClockwise size={18} />
                <span>Xếp lại từ đầu</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Role Banner for Subject Teachers */}
      {isSubjectTeacher && (
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl flex items-center justify-between text-[14px] text-indigo-900 no-print shadow-xs">
          <span>
            Bạn đang xem sơ đồ lớp <strong>{currentClass?.name}</strong> với vai trò <strong>Giáo viên Bộ môn ({teacherSubjects.map((s) => s.name).join(', ')})</strong>.
          </span>
          <span className="px-3 py-1 rounded-lg bg-indigo-500/15 font-semibold text-[12px] text-indigo-700">Chế độ tra cứu</span>
        </div>
      )}

      {/* Notice / Action bar when seat is selected */}
      {selectedSeatId && (
        <div className="p-4 bg-accent/10 border border-accent/30 rounded-2xl flex items-center justify-between text-[14px] text-accent shadow-xs no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0 animate-pulse shadow-xs">
              <ArrowsLeftRight size={18} weight="bold" />
            </div>
            <div>
              <span className="font-bold text-text-primary text-[15px]">
                Đang chọn: {selectedStudent ? selectedStudent.full_name : 'Ghế trống'}
              </span>
              <span className="text-text-secondary ml-2 hidden sm:inline text-[13px]">
                (Nhấp vào ghế thứ hai trên sơ đồ để hoán đổi chỗ, hoặc chọn học sinh bên dưới để xếp chỗ)
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

      {/* Main Grid: Spatial Classroom Layout */}
      <div className="bg-surface rounded-3xl border border-border p-6 sm:p-9 shadow-sm space-y-8 printable-card">
        {/* Blackboard & Podium Area */}
        <div className="w-full max-w-2xl mx-auto py-3.5 bg-slate-800 text-slate-100 rounded-2xl text-center shadow-md border-2 border-slate-700">
          <div className="text-[13px] font-bold tracking-widest uppercase text-slate-100 flex items-center justify-center gap-2">
            <span>BỤC GIẢNG & BẢNG VIẾT PHẤN</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-normal">(HƯỚNG NHÌN GIÁO VIÊN)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono font-medium">
            Dãy 1 ← Dãy 2 ← Dãy 3 → Dãy 4 → Dãy 5
          </div>
        </div>

        {/* Classroom 5x5 Desk Grid */}
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((rowNum) => {
            const rowDesks = desks.filter((d) => d.row_num === rowNum);
            rowDesks.sort((a, b) => a.col_num - b.col_num);

            return (
              <div key={`row-${rowNum}`} className="space-y-2">
                <div className="text-[12px] font-mono font-bold text-text-muted text-center tracking-wider">
                  HÀNG {rowNum}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {rowDesks.map((desk) => {
                    const seatL = desk.seats[0];
                    const seatR = desk.seats[1];

                    return (
                      <div
                        key={desk.id}
                        className="bg-surface-muted/40 border-2 border-border/90 rounded-2xl p-3 flex flex-col justify-between hover:border-accent hover:shadow-sm transition-all"
                      >
                        {/* Desk Header */}
                        <div className="flex items-center justify-between text-xs font-mono text-text-muted pb-2 border-b border-border/70">
                          <span className="font-bold text-text-primary text-[13px]">Bàn {desk.desk_number.toString().padStart(2, '0')}</span>
                          <span className="text-[11px] font-medium bg-surface px-2 py-0.5 rounded border border-border/60">Dãy {desk.col_num}</span>
                        </div>

                        {/* 2 Seats per Desk (Left & Right) */}
                        <div className="grid grid-cols-2 gap-2 pt-2.5">
                          {/* Left Seat */}
                          <div
                            onClick={() => handleSeatClick(seatL)}
                            className={`p-2.5 rounded-xl border-2 text-xs cursor-pointer transition-all relative group/seat min-h-[76px] flex flex-col justify-between ${
                              selectedSeatId === seatL.id
                                ? 'bg-accent/15 border-accent ring-4 ring-accent/25'
                                : seatL.student
                                ? 'bg-surface border-border hover:border-accent shadow-2xs'
                                : 'bg-surface/60 border-dashed border-border/80 hover:bg-surface hover:border-border-strong'
                            }`}
                          >
                            {seatL.student ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono text-text-muted font-medium">
                                    {seatL.student.student_code}
                                  </span>
                                  {seatL.student.gender === 'male' ? (
                                    <GenderMale size={13} weight="bold" className="text-blue-500" />
                                  ) : (
                                    <GenderFemale size={13} weight="bold" className="text-rose-500" />
                                  )}
                                </div>
                                <div className="font-bold text-text-primary truncate text-[13px]" title={seatL.student.full_name}>
                                  {seatL.student.full_name.split(' ').slice(-1)[0]}
                                </div>
                                <div className="text-[11px] text-text-muted truncate">
                                  {seatL.student.full_name.split(' ').slice(0, -1).join(' ')}
                                </div>
                                {isHomeroom && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleRemoveFromSeat(e, seatL.id)}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover/seat:opacity-100 transition-opacity shadow-sm"
                                    title="Gỡ khỏi ghế"
                                  >
                                    <X size={12} weight="bold" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="py-4 text-center text-text-muted text-[12px] font-medium italic">
                                + Trống (T)
                              </div>
                            )}
                          </div>

                          {/* Right Seat */}
                          <div
                            onClick={() => handleSeatClick(seatR)}
                            className={`p-2.5 rounded-xl border-2 text-xs cursor-pointer transition-all relative group/seat min-h-[76px] flex flex-col justify-between ${
                              selectedSeatId === seatR.id
                                ? 'bg-accent/15 border-accent ring-4 ring-accent/25'
                                : seatR.student
                                ? 'bg-surface border-border hover:border-accent shadow-2xs'
                                : 'bg-surface/60 border-dashed border-border/80 hover:bg-surface hover:border-border-strong'
                            }`}
                          >
                            {seatR.student ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono text-text-muted font-medium">
                                    {seatR.student.student_code}
                                  </span>
                                  {seatR.student.gender === 'male' ? (
                                    <GenderMale size={13} weight="bold" className="text-blue-500" />
                                  ) : (
                                    <GenderFemale size={13} weight="bold" className="text-rose-500" />
                                  )}
                                </div>
                                <div className="font-bold text-text-primary truncate text-[13px]" title={seatR.student.full_name}>
                                  {seatR.student.full_name.split(' ').slice(-1)[0]}
                                </div>
                                <div className="text-[11px] text-text-muted truncate">
                                  {seatR.student.full_name.split(' ').slice(0, -1).join(' ')}
                                </div>
                                {isHomeroom && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleRemoveFromSeat(e, seatR.id)}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover/seat:opacity-100 transition-opacity shadow-sm"
                                    title="Gỡ khỏi ghế"
                                  >
                                    <X size={12} weight="bold" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="py-4 text-center text-text-muted text-[12px] font-medium italic">
                                + Trống (P)
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

        {/* Bottom Classroom Door / Windows Notice */}
        <div className="flex items-center justify-between text-[13px] text-text-muted pt-5 border-t border-border">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-accent" />
            <span>Mẹo: Nhấp vào 2 ghế bất kỳ để hoán đổi chỗ ngồi ngay lập tức.</span>
          </div>
          <div className="font-semibold text-text-secondary">Cửa ra vào lớp học (Phía cuối)</div>
        </div>
      </div>

      {/* Unseated Students Section (if any) */}
      <div className="bg-surface rounded-2xl border border-border p-6 sm:p-7 space-y-4 no-print shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <UserPlus size={22} className="text-accent" weight="duotone" />
            <h2 className="text-lg font-bold text-text-primary">
              Học sinh chưa xếp chỗ ({unseatedStudents.length})
            </h2>
          </div>
          {unseatedStudents.length > 0 && isHomeroom && (
            <span className="text-[13px] text-text-muted">
              Nhấp vào học sinh để xếp nhanh vào ghế trống đầu tiên hoặc ghế đang chọn
            </span>
          )}
        </div>

        {unseatedStudents.length === 0 ? (
          <p className="text-[14px] text-text-muted py-2 font-medium">
            Tất cả {students.length} học sinh trong lớp đều đã được xếp chỗ ngồi đầy đủ.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5 pt-2">
            {unseatedStudents.map((student) => (
              <button
                key={student.id}
                type="button"
                disabled={!isHomeroom}
                onClick={() => isHomeroom && handleAssignUnseated(student.id)}
                className={`px-4 py-2 rounded-xl border border-border bg-surface-muted/60 text-[14px] font-semibold text-text-primary flex items-center gap-2.5 transition-all shadow-2xs ${
                  isHomeroom ? 'hover:bg-accent/10 hover:border-accent hover:text-accent cursor-pointer' : 'cursor-default'
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
