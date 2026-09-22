'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  FloppyDisk,
  Check,
  Calendar,
  WarningCircle,
  ChatText,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { StudentRow, AttendanceStatus, SubjectRow } from '@/types';
import { Button } from '@/components/ui/button';
import { formatDateVietnamese } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentClass } from '@/contexts/class-context';
import { BookOpen } from '@phosphor-icons/react';

interface StudentAttendanceState {
  student_id: string;
  student_code: string;
  full_name: string;
  status: AttendanceStatus;
  note: string;
}

export default function AttendancePage() {
  const { currentClassId, currentClass, isHomeroom, isSubjectTeacher, teacherSubjects } = useCurrentClass();
  const { user } = useAuth();
  const [allSubjects, setAllSubjects] = useState<SubjectRow[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceData, setAttendanceData] = useState<Record<string, StudentAttendanceState>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setAllSubjects(LocalStore.getSubjects());
  }, []);

  useEffect(() => {
    if (isSubjectTeacher && teacherSubjects.length > 0) {
      setSelectedSubjectId(teacherSubjects[0].id);
    } else if (isHomeroom) {
      setSelectedSubjectId('');
    }
  }, [currentClassId, isSubjectTeacher, isHomeroom, teacherSubjects]);

  // Load students & existing attendance for selected date and subject
  const loadData = () => {
    if (!currentClassId) return;
    const stus = LocalStore.getStudents(currentClassId).filter((s) => s.status === 'active');
    setStudents(stus);

    const existingRecords = LocalStore.getAttendanceForDate(
      selectedDate,
      currentClassId,
      selectedSubjectId || undefined
    );
    const existingMap = new Map(existingRecords.map((r) => [r.student_id, r]));

    const stateMap: Record<string, StudentAttendanceState> = {};
    stus.forEach((s) => {
      const existing = existingMap.get(s.id);
      stateMap[s.id] = {
        student_id: s.id,
        student_code: s.student_code,
        full_name: s.full_name,
        status: (existing?.status as AttendanceStatus) || 'present',
        note: existing?.note || '',
      };
    });

    setAttendanceData(stateMap);
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, currentClassId, selectedSubjectId]);

  // Set status for one student
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  // Set note for one student
  const handleSetNote = (studentId: string, note: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  // Mark all present button (Teacher super power)
  const handleMarkAllPresent = () => {
    setAttendanceData((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = { ...updated[id], status: 'present' };
      });
      return updated;
    });
    toast.success('Đã đánh dấu toàn bộ học sinh có mặt');
  };

  // Save attendance batch
  const handleSave = () => {
    const entries = Object.values(attendanceData).map((item) => ({
      student_id: item.student_id,
      status: item.status,
      note: item.note,
    }));

    LocalStore.saveAttendanceBatch(
      selectedDate,
      entries,
      currentClassId || undefined,
      selectedSubjectId || undefined,
      user?.id
    );
    const subName = allSubjects.find((s) => s.id === selectedSubjectId)?.name;
    const scopeLabel = subName ? `tiết môn ${subName}` : 'buổi học';
    toast.success(`Đã lưu điểm danh ${scopeLabel} ngày ${formatDateVietnamese(selectedDate)}`);
  };

  // Metrics
  const list = Object.values(attendanceData);
  const total = list.length;
  const presentCount = list.filter((i) => i.status === 'present').length;
  const absentCount = list.filter((i) => i.status === 'absent').length;
  const lateCount = list.filter((i) => i.status === 'late').length;
  const excusedCount = list.filter((i) => i.status === 'excused').length;
  const presentRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  if (!isLoaded) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 bg-surface-muted rounded animate-pulse" />
        <div className="h-80 bg-surface-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const currentSubjectObj = allSubjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Điểm danh {currentSubjectObj ? `tiết ${currentSubjectObj.name}` : 'buổi học'}
            </h1>
            {isSubjectTeacher ? (
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded-full border border-amber-500/30">
                GVBM: {teacherSubjects.map((s) => s.name).join(', ')}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-accent-subtle text-accent rounded-full border border-accent/30">
                GVCN
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted mt-1">
            Ghi nhận chuyên cần học sinh lớp {currentClass?.name || 'lớp học'} {currentSubjectObj ? `cho tiết học môn ${currentSubjectObj.name}` : 'toàn buổi'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Subject Selector */}
          {isSubjectTeacher ? (
            <div className="flex items-center gap-1.5 bg-surface border border-border px-3 py-1.5 rounded-lg text-xs font-medium text-text-primary">
              <BookOpen size={15} className="text-accent" />
              <span>Môn {teacherSubjects.map((s) => s.name).join(', ')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-surface border border-border px-2.5 py-1.5 rounded-lg text-xs">
              <BookOpen size={15} className="text-accent" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-text-primary focus:outline-none text-xs font-medium"
              >
                <option value="">Điểm danh chung (Đầu giờ / GVCN)</option>
                {allSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    Tiết {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-lg text-sm">
            <Calendar size={16} className="text-text-muted" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-text-primary focus:outline-none text-xs font-mono"
            />
          </div>

          <Button variant="secondary" onClick={handleMarkAllPresent}>
            <CheckCircle size={16} />
            <span>Tất cả có mặt</span>
          </Button>

          <Button variant="primary" onClick={handleSave}>
            <FloppyDisk size={16} />
            <span>Lưu điểm danh</span>
          </Button>
        </div>
      </div>

      {/* Real-time Summary Card */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-surface rounded-xl border border-border p-4">
          <span className="text-xs text-text-muted">Tổng sĩ số</span>
          <div className="text-xl font-semibold text-text-primary mt-1">{total}</div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-success font-medium">Có mặt</span>
            <span className="text-xs text-success font-semibold">{presentRate}%</span>
          </div>
          <div className="text-xl font-semibold text-success mt-1">{presentCount}</div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4">
          <span className="text-xs text-danger font-medium">Vắng mặt</span>
          <div className="text-xl font-semibold text-danger mt-1">{absentCount}</div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4">
          <span className="text-xs text-warning font-medium">Đi muộn</span>
          <div className="text-xl font-semibold text-warning mt-1">{lateCount}</div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4">
          <span className="text-xs text-text-secondary font-medium">Có phép</span>
          <div className="text-xl font-semibold text-text-secondary mt-1">{excusedCount}</div>
        </div>
      </div>

      {/* Attendance Student List Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-subtle text-xs text-text-muted uppercase border-b border-border tracking-wider">
              <tr>
                <th className="px-4 py-3 w-12 text-center">STT</th>
                <th className="px-4 py-3 w-24">Mã HS</th>
                <th className="px-4 py-3 w-56">Họ và tên</th>
                <th className="px-4 py-3 w-80 text-center">Trạng thái điểm danh</th>
                <th className="px-4 py-3">Ghi chú / Lý do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((item, index) => (
                <tr
                  key={item.student_id}
                  className={`hover:bg-surface-subtle/50 transition-colors ${
                    item.status === 'absent'
                      ? 'bg-danger-subtle/15'
                      : item.status === 'late'
                      ? 'bg-warning-subtle/15'
                      : ''
                  }`}
                >
                  <td className="px-4 py-3 text-center text-text-muted font-mono text-xs">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {item.student_code}
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {item.full_name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Present Button */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(item.student_id, 'present')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          item.status === 'present'
                            ? 'bg-success text-white shadow-2xs'
                            : 'bg-surface border border-border text-text-secondary hover:bg-success-subtle hover:text-success'
                        }`}
                      >
                        Có mặt
                      </button>

                      {/* Absent Button */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(item.student_id, 'absent')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          item.status === 'absent'
                            ? 'bg-danger text-white shadow-2xs'
                            : 'bg-surface border border-border text-text-secondary hover:bg-danger-subtle hover:text-danger'
                        }`}
                      >
                        Vắng
                      </button>

                      {/* Late Button */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(item.student_id, 'late')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          item.status === 'late'
                            ? 'bg-warning text-white shadow-2xs'
                            : 'bg-surface border border-border text-text-secondary hover:bg-warning-subtle hover:text-warning'
                        }`}
                      >
                        Muộn
                      </button>

                      {/* Excused Button */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(item.student_id, 'excused')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          item.status === 'excused'
                            ? 'bg-zinc-700 text-white shadow-2xs'
                            : 'bg-surface border border-border text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                        }`}
                      >
                        Phép
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => handleSetNote(item.student_id, e.target.value)}
                      placeholder={
                        item.status === 'absent'
                          ? 'Nhập lý do nghỉ...'
                          : item.status === 'late'
                          ? 'Số phút muộn, lý do...'
                          : 'Ghi chú thêm...'
                      }
                      className="w-full text-xs px-2.5 py-1.5 bg-surface rounded-md border border-border focus:outline-none focus:border-accent text-text-primary placeholder:text-text-muted"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer save reminder */}
        <div className="px-6 py-4 bg-surface-subtle border-t border-border flex items-center justify-between">
          <span className="text-xs text-text-muted">
            Đừng quên bấm nút <strong>Lưu điểm danh</strong> sau khi hoàn thành.
          </span>
          <Button variant="primary" onClick={handleSave}>
            <FloppyDisk size={16} />
            <span>Lưu điểm danh</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
