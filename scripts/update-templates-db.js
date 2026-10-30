const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const templates = await prisma.template.findMany();
  for (const t of templates) {
    if (!t.design) continue;
    let design;
    try {
      design = JSON.parse(t.design);
    } catch (e) {
      console.log(`Failed to parse design for template ${t.id}`);
      continue;
    }
    
    let updated = false;
    
    if (design && design.elements && Array.isArray(design.elements)) {
      const hasQR = design.elements.some(e => e.type === 'qrcode');
      if (!hasQR) {
        design.elements.push({
          id: `el_qr_${Date.now()}_${Math.floor(Math.random()*1000)}`,
          type: 'qrcode',
          x: 40,
          y: 720,
          width: 80,
          height: 80,
          content: 'https://shim.org/verify/sample',
          color: '#000000'
        });
        updated = true;
      }
    }
    
    if (updated) {
      await prisma.template.update({
        where: { id: t.id },
        data: { design: JSON.stringify(design) }
      });
      console.log(`Added QR Code to template ${t.id}`);
    }
  }
}

run().finally(() => prisma.$disconnect());
