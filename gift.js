const palettes = [
  { box:'#3b5274', ribbon:'#cfb276', foil:'#e7cf97' },
  { box:'#b4828e', ribbon:'#f0d7c5', foil:'#fff0d2' },
  { box:'#365e50', ribbon:'#c69a6a', foil:'#dec69a' },
  { box:'#dce5db', ribbon:'#8faa9e', foil:'#738f81' },
];
// Each answer controls a separate part of the gift; no text tags or emoji.
export function giftSvg(answers, { open=false, sparkles=false, opening=false, closing=false } = {}) {
  const box=palettes[answers[1]]?.box || '#ad8058';
  const ribbon=palettes[answers[2]]?.ribbon || '#e9dbc3';
  const foil=palettes[answers[3]]?.foil || '#e7cf97';
  const hasRibbon=answers.length>=3;
  const shimmer=sparkles;
  const decoration=answers.length===4 ? decorationSvg(answers[3],foil) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" role="img" aria-label="${['あなたへのギフトボックス','箱の中で光がきらめくギフト','箱の色を選んだギフト','リボンの色を選んだギフト','装飾が完成したギフト'][answers.length]}">
  <defs>
    <linearGradient id="gift-paper" x2="1" y2="1"><stop stop-color="${box}"/><stop offset=".55" stop-color="${box}"/><stop offset="1" stop-color="${box}"/></linearGradient>
    <linearGradient id="gift-satin" x2="1" y2="0"><stop stop-color="${ribbon}"/><stop offset=".22" stop-color="#fff" stop-opacity=".9"/><stop offset=".48" stop-color="${ribbon}"/><stop offset=".8" stop-color="${ribbon}"/><stop offset="1" stop-color="#fff" stop-opacity=".7"/></linearGradient>
    <linearGradient id="gift-shade" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".18"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".15"/></linearGradient>
    <radialGradient id="gift-light"><stop stop-color="#fff5c1" stop-opacity=".9"/><stop offset="1" stop-color="#ffd56e" stop-opacity="0"/></radialGradient>
    <clipPath id="gift-front"><path d="M28 94L163 94L163 187L28 187Z"/></clipPath>
  </defs>
  <path d="M28 94L163 94L195 76L60 76Z" fill="#645347"/>
  <path d="M39 93L157 93L182 80L64 80Z" fill="#342923"/>
  ${shimmer?`<ellipse cx="108" cy="86" rx="67" ry="43" fill="url(#gift-light)" class="gift-inner-light"/>${[[-32,-3],[1,-9],[29,-1],[-17,-23],[17,-31]].map(([x,y],i)=>`<path class="gift-sparkle" style="animation-delay:${i*.24}s" d="M${108+x} ${83+y-6}l2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="#fff3be"/>`).join('')}`:''}
  <path d="M163 94L195 76L195 169L163 187Z" fill="${box}"/><path d="M163 94L195 76L195 169L163 187Z" fill="#000" opacity=".18"/>
  <path d="M28 94H163V184Q163 187 160 187H31Q28 187 28 184Z" fill="url(#gift-paper)"/>
  <path d="M28 94H163V187H28Z" fill="url(#gift-shade)"/>
  <path d="M31 99H159V183H31Z" fill="none" stroke="#fff" stroke-opacity=".12"/>
  <g clip-path="url(#gift-front)">${decoration}</g>
  <g class="gift-ribbon" style="display:${hasRibbon?'inline':'none'}">
  <path d="M91 94H109V187H91Z" fill="${ribbon}"/><path d="M93 94H108V187H93Z" fill="url(#gift-satin)" opacity=".65"/>
  <path d="M28 128H163V141H28Z" fill="${ribbon}"/><path d="M28 130H163V134H28Z" fill="#fff" opacity=".18"/>
  <path d="M163 128L195 110V123L163 141Z" fill="${ribbon}"/>
  </g>
  <g class="gift-lid ${opening?'is-opening':closing?'is-closing':''}" transform="translate(0 ${open?-36:0})">
    <path d="M24 86H166V100H24Z" fill="${box}"/><path d="M166 86L199 67V81L166 100Z" fill="${box}"/><path d="M166 86L199 67V81L166 100Z" fill="#000" opacity=".22"/>
    <path d="M24 86L57 67H199L166 86Z" fill="${box}"/><path d="M24 86L57 67H199L166 86Z" fill="#fff" opacity=".18"/>
    <g class="gift-bow" style="display:${hasRibbon?'inline':'none'}">
    <path d="M91 86L124 67H142L109 86V100H91Z" fill="${ribbon}"/>
    <path d="M42 76H183L166 86H24Z" fill="${ribbon}" opacity=".9"/>
    <path d="M113 73C65 42 58 45 69 64C76 76 99 81 113 73Z" fill="${ribbon}" stroke="#fff" stroke-opacity=".35"/>
    <path d="M113 73C142 32 168 41 157 58C144 74 128 79 113 73Z" fill="${ribbon}" stroke="#fff" stroke-opacity=".35"/>
    <path d="M110 71Q92 89 81 105L94 101L99 110L119 76Z" fill="${ribbon}"/>
    <path d="M117 72Q139 84 153 99L141 97L137 105L112 76Z" fill="${ribbon}"/>
    <ellipse cx="114" cy="73" rx="9" ry="6" fill="url(#gift-satin)"/><path d="M74 53Q92 59 107 72M149 47Q132 58 120 71" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
    </g>
  </g>
  ${answers.length===4?`<g class="gift-festive" transform="translate(174 83)"><path d="M-21 0Q-12-22 0-5Q8-27 20-15Q21-4 4 3Q14 16-2 17Q-13 15-8 4Z" fill="#47755b" stroke="#b6c58d" stroke-width="1"/><path d="M-17-10L10 9M-2-14L0 13" stroke="#b6c58d" fill="none"/><circle cx="0" cy="1" r="5" fill="#d75957"/><circle cx="8" cy="4" r="4" fill="#c94549"/><circle cx="2" cy="10" r="4" fill="#e57661"/></g>`:''}
  </svg>`;
}
function decorationSvg(index,color) {
  const frame=`<path d="M35 103H156V179H35Z" fill="none" stroke="${color}" stroke-width="2"/><path d="M40 108H151V174H40Z" fill="none" stroke="${color}" stroke-width=".7"/>`;
  const dots=Array.from({length:18},(_,i)=>`<circle cx="${43+(i%6)*20}" cy="${114+Math.floor(i/6)*27}" r="1.6" fill="${color}"/>`).join('');
  const star=(x,y,r)=>`<path d="M${x} ${y-r}l${r*.3} ${r*.7} ${r*.7} ${r*.3}-${r*.7} ${r*.3}-${r*.3} ${r*.7}-${r*.3}-${r*.7}-${r*.7}-${r*.3} ${r*.7}-${r*.3}Z" fill="${color}" stroke="#fff7dd" stroke-width=".8"/>`;
  if(index===0)return frame+dots+star(58,155,19)+star(137,117,11)+star(141,165,9);
  if(index===1)return frame+dots+`<path d="M57 154C24 125 43 112 57 132C72 110 91 132 57 154Z" fill="#efb3b5" stroke="${color}" stroke-width="2"/>`+star(140,157,14);
  if(index===2)return frame+dots+`<path d="M56 128L73 149L56 170L39 149Z" fill="#eab464" stroke="${color}" stroke-width="3"/><path d="M56 130V167M41 149H71" stroke="#fff0ba" stroke-width="1.5"/>`+star(139,157,15);
  return frame+dots+`<g stroke="${color}" stroke-width="2.5"><path d="M57 126V166M37 146H77M43 132L71 160M43 160L71 132"/><path d="M139 115V145M124 130H154M129 120L149 140M129 140L149 120"/></g>`+star(139,163,12);
}
