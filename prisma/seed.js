const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding academic database...");

  // 1. Create or find Admin User
  let admin = await prisma.user.findUnique({
    where: { email: "admin@shim.app" }
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: "admin@shim.app",
        name: "Prof. Alistair Vance, Ph.D.",
        role: "admin"
      }
    });
    console.log("Created admin user:", admin.email);
  }

  // 2. Predefined Academic Templates (PUP Manila)
  const templatesData = [
    {
      name: "Bachelor of Science in Computer Science (BSCS)",
      description: "PUP College of Computer and Information Sciences (CCIS) flagship degree credential with gold academic seal and CHED CMO 25 OBE course outcomes.",
      designData: JSON.stringify({
        theme: "pup",
        institutionName: "POLYTECHNIC UNIVERSITY OF THE PHILIPPINES",
        institutionSub: "MABINI CAMPUS, SANTA MESA, MANILA • REPUBLIC OF THE PHILIPPINES",
        certificateTitle: "Bachelor of Science in Computer Science",
        honorText: "Conferred with Magna Cum Laude Academic Distinction • Tanglaw ng Bayan",
        prefixText: "By the authority of the Board of Regents and the University President, it is hereby certified that",
        completionText: "has demonstrated exemplary mastery, ethical practice, and rigorous fulfillment of all academic requirements for the curriculum of",
        primaryColor: "#800000",
        accentColor: "#d4af37",
        borderColor: "#800000",
        borderStyle: "classic",
        sealType: "pup-seal",
        sealText: "POLITEKNIKONG UNIBERSIDAD NG PILIPINAS • TANGLAW NG BAYAN • 1904",
        firstSignatoryName: "Dr. Manuel M. Muhi, P.E., Ph.D.",
        firstSignatoryTitle: "University President",
        secondSignatoryName: "Assoc. Prof. Remedios G. Ado, Ph.D.",
        secondSignatoryTitle: "Dean, College of Computer and Information Sciences",
        showQr: true,
        showOutcomes: true
      })
    },
    {
      name: "Bachelor of Science in Information Technology (BSIT)",
      description: "PUP CCIS enterprise systems, cloud infrastructure, and cybersecurity curriculum aligned with industry standards.",
      designData: JSON.stringify({
        theme: "emerald",
        institutionName: "POLYTECHNIC UNIVERSITY OF THE PHILIPPINES",
        institutionSub: "MABINI CAMPUS, SANTA MESA, MANILA • REPUBLIC OF THE PHILIPPINES",
        certificateTitle: "Bachelor of Science in Information Technology",
        honorText: "Professional Qualification with Academic Distinction",
        prefixText: "By the authority of the Board of Regents and the Faculty of Computing, it is certified that",
        completionText: "has satisfactorily completed all laboratory practicums, capstone projects, and examinations for the degree of",
        primaryColor: "#064e3b",
        accentColor: "#059669",
        borderColor: "#047857",
        borderStyle: "modern",
        sealType: "pup-seal",
        sealText: "POLITEKNIKONG UNIBERSIDAD NG PILIPINAS • TANGLAW NG BAYAN • 1904",
        firstSignatoryName: "Dr. Manuel M. Muhi, P.E., Ph.D.",
        firstSignatoryTitle: "University President",
        secondSignatoryName: "Atty. Alberto C. Guingona",
        secondSignatoryTitle: "University Registrar",
        showQr: true,
        showOutcomes: true
      })
    },
    {
      name: "Presidential Award for Academic Distinction",
      description: "Highest institutional honor conferred upon top percentile PUP scholars with superlative academic and community accolades.",
      designData: JSON.stringify({
        theme: "pup",
        institutionName: "POLYTECHNIC UNIVERSITY OF THE PHILIPPINES",
        institutionSub: "OFFICE OF THE PRESIDENT & BOARD OF REGENTS",
        certificateTitle: "Presidential Commendation for Academic Distinction",
        honorText: "Highest University Distinction • Tanglaw ng Bayan Award",
        prefixText: "With commendation and unanimous recognition of the Academic Council, this distinction is conferred upon",
        completionText: "in high esteem for groundbreaking academic research, student leadership, and service to the Filipino nation in",
        primaryColor: "#800000",
        accentColor: "#d4af37",
        borderColor: "#800000",
        borderStyle: "ornate",
        sealType: "pup-seal",
        sealText: "POLITEKNIKONG UNIBERSIDAD NG PILIPINAS • TANGLAW NG BAYAN • 1904",
        firstSignatoryName: "Dr. Manuel M. Muhi, P.E., Ph.D.",
        firstSignatoryTitle: "University President",
        secondSignatoryName: "Dr. Emanuel C. De Guzman",
        secondSignatoryTitle: "Vice President for Academic Affairs",
        showQr: true,
        showOutcomes: true
      })
    }
  ];

  const createdTemplates = [];
  for (const t of templatesData) {
    let existing = await prisma.template.findFirst({
      where: { name: t.name, userId: admin.id }
    });

    if (!existing) {
      existing = await prisma.template.create({
        data: {
          name: t.name,
          description: t.description,
          designData: t.designData,
          userId: admin.id
        }
      });
      console.log("Created template:", existing.name);
    }
    createdTemplates.push(existing);
  }

  // 2.5 Create a Default Event
  let defaultEvent = await prisma.event.findFirst({
    where: { organizerId: admin.id }
  });

  if (!defaultEvent) {
    defaultEvent = await prisma.event.create({
      data: {
        name: "Annual Demo Summit 2026",
        description: "A default event for demo purposes.",
        date: new Date(),
        organizerId: admin.id
      }
    });
    console.log("Created default event:", defaultEvent.name);
  }

  // 3. Sample Certificates
  const sampleCerts = [
    {
      recipientName: "Samantha K. Thorne",
      recipientEmail: "samantha.thorne@student.sppq.edu",
      role: "Participant",
      templateId: createdTemplates[0].id,
      status: "valid",
      issueDate: new Date(2026, 5, 20)
    },
    {
      recipientName: "Devon Alexander Vance",
      recipientEmail: "d.vance@ai-research.org",
      role: "Speaker",
      templateId: createdTemplates[1].id,
      status: "valid",
      issueDate: new Date(2026, 7, 14)
    },
    {
      recipientName: "Priya Lakshmi Sundaram",
      recipientEmail: "priya.sundaram@apex.edu",
      role: "Organizer",
      templateId: createdTemplates[2].id,
      status: "valid",
      issueDate: new Date(2026, 8, 1)
    },
    {
      recipientName: "Julian M. Sterling (Revoked Demo)",
      recipientEmail: "julian.sterling.test@domain.com",
      role: "Participant",
      templateId: createdTemplates[0].id,
      status: "revoked", // purposefully revoked to demonstrate revocation check!
      issueDate: new Date(2026, 1, 10)
    }
  ];

  for (const cert of sampleCerts) {
    const existing = await prisma.certificate.findFirst({
      where: { recipientName: cert.recipientName }
    });

    if (!existing) {
      const created = await prisma.certificate.create({
        data: {
          ...cert,
          eventId: defaultEvent.id,
          issuerId: admin.id
        }
      });
      console.log(`Created sample certificate for: ${created.recipientName} (ID: ${created.id}, Status: ${created.status})`);
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
