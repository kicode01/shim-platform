import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { templateId, recipients, defaultRole, defaultEventId } = await req.json();
    
    if (!templateId || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ message: "Template ID and a valid list of recipients are required." }, { status: 400 });
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
              organizerId: (session.user as any).id
            }
          });
          resolvedEventId = newEvent.id;
        }
      } else if (!resolvedEventId) {
        // Fallback if absolutely no event provided
        const fallbackEvent = await prisma.event.findFirst({
          where: { name: "Default Event" }
        }) || await prisma.event.create({
          data: { name: "Default Event", organizerId: (session.user as any).id }
        });
        resolvedEventId = fallbackEvent.id;
      }

      const cert = await prisma.certificate.create({
        data: {
          recipientName: recipient.name.trim(),
          recipientEmail: recipient.email ? recipient.email.trim() : null,
          role: recipient.role ? recipient.role.trim() : (defaultRole || "Participant"),
          eventId: resolvedEventId,
          templateId,
          issuerId: (session.user as any).id,
          status: "valid"
        },
        include: {
          event: true
        }
      });
      certificates.push(cert);
    }

    // Dispatch emails concurrently in the background
    const { sendCertificateEmail } = await import("@/lib/email");
    const emailPromises = certificates
      .filter(c => c.recipientEmail)
      .map(c => sendCertificateEmail({
        to: c.recipientEmail!,
        recipientName: c.recipientName,
        role: c.role,
        eventName: c.event.name,
        certificateId: c.id
      }).catch(err => console.error("Email failed:", err)));
    
    if (emailPromises.length > 0) {
      Promise.allSettled(emailPromises);
    }

    return NextResponse.json({ 
      certificates,
      count: certificates.length,
      message: `Successfully issued ${certificates.length} credentials.`
    }, { status: 201 });
  } catch (error) {
    console.error("Bulk certificate generation error:", error);
    return NextResponse.json({ message: "Error issuing batch certificates" }, { status: 500 });
  }
}
