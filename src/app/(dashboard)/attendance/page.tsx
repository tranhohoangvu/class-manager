'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  FloppyDisk,
  Check,
  X,
  ClipboardText,
  Calendar,
  WarningCircle,
  ChatText,
  BookOpen,
  Copy,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { AttendanceService, StudentService } from '@/services';
import { StudentRow, AttendanceStatus, SubjectRow } from '@/types';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/ui/badge';
import { formatDateVietnamese, getTodayISO } from '@/lib/utils';
import { EmptyStateView } from '@/components/ui/state-views';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentClass } from '@/contexts/class-context';

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
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [attendanceData, setAttendanceData] = useState<Record<string, StudentAttendanceState>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_present' | 'present' | 'absent' | 'late' | 'excused'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    const stus = StudentService.getStudents(currentClassId).filter((s) => s.status === 'active');
    setStudents(stus);

    const existingRecords = AttendanceService.getAttendanceForDate(
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

    const res = AttendanceService.saveAttendanceBatch(
      selectedDate,
      entries,
      currentClassId || '',
      selectedSubjectId || undefined,
      user
    );

    if (!res.success) {
      toast.error(res.error || 'Lưu điểm danh thất bại');
      return;
    }

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
  const notPresentCount = total - presentCount;
  const presentRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  // Filtered student list for quick review
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      let matchStatus = true;
      if (statusFilter === 'not_present') {
        matchStatus = item.status !== 'present';
      } else if (statusFilter !== 'all') {
        matchStatus = item.status === statusFilter;
      }

      const matchSearch =
        searchQuery.trim() === '' ||
        item.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student_code.toLowerCase().includes(searchQuery.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [list, statusFilter, searchQuery]);

  const handleCopyReport = () => {
    const absents = list.filter((i) => i.status === 'absent');
    const lates = list.filter((i) => i.status === 'late');
    const excuseds = list.filter((i) => i.status === 'excused');

    const absentListStr = absents.length > 0
      ? absents.map((i) => `${i.full_name}${i.note ? ` (${i.note})` : ''}`).join(', ')
      : 'Không có';

    const excusedListStr = excuseds.length > 0
      ? excuseds.map((i) => `${i.full_name}${i.note ? ` (${i.note})` : ''}`).join(', ')
      : 'Không có';

    const lateListStr = lates.length > 0
      ? lates.map((i) => `${i.full_name}${i.note ? ` (${i.note})` : ''}`).join(', ')
      : 'Không có';

    const reportText = `[BÁO CÁO CHUYÊN CẦN ${selectedSubjectId ? `MÔN ${currentSubjectObj?.name?.toUpperCase()}` : 'ĐẦU GIỜ'}]
Trường THCS Nguyễn Tất Thành
Lớp: ${currentClass?.name || '---'} · Ngày: ${formatDateVietnamese(selectedDate)}
Sĩ số: ${total} học sinh
- Có mặt: ${presentCount}/${total} (${presentRate}%)
- Vắng không phép (${absents.length}): ${absentListStr}
- Vắng có phép (${excuseds.length}): ${excusedListStr}
- Đi muộn (${lates.length}): ${lateListStr}
Người báo cáo: ${user?.name || 'GVCN'}`;

    navigator.clipboard.writeText(reportText);
    toast.success('Đã sao chép báo cáo chuyên cần gửi BGH vào clipboard!');
  };

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
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Điểm danh {currentSubjectObj ? `tiết ${currentSubjectObj.name}` : 'buổi học'}
            </h1>
            {isSubjectTeacher ? (
              <RoleBadge
                role="SUBJECT"
                label={`GVBM: ${teacherSubjects.map((s) => s.name).join(', ')}`}
                size="md"
              />
            ) : (
              <RoleBadge role="HOMEROOM" label="GVCN" size="md" />
            )}
          </div>
          <p className="text-[15px] text-text-secondary mt-2 font-medium">
            Ghi nhận chuyên cần học sinh {currentClass?.name || 'lớp học'} {currentSubjectObj ? `cho tiết học môn ${currentSubjectObj.name}` : 'toàn buổi học'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Subject Selector */}
          {isSubjectTeacher ? (
            <div className="flex items-center gap-2 bg-surface border border-border px-4 py-2.5 rounded-xl text-[14px] font-semibold text-text-primary shadow-2xs">
              <BookOpen size={18} className="text-accent" />
              <span>Môn {teacherSubjects.map((s) => s.name).join(', ')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-surface border border-border px-3.5 py-2 rounded-xl text-[14px] shadow-2xs">
              <BookOpen size={18} className="text-accent flex-shrink-0" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-text-primary focus:outline-none text-[14px] font-semibold cursor-pointer"
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
          <div className="flex items-center gap-2.5 bg-surface border border-border px-4 py-2 rounded-xl text-sm shadow-2xs">
            <Calendar size={18} className="text-text-muted" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-text-primary focus:outline-none text-[14px] font-mono font-semibold cursor-pointer"
            />
          </div>

          <Button variant="secondary" size="md" onClick={handleMarkAllPresent}>
            <CheckCircle size={18} weight="bold" />
            <span>Tất cả có mặt</span>
          </Button>

          <Button variant="primary" size="md" onClick={handleSave}>
            <FloppyDisk size={18} weight="bold" />
            <span>Lưu điểm danh</span>
          </Button>
        </div>
      </div>

      {/* Real-time Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs">
          <span className="text-[13px] font-bold text-text-muted uppercase tracking-wider">Tổng sĩ số</span>
          <div className="text-2xl sm:text-3xl font-bold text-text-primary mt-1.5">{total}</div>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-success uppercase tracking-wider">Có mặt</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700">{presentRate}%</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-success mt-1.5">{presentCount}</div>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs">
          <span className="text-[13px] font-bold text-danger uppercase tracking-wider">Vắng mặt</span>
          <div className="text-2xl sm:text-3xl font-bold text-danger mt-1.5">{absentCount}</div>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs">
          <span className="text-[13px] font-bold text-warning uppercase tracking-wider">Đi muộn</span>
          <div className="text-2xl sm:text-3xl font-bold text-warning mt-1.5">{lateCount}</div>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs">
          <span className="text-[13px] font-bold text-text-secondary uppercase tracking-wider">Có phép</span>
          <div className="text-2xl sm:text-3xl font-bold text-text-primary mt-1.5">{excusedCount}</div>
        </div>
      </div>

      {/* Quick Filter Tabs & Search & Copy Report Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-text-primary text-surface shadow-xs font-bold'
                : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border'
            }`}
          >
            Tất cả ({total})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('not_present')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'not_present'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : notPresentCount > 0
                ? 'bg-rose-50 hover:bg-rose-100/80 text-rose-800 border border-rose-200'
                : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border'
            }`}
            title="Lọc nhanh các học sinh vắng hoặc đi muộn"
          >
            <span>Chưa có mặt</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                statusFilter === 'not_present'
                  ? 'bg-white/20 text-white'
                  : notPresentCount > 0
                  ? 'bg-rose-200 text-rose-900'
                  : 'bg-surface-muted text-text-muted'
              }`}
            >
              {notPresentCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('present')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'present'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border'
            }`}
          >
            Có mặt ({presentCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('absent')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'absent'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border'
            }`}
          >
            Vắng ({absentCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('late')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'late'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border'
            }`}
          >
            Muộn ({lateCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('excused')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'excused'
                ? 'bg-slate-700 text-white shadow-xs font-bold'
                : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border'
            }`}
          >
            Có phép ({excusedCount})
          </button>
        </div>

        {/* Right Search & Copy Report Button */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Tìm học sinh, mã HS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-[38px] text-xs bg-surface rounded-xl border border-border focus:outline-none focus:border-accent shadow-2xs placeholder:text-text-muted"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyReport}
            className="gap-1.5 text-xs whitespace-nowrap flex-shrink-0"
            title="Sao chép báo cáo chuyên cần gửi Ban Giám hiệu"
          >
            <Copy size={15} weight="bold" className="text-accent" />
            <span>Sao chép báo cáo BGH</span>
          </Button>
        </div>
      </div>

      {/* Attendance Student List Table */}
      <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted/60 text-xs font-semibold text-text-secondary uppercase border-b border-border tracking-wider">
              <tr>
                <th className="px-5 py-4 w-14 text-center">STT</th>
                <th className="px-5 py-4 w-28">Mã HS</th>
                <th className="px-5 py-4 min-w-[220px]">Họ và tên học sinh</th>
                <th className="px-5 py-4 w-[380px] text-center">Trạng thái điểm danh</th>
                <th className="px-5 py-4">Ghi chú / Lý do vắng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted text-sm">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => (
                <tr
                  key={item.student_id}
                  className={`hover:bg-surface-muted/40 transition-colors ${
                    item.status === 'absent'
                      ? 'bg-rose-500/5'
                      : item.status === 'late'
                      ? 'bg-amber-500/5'
                      : ''
                  }`}
                >
                  <td className="px-5 py-4 text-center text-text-muted font-mono text-[13px] font-semibold">
                    {(index + 1).toString().padStart(2, '0')}
                  </td>
                  <td className="px-5 py-4 font-mono text-[13px] text-text-secondary font-medium">
                    {item.student_code}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center flex-shrink-0 border border-accent/20">
                        {item.full_name.charAt(0)}
                      </div>
                      <span className="font-bold text-text-primary text-[15px]">
                        {item.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 p-1 bg-surface-muted/60 rounded-xl border border-border/80 shadow-2xs">
                      {/* Present Button */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(item.student_id, 'present')}
                        className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                          item.status === 'present'
                            ? 'bg-emerald-600 text-white shadow-xs font-bold'
                            : 'text-emerald-700 hover:bg-emerald-500/10'
                        }`}
                      >
                        <Check size={14} weight="bold" />
                        <span>Có mặt</span>
                      </button>

                      {/* Absent Button */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(item.student_id, 'absent')}
                        className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                          item.status === 'absent'
                            ? 'bg-rose-600 text-white shadow-xs font-bold'
                            : 'text-rose-700 hover:bg-rose-500/10'
                        }`}
                      >
                        <X size={14} weight="bold" />
                        <span>Vắng</span>
                      </button>

                      {/* Late Button */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(item.student_id, 'late')}
                        className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                          item.status === 'late'
                            ? 'bg-amber-600 text-white shadow-xs font-bold'
                            : 'text-amber-700 hover:bg-amber-500/10'
                        }`}
                      >
                        <Clock size={14} weight="bold" />
                        <span>Muộn</span>
                      </button>

                      {/* Excused Button */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(item.student_id, 'excused')}
                        className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                          item.status === 'excused'
                            ? 'bg-slate-800 text-white shadow-xs font-bold'
                            : 'text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <ClipboardText size={14} weight="bold" />
                        <span>Phép</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => handleSetNote(item.student_id, e.target.value)}
                      placeholder={
                        item.status === 'absent'
                          ? 'Nhập lý do nghỉ học...'
                          : item.status === 'late'
                          ? 'Số phút đi muộn, lý do...'
                          : 'Ghi chú thêm...'
                      }
                      className="w-full h-10 text-[13px] px-3.5 bg-surface rounded-xl border border-border focus:outline-none focus:border-accent text-text-primary placeholder:text-text-muted shadow-2xs"
                    />
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Footer save bar */}
        <div className="px-8 py-5 bg-surface-muted/40 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-text-secondary font-medium">
            <span>Sĩ số: <strong className="text-text-primary font-bold">{total}</strong> học sinh</span>
            <span>·</span>
            <span className="text-emerald-700 font-bold">{presentCount} có mặt</span>
            <span>·</span>
            <span className="text-rose-700 font-bold">{absentCount} vắng</span>
            <span>·</span>
            <span className="text-amber-700 font-bold">{lateCount} muộn</span>
          </div>
          <Button variant="primary" size="lg" onClick={handleSave} className="shadow-sm">
            <FloppyDisk size={20} weight="bold" />
            <span>Lưu kết quả điểm danh</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
