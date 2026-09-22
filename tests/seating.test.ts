import { describe, it, expect } from 'vitest';
import { SeatingService } from '@/services/seating.service';
import { shuffleArray } from '@/lib/utils';
import { UserRow } from '@/types';

describe('Seating System & Invariants Tests', () => {
  const mockAdmin: UserRow = {
    id: 'u-admin-01',
    name: 'Admin',
    email: 'admin@school.edu.vn',
    phone: null,
    role: 'ADMIN',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('Fisher-Yates shuffle should preserve all elements without duplicates', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = shuffleArray(input);

    expect(shuffled).toHaveLength(input.length);
    expect(new Set(shuffled).size).toBe(input.length);
    expect(shuffled.sort()).toEqual(input.sort());
  });

  it('Seating layout should contain 25 desks and 50 seats per class', () => {
    const desks = SeatingService.getDesks('c-6a1');
    expect(desks).toHaveLength(25);

    let totalSeats = 0;
    desks.forEach((d) => {
      expect(d.seats).toHaveLength(2);
      totalSeats += d.seats.length;
    });

    expect(totalSeats).toBe(50);
  });

  it('Rejects unauthorized users from modifying seating chart', () => {
    const mockGVBM: UserRow = {
      id: 'u-gv-24',
      name: 'GVBM',
      email: 'gvbm@school.edu.vn',
      phone: null,
      role: 'TEACHER',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const res = SeatingService.randomizeSeating('c-6a1', mockGVBM);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Chỉ Giáo viên Chủ nhiệm hoặc Quản trị viên');
  });

  it('Admin can successfully randomize seating and preserve 30 seated students', () => {
    const res = SeatingService.randomizeSeating('c-6a1', mockAdmin);
    expect(res.success).toBe(true);

    const desks = res.data!;
    const seatedIds = new Set<string>();
    let seatedCount = 0;

    desks.forEach((d) => {
      d.seats.forEach((s) => {
        if (s.student_id) {
          expect(seatedIds.has(s.student_id)).toBe(false); // No duplicates!
          seatedIds.add(s.student_id);
          seatedCount++;
        }
      });
    });

    expect(seatedCount).toBe(30);
    expect(seatedIds.size).toBe(30);
  });
});
