const palettes = [
  { box:'#3b5274', ribbon:'#cfb276', foil:'#e7cf97' },
  { box:'#b4828e', ribbon:'#f0d7c5', foil:'#fff0d2' },
  { box:'#365e50', ribbon:'#c69a6a', foil:'#dec69a' },
  { box:'#dce5db', ribbon:'#8faa9e', foil:'#738f81' },
];
// Each answer controls a separate part of the gift; no text tags or emoji.
export function giftSvg(answers) {
  const box=palettes[answers[1]]?.box || '#c7bbab';
  const ribbon=palettes[answers[2]]?.ribbon || '#e9dbc3';
  const foil=palettes[answers[3]]?.foil || '#e7cf97';
  const open=answers.length>0 && answers.length<4;
  const shimmer=answers.length>0;
  const decoration=answers.length===4 ? decorationSvg(answers[3],foil) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" role="img" aria-label="${['あなたへのギフトボックス','箱の中で光がきらめくギフト','箱の色を選んだギフト','リボンの色を選んだギフト','装飾が完成したギフト'][answers.length]}">
  <defs>
    <linearGradient id="gift-paper" x2="1" y2="1"><stop stop-color="${box}"/><stop offset=".55" stop-color="${box}"/><stop offset="1" stop-color="${box}"/></linearGradient>
    <linearGradient id="gift-satin" x2="1" y2="0"><stop stop-color="${ribbon}"/><stop offset=".22" stop-color="#fff" stop-opacity=".9"/><stop offset=".48" stop-color="${ribbon}"/><stop offset=".8" stop-color="${ribbon}"/><stop offset="1" stop-color="#fff" stop-opacity=".7"/></linearGradient>
    <linearGradient id="gift-shade" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".18"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".15"/></linearGradient>
    <radialGradient id="gift-light"><stop stop-color="#fff5c1" stop-opacity=".9"/><stop offset="1" stop-color="#ffd56e" stop-opacity="0"/></radialGradient>
    <clipPath id="gift-front"><path d="M28 94L163 94L163 187L28 187Z"/></clipPath>
  </defs>
  <ellipse cx="111" cy="196" rx="91" ry="12" fill="#251b18" opacity=".25"/>
  <path d="M28 94L163 94L195 76L60 76Z" fill="#645347"/>
  <path d="M39 93L157 93L182 80L64 80Z" fill="#342923"/>
  ${shimmer?`<ellipse cx="108" cy="86" rx="67" ry="43" fill="url(#gift-light)" class="gift-inner-light"/>${[[-32,-3],[1,-9],[29,-1],[-17,-23],[17,-31]].map(([x,y],i)=>`<path class="gift-sparkle" style="animation-delay:${i*.24}s" d="M${108+x} ${83+y-6}l2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="#fff3be"/>`).join('')}`:''}
  <path d="M163 94L195 76L195 169L163 187Z" fill="${box}"/><path d="M163 94L195 76L195 169L163 187Z" fill="#000" opacity=".18"/>
  <path d="M28 94H163V184Q163 187 160 187H31Q28 187 28 184Z" fill="url(#gift-paper)"/>
  <path d="M28 94H163V187H28Z" fill="url(#gift-shade)"/>
  <path d="M31 99H159V183H31Z" fill="none" stroke="#fff" stroke-opacity=".12"/>
  <g clip-path="url(#gift-front)">${decoration}</g>
  <path d="M91 94H109V187H91Z" fill="${ribbon}"/><path d="M93 94H108V187H93Z" fill="url(#gift-satin)" opacity=".65"/>
  <path d="M28 128H163V141H28Z" fill="${ribbon}"/><path d="M28 130H163V134H28Z" fill="#fff" opacity=".18"/>
  <path d="M163 128L195 110V123L163 141Z" fill="${ribbon}"/>
  <g class="gift-lid" transform="translate(0 ${open?-36:0})">
    <path d="M24 86H166V100H24Z" fill="${box}"/><path d="M166 86L199 67V81L166 100Z" fill="${box}"/><path d="M166 86L199 67V81L166 100Z" fill="#000" opacity=".22"/>
    <path d="M24 86L57 67H199L166 86Z" fill="${box}"/><path d="M24 86L57 67H199L166 86Z" fill="#fff" opacity=".18"/>
    <path d="M91 86L124 67H142L109 86V100H91Z" fill="${ribbon}"/>
    <path d="M42 76H183L166 86H24Z" fill="${ribbon}" opacity=".9"/>
    <path d="M113 73C65 42 58 45 69 64C76 76 99 81 113 73Z" fill="${ribbon}" stroke="#fff" stroke-opacity=".35"/>
    <path d="M113 73C142 32 168 41 157 58C144 74 128 79 113 73Z" fill="${ribbon}" stroke="#fff" stroke-opacity=".35"/>
    <path d="M110 71Q92 89 81 105L94 101L99 110L119 76Z" fill="${ribbon}"/>
    <path d="M117 72Q139 84 153 99L141 97L137 105L112 76Z" fill="${ribbon}"/>
    <ellipse cx="114" cy="73" rx="9" ry="6" fill="url(#gift-satin)"/><path d="M74 53Q92 59 107 72M149 47Q132 58 120 71" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
  </g>
  </svg>`;
}
function decorationSvg(index,color) {
  const border=`<path d="M36 103H155V178H36Z" fill="none" stroke="${color}" stroke-width=".8" opacity=".6"/>`;
  if(index===0)return border+[[49,114],[137,117],[56,163],[142,165]].map(([x,y])=>`<path d="M${x} ${y-7}l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="none" stroke="${color}"/>`).join('');
  if(index===1)return border+`<g fill="none" stroke="${color}" stroke-width="1.2"><path d="M44 151C29 137 57 128 55 146C67 129 76 147 44 161Z"/><path d="M139 114C126 103 145 101 145 112C161 103 164 118 139 126Z"/></g>`;
  if(index===2)return border+`<g fill="none" stroke="${color}" stroke-width="1.1"><path d="M44 113l7-8 7 8-7 8ZM135 159l9-11 9 11-9 11Z"/><path d="M40 167h22M51 156v22M134 115h18M143 106v18"/></g>`;
  return border+`<g fill="none" stroke="${color}" stroke-width="1.1"><path d="M44 171Q65 145 47 110M46 119q-12-5-7-11q9 1 7 11M51 131q12-10 13-2q-4 9-13 2M53 146q-12-9-14-1q3 8 14 1M135 171q-15-26 8-52M139 130q14-4 12-10q-10-3-12 10M135 146q-14-4-12-11q10-3 12 11"/></g>`;
}
