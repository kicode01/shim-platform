import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isValidSupportIssueType,
  isValidSupportStatus,
} from "@/lib/support";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    ((session.user as any).role !== "admin" &&
      (session.user as any).role !== "organizer")
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusParam = (searchParams.get("status") || "").trim();
    const typeParam = (searchParams.get("type") || "").trim();
    const search = (searchParams.get("search") || "").trim();

    const where: any = {};

    if (statusParam && statusParam !== "all" && isValidSupportStatus(statusParam)) {
      where.status = statusParam;
    }

    if (typeParam && typeParam !== "all" && isValidSupportIssueType(typeParam)) {
      where.issueType = typeParam;
    }

    if (search) {
      where.OR = [
        { reporterName: { contains: search, mode: "insensitive" } },
        { reporterEmail: { contains: search, mode: "insensitive" } },
        { eventName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        event: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Failed to list support tickets:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const issueType = typeof body?.issueType === "string" ? body.issueType.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description.trim() : "";
    const rawEventId =
      typeof body?.eventId === "string" ? body.eventId.trim() : "";

    const rawEmail =
      typeof body?.reporterEmail === "string" ? body.reporterEmail.trim() : "";
    const rawName =
      typeof body?.reporterName === "string" ? body.reporterName.trim() : "";

    const email = rawEmail || session?.user?.email?.trim() || "";
    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!isValidSupportIssueType(issueType)) {
      return NextResponse.json(
        { message: "Please choose a valid issue type." },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { message: "Please describe your issue or concern." },
        { status: 400 }
      );
    }

    if (description.length > 2000) {
      return NextResponse.json(
        { message: "Description must be 2000 characters or fewer." },
        { status: 400 }
      );
    }

    let resolvedEventId: string | null = null;
    let resolvedEventName: string | null = null;

    if (issueType === "Event Concern") {
      if (!rawEventId) {
        return NextResponse.json(
          { message: "Please select the related event." },
          { status: 400 }
        );
      }

      const event = await prisma.event.findUnique({
        where: { id: rawEventId },
        select: { id: true, name: true },
      });

      if (!event) {
        return NextResponse.json(
          { message: "Selected event could not be found." },
          { status: 400 }
        );
      }

      resolvedEventId = event.id;
      resolvedEventName = event.name;
    }

    let resolvedUserId: string | null = session?.user?.id || null;
    let matchedUserName: string | null = null;

    if (!resolvedUserId) {
      const matchedUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, name: true },
      });
      if (matchedUser) {
        resolvedUserId = matchedUser.id;
        matchedUserName = matchedUser.name;
      }
    }

    const reporterName =
      rawName || session?.user?.name?.trim() || matchedUserName || null;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: resolvedUserId,
        reporterName,
        reporterEmail: email,
        issueType,
        eventId: resolvedEventId,
        eventName: resolvedEventName,
        description,
        status: "Pending",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        event: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Support request submitted successfully.",
        ticket,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create support ticket:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
