import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET() {
  try {
    const hash = await bcrypt.hash("password123", 10);
    const admin = await prisma.adminUser.upsert({
      where: { email: "admin@example.com" },
      update: { password: hash },
      create: { email: "admin@example.com", password: hash }
    });
    
    return NextResponse.json({ 
      message: "Default admin user created!", 
      email: admin.email, 
      password: "password123" 
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
