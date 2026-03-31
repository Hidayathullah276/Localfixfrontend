import fs from 'fs';
import sharp from 'sharp';

const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#732FFF"/>
      <stop offset="100%" stop-color="#4A00E0"/>
    </linearGradient>
  </defs>
  <path d="M 256 40 L 450 80 C 450 260 256 470 256 470 C 256 470 62 260 62 80 L 256 40 Z" fill="#202A44"/>
  <path d="M 256 70 L 410 100 C 410 240 256 430 256 430 C 256 430 102 240 102 100 L 256 70 Z" fill="url(#grad)"/>
  <text x="256" y="320" font-family="'Arial Black', sans-serif" font-weight="900" font-size="200" fill="white" text-anchor="middle">LF</text>
</svg>
`;

async function main() {
    const source = 'public/logo-source.png';
    
    // Generate icons from the source image
    await sharp(source).trim().resize(32, 32).png().toFile('public/favicon-32x32.png');
    await sharp(source).trim().resize(192, 192).png().toFile('public/logo192.png');
    await sharp(source).trim().resize(512, 512).png().toFile('public/logo512.png');
    
    // Also overwrite favicon.ico
    await sharp(source).trim().resize(32, 32).png().toFile('public/favicon.ico');
    
    // We'll keep the SVG for now, or we could also try to wrap the image in SVG
    // but the png files are primary.
    
    console.log('Images generated from logo-source.png');
}

main().catch(console.error);
