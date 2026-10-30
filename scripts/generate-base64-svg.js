const fs = require('fs');
const woff2 = fs.readFileSync('node_modules/inter-ui/web/Inter-Black.woff2');
const b64 = woff2.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
  <style>
    @font-face {
      font-family: 'Inter';
      src: url(data:font/woff2;base64,${b64}) format('woff2');
      font-weight: 900;
    }
    text {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 185px;
      font-weight: 900;
      letter-spacing: -16px;
      fill: #000000;
    }
    @media (prefers-color-scheme: dark) {
      text { fill: #ffffff; }
    }
  </style>
  <text x="120" y="74" text-anchor="middle" dominant-baseline="middle">sh</text>
  <text x="120" y="188" text-anchor="middle" dominant-baseline="middle">ım</text>
</svg>`;
fs.writeFileSync('public/icon.svg', svg);
console.log('Done!');
