export interface Constraints { mandatory: string[]; restricted: string[]; budget?: number; }
export function buildConstraints(ctx: unknown): Constraints {
  // TODO MVP4: CULTURAL/BODY/BUDGET/MATERIAL/OCCASION/STYLE/GARMENT rules (md/02 #12)
  void ctx; return { mandatory: [], restricted: [] };
}
