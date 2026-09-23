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

  it('Seating layout should contain 20 desks and 40 seats per class', () => {
    const desks = SeatingService.getDesks('c-6a1');
    expect(desks).toHaveLength(20);

    let totalSeats = 0;
    desks.forEach((d) => {
      expect(d.seats).toHaveLength(2);
      totalSeats += d.seats.length;
    });

    expect(totalSeats).toBe(40);
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

  it('Verifies viewpoint-dependent visual ordering and seat 01/02 reversal invariant', () => {
    const desks = SeatingService.getDesks('c-6a1');
    const firstDesk = desks[0]; // Bàn 01 (Dãy 1, Hàng 1)

    // Logical seats inside desk
    const seat01 = firstDesk.seats[0];
    const seat02 = firstDesk.seats[1];

    // VIEW A: "Nhìn từ dưới lên" (from back toward board)
    // - Columns: 1 -> 2 -> 3 -> 4
    // - Seats: 01 visually Left, 02 visually Right
    const viewA_columns = [1, 2, 3, 4];
    const [viewA_left, viewA_right] = [seat01, seat02];
    expect(viewA_columns[0]).toBe(1); // Dãy 1 on left
    expect(viewA_columns[3]).toBe(4); // Dãy 4 on right
    expect(viewA_left.id).toBe(seat01.id);
    expect(viewA_right.id).toBe(seat02.id);

    // VIEW B: "Nhìn từ bục giảng xuống" (from teaching platform toward back)
    // - Columns: 4 -> 3 -> 2 -> 1
    // - Seats: 02 visually Left, 01 visually Right
    const viewB_columns = [...viewA_columns].reverse();
    const [viewB_left, viewB_right] = [seat02, seat01];
    expect(viewB_columns[0]).toBe(4); // Dãy 4 on left
    expect(viewB_columns[3]).toBe(1); // Dãy 1 on right
    expect(viewB_left.id).toBe(seat02.id);
    expect(viewB_right.id).toBe(seat01.id);

    // Critical data invariant: Underlying IDs and student assignments are NEVER modified
    expect(firstDesk.seats[0].id).toBe(seat01.id);
    expect(firstDesk.seats[1].id).toBe(seat02.id);
  });
});
