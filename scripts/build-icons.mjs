import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Small, original, scalable illustrations with a consistent 32px pixel grid.
const I='#443b35', S='#a9be9a', G='#526e58', P='#e7b0ac', B='#b9d9e8', L='#c9c0e5', Y='#eac872', C='#fff7e8', R='#b76a65';
const rect=(x,y,w,h,f,stroke=I)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" stroke="${stroke}" stroke-width="2"/>`;
const line=(x1,y1,x2,y2,color=I,width=2)=>`<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="square"/>`;
const path=(d,f,stroke=I)=>`<path d="${d}" fill="${f}" stroke="${stroke}" stroke-width="2" stroke-linejoin="miter"/>`;
const dot=(x,y,f=Y)=>rect(x,y,2,2,f,f);
const icons={
  home:path('M4 15L16 5L28 15V28H4Z',P)+rect(12,19,8,9,C)+rect(7,15,5,5,B)+rect(20,15,5,5,B),
  trips:rect(4,11,24,17,P)+rect(10,6,12,6,C)+rect(6,15,20,3,Y)+rect(14,11,4,17,G),
  map:path('M3 7L12 4L20 8L29 5V25L20 28L12 24L3 27Z',C)+line(12,4,12,24,G)+line(20,8,20,28,G)+path('M15 12C15 8 21 8 21 12C21 15 18 19 18 19C18 19 15 15 15 12Z',P),
  packing:path('M8 10H24L27 28H5Z',S)+rect(12,4,8,7,C)+rect(10,15,12,8,P)+rect(14,16,4,5,Y),
  tasks:path('M6 5H26V28H6Z',C)+rect(11,3,10,5,P)+rect(9,12,4,4,S)+line(16,14,23,14,G)+rect(9,20,4,4,Y)+line(16,22,23,22,G),
  budget:path('M4 22C4 18 28 18 28 22V27C28 31 4 31 4 27Z',Y)+path('M4 17C4 13 28 13 28 17V22C28 26 4 26 4 22Z',Y)+path('M4 12C4 8 28 8 28 12V17C28 21 4 21 4 17Z',Y)+dot(15,11,C),
  bookings:path('M4 7H28V13C24 13 24 19 28 19V25H4V19C8 19 8 13 4 13Z',P)+line(16,9,16,23,C),
  ski:line(7,4,20,29,G,3)+line(15,4,28,29,P,3)+line(3,26,24,30,I)+line(11,27,31,30,I)+rect(2,4,2,22,Y,Y),
  journal:path('M5 5H25V28H5Z',L)+rect(9,5,4,23,C)+rect(16,11,6,5,Y)+line(16,20,23,20,G)+line(16,24,23,24,G),
  settings:path('M13 3H19L20 7L24 8L27 6L30 11L27 14L27 19L30 22L27 27L23 25L20 26L19 30H13L12 26L8 25L5 27L2 22L5 19V14L2 11L5 6L9 8L12 7Z',S)+rect(13,13,6,6,C),
  plane:path('M3 17L13 13L15 4L19 3L20 12L29 15L29 19L20 20L19 28L15 29L13 20L3 19Z',B),
  train:path('M5 5H27V24H5Z',P)+rect(8,8,7,7,B)+rect(18,8,6,7,B)+rect(8,19,16,3,C)+rect(8,25,5,4,I,I)+rect(20,25,5,4,I,I),
  bus:path('M4 7H28V25H4Z',Y)+rect(7,10,7,7,B)+rect(18,10,7,7,B)+rect(7,20,18,2,C)+rect(7,25,5,3,I,I)+rect(20,25,5,3,I,I),
  ferry:path('M3 20L29 20L25 28H7Z',B)+rect(11,13,10,7,C)+rect(15,5,2,8,G)+path('M17 6L23 12H17Z',P)+line(4,29,28,29,B),
  suitcase:rect(5,10,22,18,P)+rect(11,5,10,6,C)+rect(10,12,3,14,Y)+rect(19,12,3,14,Y),
  passport:rect(6,4,21,25,L)+rect(9,4,2,25,P)+path('M16 11L21 13V19L16 22L11 19V13Z',Y)+line(13,16,19,16,C),
  camera:rect(4,10,24,17,I,I)+rect(8,6,8,5,P)+rect(12,13,10,10,B)+rect(15,16,4,4,C)+dot(24,13,Y),
  compass:path('M16 3L28 16L16 29L4 16Z',B)+path('M19 11L17 19L11 22L14 14Z',P),
  hotel:path('M6 4H26V29H6Z',P)+rect(11,8,4,4,B)+rect(19,8,4,4,B)+rect(11,16,4,4,B)+rect(19,16,4,4,B)+rect(14,23,5,6,C),
  calendar:rect(4,7,24,21,C)+rect(4,7,24,6,P)+line(10,4,10,10,G)+line(22,4,22,10,G)+rect(9,17,5,5,S)+rect(18,17,5,5,Y),
  pin:path('M16 3C9 3 5 8 5 15C5 21 16 30 16 30C16 30 27 21 27 15C27 8 23 3 16 3Z',P)+rect(13,11,6,6,C),
  jacket:path('M10 4H22L29 12L25 19L22 17V29H10V17L7 19L3 12Z',S)+line(16,5,16,29,C)+rect(12,16,2,4,Y),
  sweater:path('M10 5H22L28 11L25 17L22 15V27H10V15L7 17L4 11Z',P)+path('M12 5L16 10L20 5Z',C)+rect(12,18,8,3,L),
  thermals:path('M10 4H22L27 10L24 15L21 13V29H11V13L8 15L5 10Z',L)+line(12,19,20,19,C),
  pants:path('M8 4H24L21 29H16L15 17L13 29H7Z',B)+rect(9,7,14,3,P),
  boots:path('M7 5H16V20L23 24V28H5V23L7 18Z',G)+rect(8,9,7,4,P)+line(7,24,23,24,C),
  gloves:path('M8 13V5H11V13H13V3H16V13H18V5H21V15L25 13L27 17L22 27H10L5 19Z',P),
  goggles:path('M3 12L9 10L14 13L19 10L29 12L27 21L18 22L16 18L14 22L5 21Z',L)+rect(7,14,6,5,B)+rect(20,14,6,5,B),
  helmet:path('M4 18C4 6 26 3 28 18L24 24H8Z',B)+rect(4,18,24,4,P)+rect(17,24,5,4,I,I),
  toiletries:rect(8,10,10,18,P)+rect(10,5,6,5,C)+rect(21,8,6,20,B)+rect(22,5,4,4,C)+rect(10,16,6,5,Y),
  electronics:rect(6,4,20,25,I,I)+rect(8,7,16,17,B)+rect(14,25,4,2,C,C)+dot(20,10,Y),
  bottle:path('M12 4H20V9L23 13V28H9V13L12 9Z',B)+rect(12,4,8,3,G)+rect(11,17,10,5,C),
  adapter:rect(7,10,18,17,C)+rect(11,4,3,8,I,I)+rect(18,4,3,8,I,I)+rect(12,17,8,5,Y),
  flower:path('M16 5L20 11L27 10L24 17L27 23L20 23L16 29L12 23L5 23L8 17L5 10L12 11Z',P)+rect(13,14,6,6,Y),
  star:path('M16 2L19 12L29 15L19 18L16 29L13 18L3 15L13 12Z',Y),
  mountain:path('M2 27L12 7L19 19L23 12L31 27Z',B)+path('M8 15L12 7L16 14L12 13Z',C),
  stamp:path('M5 4H27V28H5Z',C)+path('M16 8L23 16L16 24L9 16Z',S)+rect(14,14,4,4,Y),
  cat:path('M7 12L7 5L13 9L19 9L25 5L25 12L27 21L23 28H9L5 21Z',C)+rect(11,16,2,2,I,I)+rect(20,16,2,2,I,I)+path('M14 21L18 21L16 23Z',P),
  food:path('M4 16C4 6 28 6 28 16C28 25 4 25 4 16Z',Y)+rect(12,16,8,5,P)+line(5,26,27,26,I),
  heart:path('M16 27L4 16C-1 9 7 2 16 10C25 2 33 9 28 16Z',P),
  clock:path('M16 3C9 3 4 9 4 16C4 23 9 29 16 29C23 29 28 23 28 16C28 9 23 3 16 3Z',C)+line(16,8,16,17,G)+line(16,17,22,20,G),
  snow:path('M16 2V30M3 9L29 23M3 23L29 9',C)+rect(14,14,4,4,B),
  cloud:path('M6 24C2 24 2 17 7 16C8 8 18 7 21 13C28 11 31 18 28 23Z',C),
};

const dir=join('dist','assets','icons');mkdirSync(dir,{recursive:true});
for(const [name,body] of Object.entries(icons)){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges" role="img" aria-label="${name}">${body}</svg>`;
  writeFileSync(join(dir,`${name}.svg`),svg);
}
console.log(`Wrote ${Object.keys(icons).length} custom icons`);
