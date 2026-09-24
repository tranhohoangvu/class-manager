'use client';

import React from 'react';
import { SchoolSettings } from '@/types';
import { LocalStore } from '@/lib/store';

interface PrintHeaderProps {
  settings?: SchoolSettings;
  title: string;
  subtitle?: string;
  classNameTitle?: string;
  rightMeta?: React.ReactNode;
  metaLines?: React.ReactNode[];
}

export function PrintHeader({
  settings: propSettings,
  title,
  subtitle,
  classNameTitle,
  rightMeta,
  metaLines = [],
}: PrintHeaderProps) {
  const settings = propSettings || LocalStore.getSchoolSettings();

  return (
    <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4 text-black">
      {/* Left Organization Info */}
      <div className="text-left space-y-0.5">
        <p className="text-[10pt] font-semibold uppercase tracking-wider text-black">
          {settings.departmentName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}
        </p>
        {settings.divisionName && (
          <p className="text-[9pt] font-medium uppercase text-gray-800">
            {settings.divisionName}
          </p>
        )}
        <p className="text-[11.5pt] font-black uppercase tracking-tight text-black">
          {settings.schoolName || 'TRƯỜNG THCS NGUYỄN TẤT THÀNH'}
        </p>
        <p className="text-[8.5pt] italic text-gray-700 pt-0.5">
          {settings.address ? `Địa chỉ: ${settings.address}` : ''}
          {settings.address && settings.phone ? ' · ' : ''}
          {settings.phone ? `Hotline: ${settings.phone}` : ''}
        </p>
      </div>

      {/* Right Document Title & Metadata */}
      <div className="text-right space-y-0.5">
        <h2 className="text-[14pt] font-black tracking-tight uppercase text-black">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[9.5pt] font-medium text-gray-800">
            {subtitle}
          </p>
        )}
        <p className="text-[9.5pt] font-medium text-gray-800">
          Năm học {settings.schoolYear} · {settings.semester}
        </p>
        {classNameTitle && (
          <p className="text-[9.5pt] font-bold text-black uppercase">
            {classNameTitle}
          </p>
        )}
        {rightMeta && (
          <div className="text-[8.5pt] text-gray-700 pt-0.5">
            {rightMeta}
          </div>
        )}
        {metaLines.map((line, idx) => (
          <p key={idx} className="text-[8.5pt] text-gray-700">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

interface PrintSignaturesProps {
  settings?: SchoolSettings;
  creatorRoleTitle?: string;
  creatorName?: string;
  principalTitle?: string;
  homeroomTitle?: string;
  homeroomTeacherName?: string;
  customDate?: Date;
}

export function PrintSignatures({
  settings: propSettings,
  creatorRoleTitle,
  creatorName,
  principalTitle,
  homeroomTitle,
  homeroomTeacherName,
  customDate = new Date(),
}: PrintSignaturesProps) {
  const settings = propSettings || LocalStore.getSchoolSettings();

  const effectivePrincipalTitle = principalTitle || 'BAN GIÁM HIỆU PHÊ DUYỆT';
  const effectiveCreatorRoleTitle = creatorRoleTitle || homeroomTitle || 'GIÁO VIÊN CHỦ NHIỆM';
  const effectiveCreatorName = creatorName || homeroomTeacherName || '—';

  const day = String(customDate.getDate()).padStart(2, '0');
  const month = String(customDate.getMonth() + 1).padStart(2, '0');
  const year = customDate.getFullYear();
  const locationDateStr = `${settings.province || 'Hà Nội'}, ngày ${day} tháng ${month} năm ${year}`;

  return (
    <div className="grid grid-cols-2 gap-8 mt-6 pt-4 text-center text-black border-t border-black/40">
      {/* Principal / BGH Approval */}
      <div>
        <p className="font-bold uppercase text-[9.5pt]">{effectivePrincipalTitle}</p>
        <p className="text-[8pt] italic text-gray-600 mt-0.5">(Ký và đóng dấu)</p>
        <div className="h-16" />
        <p className="font-bold text-[9.5pt] uppercase">
          {settings.principalName || 'TS. Lê Thị Quỳnh Mai'}
        </p>
      </div>

      {/* Creator / Homeroom Signature */}
      <div>
        <p className="text-[8.5pt] italic text-gray-700 mb-0.5">
          {locationDateStr}
        </p>
        <p className="font-bold uppercase text-[9.5pt]">
          {effectiveCreatorRoleTitle}
        </p>
        <p className="text-[8pt] italic text-gray-600 mt-0.5">(Ký và ghi rõ họ tên)</p>
        <div className="h-16" />
        <p className="font-bold text-[9.5pt] uppercase">
          {effectiveCreatorName}
        </p>
      </div>
    </div>
  );
}
