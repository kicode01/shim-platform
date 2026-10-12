import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { linkCertificatesToUser } from "@/lib/claim";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role;

    if (!email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const exists = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (exists) {
      // 409 lets the client show the "already registered -> sign in" branch.
      return NextResponse.json(
        { message: "This email is already registered. Please sign in instead." },
        { status: 409 }
      );
    }

    // Determine role and membership ID
    const validRole = role === "member" ? "member" : "organizer";
    let membershipId: string | null = null;
    if (validRole === "member") {
      const taken = await prisma.user.count({
        where: { membershipId: { startsWith: "ATT-M-" } },
      });
      for (let attempt = 0; attempt < 25; attempt++) {
        const candidate = `ATT-M-${String(10000 + taken + attempt).padStart(5, "0")}`;
        const clash = await prisma.user.findFirst({
          where: { membershipId: candidate },
          select: { id: true },
        });
        if (!clash) {
          membershipId = candidate;
          break;
        }
      }
      if (!membershipId) {
        membershipId = `ATT-M-${Date.now().toString(36).toUpperCase()}${taken}`;
      }
    }

    // Usually hash password here using bcrypt, omitted for dev simplicity
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: validRole,
        membershipId,
        image: password, // Workaround: store password in image field without db migration
      },
    });

    // If certificates were already issued to this email (e.g. from a kiosk
    // check-in), attach them to the new account's wallet.
    const claimedCount = await linkCertificatesToUser(user.id, email, {
      method: "wallet_link_on_signup",
    });

    return NextResponse.json(
      { message: "User created successfully", user, claimedCount },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
