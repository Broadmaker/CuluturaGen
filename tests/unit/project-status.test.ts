// §121: Status transitions — md/02 §44 state machine.
import { describe, expect, it } from "vitest";
import {
  PROJECT_STATUSES,
  canTransitionProject,
  generateProjectCode,
  isValidProjectStatus,
} from "@/server/services/design/ProjectService";

describe("project status machine", () => {
  it("accepts all known statuses, rejects unknown", () => {
    for (const s of PROJECT_STATUSES) expect(isValidProjectStatus(s)).toBe(true);
    expect(isValidProjectStatus("DRAFTING")).toBe(false);
    expect(isValidProjectStatus("")).toBe(false);
  });

  it("walks the happy path DRAFT → … → COMPLETED", () => {
    const path = ["DRAFT", "RESEARCH", "DESIGNING", "EVALUATION", "FINALIZATION", "COMPLETED"];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransitionProject(path[i], path[i + 1])).toBe(true);
    }
  });

  it("allows EVALUATION → REVISION → EVALUATION loop", () => {
    expect(canTransitionProject("EVALUATION", "REVISION")).toBe(true);
    expect(canTransitionProject("REVISION", "EVALUATION")).toBe(true);
  });

  it("rejects skips and backward jumps", () => {
    expect(canTransitionProject("DRAFT", "DESIGNING")).toBe(false);
    expect(canTransitionProject("DRAFT", "COMPLETED")).toBe(false);
    expect(canTransitionProject("COMPLETED", "DRAFT")).toBe(false);
    expect(canTransitionProject("RESEARCH", "COMPLETED")).toBe(false);
  });

  it("ARCHIVED is terminal and reachable from anywhere active", () => {
    for (const s of PROJECT_STATUSES) {
      if (s === "ARCHIVED") continue;
      expect(canTransitionProject(s, "ARCHIVED")).toBe(true);
    }
    for (const s of PROJECT_STATUSES) {
      expect(canTransitionProject("ARCHIVED", s)).toBe(s === "ARCHIVED");
    }
  });

  it("same-state transitions are no-ops", () => {
    for (const s of PROJECT_STATUSES) expect(canTransitionProject(s, s)).toBe(true);
  });

  it("rejects unknown states on either side", () => {
    expect(canTransitionProject("NOPE", "DRAFT")).toBe(false);
    expect(canTransitionProject("DRAFT", "NOPE")).toBe(false);
  });

  it("generates unique PRJ- codes", () => {
    const codes = Array.from({ length: 200 }, generateProjectCode);
    expect(new Set(codes).size).toBe(200);
    for (const c of codes) expect(c).toMatch(/^PRJ-[A-Z0-9]{6}$/);
  });
});
