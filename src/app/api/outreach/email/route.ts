import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { leadId, to, subject, content } = await req.json();

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return NextResponse.json(
        { message: "Email configuration missing. Please add EMAIL_USER and EMAIL_APP_PASSWORD to your environment variables." },
        { status: 503 }
      );
    }

    if (!to) {
      return NextResponse.json(
        { message: "No email address provided for this lead." },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: subject || "Quick question about your business",
      text: content,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { message: error.message || "An unexpected error occurred while sending the email." },
      { status: 500 }
    );
  }
}
