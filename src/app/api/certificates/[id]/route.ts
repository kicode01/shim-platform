import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        template: true,
        issuer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!certificate) {
      return NextResponse.json({ message: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json(certificate);
  } catch (error) {
    console.error("Error fetching certificate:", error);
    return NextResponse.json({ message: "Error fetching certificate" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;

  try {
    const body = await req.json();
    const { status } = body;

    if (!status || !["valid", "revoked"].includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    const updated = await prisma.certificate.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating certificate status:", error);
    return NextResponse.json({ message: "Error updating certificate" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;

  try {
    await prisma.certificate.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    return NextResponse.json({ message: "Error deleting certificate" }, { status: 500 });
  }
}
