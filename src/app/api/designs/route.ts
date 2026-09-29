import { NextResponse } from "next/server";
export async function POST() {
  // TODO MVP4: contextBuilder -> constraintBuilder -> AI job QUEUED -> async completion
  return NextResponse.json({ todo: "MVP4 generate (md/02 #21)" }, { status: 501 });
}
