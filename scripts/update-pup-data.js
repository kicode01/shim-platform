const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateToPUP() {
  console.log("Updating database to Polytechnic University of the Philippines (PUP)...");

  // 1. Ensure PUP Admin user exists
  let admin = await prisma.user.findFirst({
    where: { 
      OR: [
        { email: "admin@pup.edu.ph" },
        { email: "admin@sppq.edu" }
      ]
    }
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: "admin@pup.edu.ph",
        name: "Dr. Manuel M. Muhi / CCIS Dean",
        role: "admin"
      }
    });
  } else {
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: {
        email: "admin@pup.edu.ph",
        name: "Dr. Manuel M. Muhi / CCIS Dean"
      }
    });
  }

  console.log("Admin user calibrated:", admin.email, admin.name);

  // 2. Predefined PUP Templates
  const pupTemplates = [
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

  // Get current templates
  const existingTemplates = await prisma.template.findMany();
  console.log(`Found ${existingTemplates.length} existing templates.`);

  // Update or insert templates
  const updatedTemplateIds = [];
  for (let i = 0; i < pupTemplates.length; i++) {
    const pupT = pupTemplates[i];
    if (existingTemplates[i]) {
      const updated = await prisma.template.update({
        where: { id: existingTemplates[i].id },
        data: {
          name: pupT.name,
          description: pupT.description,
          designData: pupT.designData,
          userId: admin.id
        }
      });
      console.log(`Updated template ${i + 1}: ${updated.name}`);
      updatedTemplateIds.push(updated.id);
    } else {
      const created = await prisma.template.create({
        data: {
          name: pupT.name,
          description: pupT.description,
          designData: pupT.designData,
          userId: admin.id
        }
      });
      console.log(`Created template ${i + 1}: ${created.name}`);
      updatedTemplateIds.push(created.id);
    }
  }

  // Update sample certificates to PUP curricula
  const certs = await prisma.certificate.findMany();
  console.log(`Found ${certs.length} certificates.`);

  if (certs.length > 0) {
    // Update first cert
    await prisma.certificate.update({
      where: { id: certs[0].id },
      data: {
        recipientName: "Angelica M. Santos",
        recipientEmail: "angelica.santos@iskolarngbayan.pup.edu.ph",
        courseName: "Bachelor of Science in Computer Science (BSCS)",
        courseOutcomes: "CO1 [Understand]: Algorithmic complexity, formal grammars, and distributed computing primitives.\nCO2 [Apply]: CHED CMO 25 compliant zero-trust systems, OAuth2/OIDC, and scalable microservices.\nCO3 [Analyze]: Low-latency high-throughput distributed state machines.\nCO4 [Evaluate]: Fault-tolerant consensus protocols under SLA constraints.",
        status: "valid"
      }
    });

    if (certs.length > 1) {
      await prisma.certificate.update({
        where: { id: certs[1].id },
        data: {
          recipientName: "Juan Carlos Dela Cruz",
          recipientEmail: "juan.delacruz@iskolarngbayan.pup.edu.ph",
          courseName: "Bachelor of Science in Information Technology (BSIT)",
          courseOutcomes: "CO1 [Understand]: Enterprise networking architectures and cloud virtualization.\nCO2 [Apply]: Automated penetration testing, vulnerability assessment, and ISO 27001 compliance.\nCO3 [Create]: End-to-end continuous integration and container orchestration.",
          status: "valid"
        }
      });
    }

    if (certs.length > 2) {
      await prisma.certificate.update({
        where: { id: certs[2].id },
        data: {
          recipientName: "Samantha K. Thorne",
          recipientEmail: "samantha.thorne@iskolarngbayan.pup.edu.ph",
          courseName: "Bachelor of Science in Computer Science (BSCS)",
          courseOutcomes: "CO1 [Understand]: Distributed systems architectures and cloud primitives.\nCO2 [Apply]: Zero-trust security, OAuth2/OIDC, and containerized deployments.\nCO3 [Analyze]: High-throughput low-latency microservices with telemetry.\nCO4 [Evaluate]: Fault-tolerance and disaster recovery under SLA constraints.",
          status: "valid"
        }
      });
    }
  }

  console.log("Database update to PUP completed successfully!");
}

updateToPUP()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
