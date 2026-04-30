import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, email } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }

  // --- Resend integration (uncomment when ready) ---
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.contacts.create({
  //   email,
  //   firstName: name,
  //   audienceId: process.env.RESEND_AUDIENCE_ID!,
  // });

  console.log(`New subscriber: ${name} <${email}>`);
  return NextResponse.json({ success: true });
}
