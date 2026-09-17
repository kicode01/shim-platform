const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const templates = await prisma.template.findMany();
  for (const t of templates) {
    const design = JSON.parse(t.design);
    
    let updated = false;
    
    if (design.institutionName === "POLYTECHNIC UNIVERSITY OF THE PHILIPPINES" || design.institutionName === "EVENT CERTIFICATE PLATFORM") {
      design.institutionName = "EventCert Professional";
      updated = true;
    }
    
    if (design.institutionSub === "OFFICIAL UNIVERSITY REGISTRY" || design.institutionSub === "OFFICIAL CERTIFICATION PORTAL") {
      design.institutionSub = "Official Credentialing Portal";
      updated = true;
    }
    
    if (design.prefixText && design.prefixText.includes("Board of Regents")) {
      design.prefixText = "This certifies that";
      updated = true;
    }
    
    if (design.completionText && design.completionText.includes("curriculum for the degree of")) {
      design.completionText = "has successfully completed the requirements for";
      updated = true;
    }
    
    if (design.firstSignatoryName === "Dr. Manuel M. Muhi, P.E., Ph.D." || design.firstSignatoryName === "Dr. Manuel M. Muhi") {
      design.firstSignatoryName = "Alex Morgan";
      updated = true;
    }
    
    if (design.firstSignatoryTitle === "UNIVERSITY PRESIDENT" || design.firstSignatoryTitle === "University President") {
      design.firstSignatoryTitle = "Event Director";
      updated = true;
    }
    
    if (design.secondSignatoryName === "Assoc. Prof. Remedios G. Ado, Ph.D." || design.secondSignatoryName === "Remedios Ado") {
      design.secondSignatoryName = "Sam Rivera";
      updated = true;
    }
    
    if (design.secondSignatoryTitle === "DEAN, COLLEGE OF COMPUTER AND INFORMATION SCIENCES" || design.secondSignatoryTitle === "Dean, College of Computer and Information Sciences") {
      design.secondSignatoryTitle = "Program Lead";
      updated = true;
    }
    
    if (design.documentTitle === "D I P L O M A") {
      design.documentTitle = "CERTIFICATE OF ACHIEVEMENT";
      updated = true;
    }
    
    if (updated) {
      await prisma.template.update({
        where: { id: t.id },
        data: { design: JSON.stringify(design) }
      });
      console.log(`Updated template ${t.id}`);
    }
  }
}

run().finally(() => prisma.$disconnect());
