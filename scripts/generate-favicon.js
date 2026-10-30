const opentype = require('opentype.js');
const fs = require('fs');

async function main() {
  const url = 'https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Black.otf';
  console.log('Fetching Inter Black OTF...');
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  
  console.log('Parsing font...');
  const font = opentype.parse(buffer);
  
  const text = "shim";
  const fontSize = 80;
  const letterSpacingEm = -0.08;
  const tracking = letterSpacingEm * fontSize;
  
  let currentX = 0;
  const paths = [];
  
  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    const path = glyph.getPath(currentX, 72, fontSize);
    paths.push(path.toSVG());
    
    const advanceWidth = glyph.advanceWidth * (fontSize / font.unitsPerEm);
    currentX += advanceWidth + tracking;
  }
  
  const allPathsSVG = paths.join('\n    ');
  
  // Calculate a tight viewBox
  const viewBoxWidth = currentX + 5;
  const viewBoxHeight = 100;
  
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}">
  <style>
    .logo { fill: #000000; }
    @media (prefers-color-scheme: dark) {
      .logo { fill: #ffffff; }
    }
  </style>
  <g class="logo" transform="translate(2, 5)">
    ${allPathsSVG.replace(/fill="[^"]*"/g, '')}
  </g>
</svg>`;

  fs.writeFileSync('public/icon.svg', svgContent);
  console.log('SVG generated successfully at public/icon.svg!');
}

main().catch(console.error);
