import { NextResponse } from "next/server";
export async function POST() {
  // TODO MVP5: deterministic CostService.calculate + snapshot (md/06 #55)
  return NextResponse.json({ todo: "MVP5 cost/calculate" }, { status: 501 });
}
