'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ClassRow, ClassMembershipRole, SubjectRow } from '@/types';
import { useAuth } from './auth-context';
import { AuthService } from '@/lib/auth';
import { LocalStore } from '@/lib/store';

export interface AssignedClassWithRole {
  classInfo: ClassRow;
  isHomeroom: boolean;
  role: ClassMembershipRole | 'ADMIN';
  roleLabel: string; // e.g. "GVCN · Toán", "GVBM · Ngữ văn", "GVCN", "Admin"
  subjects: SubjectRow[];
}

interface ClassContextType {
  currentClassId: string | null;
  currentClass: ClassRow | null;
  assignedClasses: ClassRow[];
  assignedClassesWithRoles: AssignedClassWithRole[];
  classRole: ClassMembershipRole | 'ADMIN' | null;
  isHomeroom: boolean;
  isSubjectTeacher: boolean;
  teacherSubjects: SubjectRow[];
  isLoading: boolean;
  switchClass: (classId: string) => void;
  refreshClasses: () => void;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

const ACTIVE_CLASS_STORAGE_KEY = 'cm_active_class_id';

export function ClassProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [assignedClasses, setAssignedClasses] = useState<ClassRow[]>([]);
  const [currentClassId, setCurrentClassId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshClasses = useCallback(() => {
    if (!user) {
      setAssignedClasses([]);
      setCurrentClassId(null);
      setIsLoading(false);
      return;
    }

    const classes = AuthService.getAssignedClassesForUser(user);
    setAssignedClasses(classes);

    if (classes.length === 0) {
      setCurrentClassId(null);
      setIsLoading(false);
      return;
    }

    // Check previously selected class from localStorage
    const savedClassId =
      typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_CLASS_STORAGE_KEY) : null;

    if (savedClassId && classes.some((c) => c.id === savedClassId)) {
      setCurrentClassId(savedClassId);
    } else {
      // Fallback to first assigned class
      setCurrentClassId(classes[0].id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACTIVE_CLASS_STORAGE_KEY, classes[0].id);
      }
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!isAuthLoading) {
      refreshClasses();
    }
  }, [isAuthLoading, refreshClasses]);

  const switchClass = (classId: string) => {
    const target = assignedClasses.find((c) => c.id === classId);
    if (target) {
      setCurrentClassId(classId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACTIVE_CLASS_STORAGE_KEY, classId);
      }
    }
  };

  const currentClass = currentClassId ? LocalStore.getClassById(currentClassId) : null;

  // Compute rich roles and subjects for the current class
  const classInfo = useMemo(() => {
    if (!user || !currentClassId) {
      return { role: null, isHomeroom: false, subjects: [] };
    }
    return AuthService.getTeacherClassInfo(user, currentClassId);
  }, [user, currentClassId]);

  // Compute full list of assigned classes with role labels for switcher dropdown
  const assignedClassesWithRoles = useMemo<AssignedClassWithRole[]>(() => {
    if (!user) return [];
    return assignedClasses.map((cls) => {
      const info = AuthService.getTeacherClassInfo(user, cls.id);
      let roleLabel = 'Giáo viên';
      if (info.role === 'ADMIN') {
        roleLabel = 'Quản trị viên';
      } else if (info.isHomeroom) {
        if (info.subjects.length > 0) {
          roleLabel = `GVCN · ${info.subjects.map((s) => s.name).join(', ')}`;
        } else {
          roleLabel = 'GVCN';
        }
      } else if (info.subjects.length > 0) {
        roleLabel = `GVBM · ${info.subjects.map((s) => s.name).join(', ')}`;
      } else {
        roleLabel = 'GVBM';
      }

      return {
        classInfo: cls,
        isHomeroom: info.isHomeroom,
        role: info.role || 'SUBJECT_TEACHER',
        roleLabel,
        subjects: info.subjects,
      };
    });
  }, [user, assignedClasses]);

  const isHomeroom = classInfo.isHomeroom || user?.role === 'ADMIN';
  const isSubjectTeacher = !isHomeroom && classInfo.role === 'SUBJECT_TEACHER';

  return (
    <ClassContext.Provider
      value={{
        currentClassId,
        currentClass,
        assignedClasses,
        assignedClassesWithRoles,
        classRole: classInfo.role,
        isHomeroom,
        isSubjectTeacher,
        teacherSubjects: classInfo.subjects,
        isLoading: isAuthLoading || isLoading,
        switchClass,
        refreshClasses,
      }}
    >
      {children}
    </ClassContext.Provider>
  );
}

export function useCurrentClass(): ClassContextType {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error('useCurrentClass must be used within a ClassProvider');
  }
  return context;
}
