import { NextResponse } from "next/server";
export async function POST() {
  // TODO MVP6: EvaluationService.evaluateDesign (md/07 #5)
  return NextResponse.json({ todo: "MVP6 evaluate" }, { status: 501 });
}
