import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeCertificateFingerprint, parseValidityDateInput } from "@/lib/security";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || ((session.user as any).role !== "organizer" && (session.user as any).role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { templateId, recipients, defaultRole, defaultEventId, defaultValidityDate } = await req.json();
    
    if (!templateId || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ message: "Template ID and a valid list of recipients are required." }, { status: 400 });
    }

    const parsedDefaultValidity = parseValidityDateInput(defaultValidityDate);
    if (parsedDefaultValidity.error) {
      return NextResponse.json({ message: parsedDefaultValidity.error }, { status: 400 });
    }

    for (const recipient of recipients) {
      if (!recipient?.name || !String(recipient.name).trim()) continue;
      const rowValidity = recipient.validityDate ?? recipient.validity_date;
      if (rowValidity !== undefined) {
        const parsedRow = parseValidityDateInput(rowValidity);
        if (parsedRow.error) {
          return NextResponse.json({ message: `Invalid validity date for "${recipient.name}": ${parsedRow.error}` }, { status: 400 });
        }
      }
    }

    let issuerId = (session.user as any).id;
    if (!issuerId && session.user.email) {
      const dbUser = await prisma.user.findFirst({
        where: { email: { equals: session.user.email.trim(), mode: "insensitive" } },
        select: { id: true }
      });
      if (dbUser) issuerId = dbUser.id;
    }

    if (!issuerId) {
      return NextResponse.json({ message: "Issuer account not found. Please log in again." }, { status: 401 });
    }

    const recipientEmails = Array.from(
      new Set(
        recipients
          .map((r: any) => (typeof r?.email === "string" ? r.email.trim().toLowerCase() : ""))
          .filter(Boolean)
      )
    );
    const userRoleByEmail = new Map<string, string>();
    if (recipientEmails.length > 0) {
      const matchedUsers = await prisma.user.findMany({
        where: {
          OR: recipientEmails.map((em) => ({ email: { equals: em, mode: "insensitive" as const } })),
        },
        select: { email: true, certificateRole: true },
      });
      for (const u of matchedUsers) {
        if (u.email && u.certificateRole) {
          userRoleByEmail.set(u.email.trim().toLowerCase(), u.certificateRole);
        }
      }
    }

    const certificates = [];
    for (const recipient of recipients) {
      if (!recipient.name || !recipient.name.trim()) continue;

      let resolvedEventId = defaultEventId;
      const rawEvent = recipient.event ? recipient.event.trim() : null;

      if (rawEvent) {
        const existingEvent = await prisma.event.findFirst({
          where: {
            OR: [
              { id: rawEvent },
              { name: rawEvent }
            ]
          }
        });
        
        if (existingEvent) {
          resolvedEventId = existingEvent.id;
        } else {
          // Create new event on the fly
          const newEvent = await prisma.event.create({
            data: {
              name: rawEvent,
              organizerId: issuerId
            }
          });
          resolvedEventId = newEvent.id;
        }
      } else if (!resolvedEventId) {
        // Fallback if absolutely no event provided
        const fallbackEvent = await prisma.event.findFirst({
          where: { name: "Event Description" }
        }) || await prisma.event.create({
          data: { name: "Event Description", organizerId: issuerId }
        });
        resolvedEventId = fallbackEvent.id;
      }

      const rawRowValidity = recipient.validityDate ?? recipient.validity_date;
      const parsedRowValidity = rawRowValidity !== undefined && rawRowValidity !== ""
        ? parseValidityDateInput(rawRowValidity)
        : parsedDefaultValidity;

      const trimmedEmail = recipient.email ? recipient.email.trim() : null;
      const resolvedRowRole =
        (recipient.role && recipient.role.trim()) ||
        (trimmedEmail ? userRoleByEmail.get(trimmedEmail.toLowerCase()) : undefined) ||
        defaultRole ||
        "Participant";

      const cert = await prisma.certificate.create({
        data: {
          recipientName: recipient.name.trim(),
          recipientEmail: trimmedEmail,
          role: resolvedRowRole,
          eventId: resolvedEventId,
          templateId,
          issuerId,
          validityDate: parsedRowValidity.date,
          status: "valid"
        },
        include: {
          event: true
        }
      });
      certificates.push(cert);
    }

    const certsWithFingerprint = certificates.map((c) => ({
      ...c,
      fingerprint: computeCertificateFingerprint({
        id: c.id,
        recipientName: c.recipientName,
        role: c.role,
        eventName: c.event.name,
        issueDate: c.issueDate,
        issuerId: c.issuerId,
      }),
    }));

    if (certsWithFingerprint.length > 0) {
      await prisma.auditLog.createMany({
        data: certsWithFingerprint.map((c) => ({
          action: "ISSUED",
          certificateId: c.id,
          ipAddress: req.headers.get("x-forwarded-for") || "System",
          details: JSON.stringify({ method: "bulk_generation", fingerprint: c.fingerprint })
        }))
      });
    }

    // For each recipient that already has a Shim account, drop the certificate
    // straight into their wallet so it is waiting when they sign in.
    const { linkCertificatesByEmail } = await import("@/lib/claim");
    const accountByEmail = new Map<string, boolean>();
    await Promise.all(
      certificates
        .filter(c => c.recipientEmail)
        .map(async (c) => {
          const res = await linkCertificatesByEmail(c.recipientEmail, {
            method: "bulk_issue_link",
            extraCertificateIds: [c.id],
          });
          accountByEmail.set(c.recipientEmail!, res.accountExists);
        })
    );

    // Dispatch emails concurrently in the background
    const { sendCertificateEmail } = await import("@/lib/email");
    const emailPromises = certificates
      .filter(c => c.recipientEmail)
      .map(c => sendCertificateEmail({
        to: c.recipientEmail!,
        recipientName: c.recipientName,
        role: c.role,
        eventName: c.event.name,
        certificateId: c.id,
        accountExists: accountByEmail.get(c.recipientEmail!) ?? false,
      }).catch(err => console.error("Email failed:", err)));

    if (emailPromises.length > 0) {
      await Promise.allSettled(emailPromises);
    }

    return NextResponse.json({ 
      certificates: certsWithFingerprint.map(c => ({
        ...c,
        accountExists: c.recipientEmail ? (accountByEmail.get(c.recipientEmail) ?? false) : false,
      })),
      count: certificates.length,
      message: `Successfully issued ${certificates.length} credentials.`
    }, { status: 201 });
  } catch (error: any) {
    console.error("Bulk certificate generation error:", error);
    return NextResponse.json({ message: error?.message || "Error issuing batch certificates" }, { status: 500 });
  }
}
