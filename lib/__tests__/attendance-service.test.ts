/**
 * Unit tests for attendance service functions
 * Run with: npm test -- attendance-service.test.ts
 */

import {
  normalizeDateToDubai,
  getMonthBoundsInDubai,
  calculateDailyPerformanceScore,
} from "../attendance-service";
import { TaskStatus } from "@prisma/client";

describe("Attendance Service", () => {
  describe("normalizeDateToDubai", () => {
    it("should normalize a UTC date to Dubai timezone start of day", () => {
      const utcDate = new Date("2025-11-15T10:30:00Z");
      const normalized = normalizeDateToDubai(utcDate);
      
      expect(normalized.getHours()).toBe(0);
      expect(normalized.getMinutes()).toBe(0);
      expect(normalized.getSeconds()).toBe(0);
    });
  });

  describe("getMonthBoundsInDubai", () => {
    it("should return correct month bounds for November 2025", () => {
      const bounds = getMonthBoundsInDubai(2025, 11);
      
      expect(bounds.monthStart.getFullYear()).toBe(2025);
      expect(bounds.monthStart.getMonth()).toBe(10); // November is month 10 (0-indexed)
      expect(bounds.monthStart.getDate()).toBe(1);
      
      expect(bounds.monthEnd.getFullYear()).toBe(2025);
      expect(bounds.monthEnd.getMonth()).toBe(10);
      expect(bounds.monthEnd.getDate()).toBe(30); // November has 30 days
    });
  });

  describe("calculateDailyPerformanceScore", () => {
    it("should return 100% for perfect attendance and tasks", () => {
      const attendance = {
        checkInTime: new Date("2025-11-15T08:00:00Z"),
        attendanceTasks: [
          { status: TaskStatus.COMPLETED, performance: 5 },
          { status: TaskStatus.COMPLETED, performance: 5 },
        ],
      };

      const score = calculateDailyPerformanceScore(attendance, 8, 15);
      expect(score).toBe(100);
    });

    it("should return lower score for late check-in", () => {
      const attendance = {
        checkInTime: new Date("2025-11-15T08:30:00Z"), // 30 minutes late
        attendanceTasks: [
          { status: TaskStatus.COMPLETED, performance: 5 },
        ],
      };

      const score = calculateDailyPerformanceScore(attendance, 8, 15);
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThan(0);
    });

    it("should return lower score for incomplete tasks", () => {
      const attendance = {
        checkInTime: new Date("2025-11-15T08:00:00Z"),
        attendanceTasks: [
          { status: TaskStatus.COMPLETED, performance: 5 },
          { status: TaskStatus.PENDING, performance: null },
        ],
      };

      const score = calculateDailyPerformanceScore(attendance, 8, 15);
      expect(score).toBeLessThan(100);
      // Should be around 70% (40% for 1/2 tasks + 30% punctuality + 0% ratings)
    });

    it("should return 0% for very late check-in and no completed tasks", () => {
      const attendance = {
        checkInTime: new Date("2025-11-15T10:00:00Z"), // 2 hours late
        attendanceTasks: [
          { status: TaskStatus.PENDING, performance: null },
        ],
      };

      const score = calculateDailyPerformanceScore(attendance, 8, 15);
      expect(score).toBe(0);
    });

    it("should handle no tasks gracefully", () => {
      const attendance = {
        checkInTime: new Date("2025-11-15T08:00:00Z"),
        attendanceTasks: [],
      };

      const score = calculateDailyPerformanceScore(attendance, 8, 15);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      // Should be around 30% (only punctuality, no tasks)
    });
  });
});

