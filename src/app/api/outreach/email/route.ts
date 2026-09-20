import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "EMAIL_DISABLED", message: "Email outreach is permanently disabled. Veltris uses Instagram exclusively." },
    { status: 410 }
  );
}
