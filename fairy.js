// Original vector artwork; no external images or fonts are needed.
export function fairySvg(type, id = 'fairy') {
  if (!type) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" role="img" aria-label="顔のある光の妖精">
    <defs><radialGradient id="${id}-light"><stop stop-color="#fffde5"/><stop offset=".45" stop-color="#fff1b5"/><stop offset=".65" stop-color="#ffdb75" stop-opacity=".95"/><stop offset=".8" stop-color="#ffd66a" stop-opacity=".3"/><stop offset="1" stop-color="#ffd66a" stop-opacity="0"/></radialGradient></defs>
    <circle cx="150" cy="150" r="145" fill="url(#${id}-light)"/>
    <ellipse cx="126" cy="145" rx="6" ry="8" fill="#48372c"/><ellipse cx="174" cy="145" rx="6" ry="8" fill="#48372c"/>
    <circle cx="124" cy="142" r="2" fill="#fff"/><circle cx="172" cy="142" r="2" fill="#fff"/>
    <ellipse cx="110" cy="161" rx="11" ry="6" fill="#f4a3a1" opacity=".6"/><ellipse cx="190" cy="161" rx="11" ry="6" fill="#f4a3a1" opacity=".6"/>
    <path d="M140 169Q150 179 160 169" fill="none" stroke="#805447" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }
  const c=type?.color || '#f0cc72', a=type?.accent || '#fff3c9', symbol=type?.symbol || '✦';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" role="img" aria-label="${type?.name || '光の妖精'}">
  <defs><radialGradient id="${id}-body" cx="35%" cy="25%"><stop stop-color="#fff5de"/><stop offset=".42" stop-color="${c}"/><stop offset="1" stop-color="${c}"/></radialGradient><linearGradient id="${id}-wing" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".92"/><stop offset="1" stop-color="${a}" stop-opacity=".35"/></linearGradient></defs>
  <g fill="url(#${id}-wing)" stroke="#fff" stroke-opacity=".6" stroke-width="2"><path d="M110 142C30 50 8 100 39 174C55 211 89 190 111 172Z"/><path d="M190 142C270 50 292 100 261 174C245 211 211 190 189 172Z"/><path d="M106 176C49 189 58 236 101 221L128 194Z"/><path d="M194 176C251 189 242 236 199 221L172 194Z"/></g>
  <path d="M109 194Q150 162 191 194L209 259Q150 282 91 259Z" fill="${c}"/><path d="M101 254Q150 232 199 254" fill="none" stroke="${a}" stroke-width="5"/>
  <circle cx="150" cy="139" r="67" fill="url(#${id}-body)"/><ellipse cx="111" cy="157" rx="14" ry="7" fill="#f7a2ac" opacity=".65"/><ellipse cx="189" cy="157" rx="14" ry="7" fill="#f7a2ac" opacity=".65"/>
  <ellipse cx="128" cy="140" rx="6" ry="9" fill="#243343"/><ellipse cx="172" cy="140" rx="6" ry="9" fill="#243343"/><circle cx="126" cy="137" r="2" fill="#fff"/><circle cx="170" cy="137" r="2" fill="#fff"/><path d="M140 161Q150 172 160 161" fill="none" stroke="#734a4c" stroke-width="3" stroke-linecap="round"/>
  <path d="M111 83Q150 40 190 83" fill="none" stroke="${a}" stroke-width="8" stroke-linecap="round"/><text x="150" y="76" text-anchor="middle" font-size="37" fill="${a}" font-family="serif">${symbol}</text>
  <path d="M184 213L249 174" stroke="${a}" stroke-width="5" stroke-linecap="round"/><path d="M249 150L255 168L273 174L255 180L249 198L243 180L225 174L243 168Z" fill="${a}"/>
  <path d="M73 63L77 74L88 78L77 82L73 93L69 82L58 78L69 74Z" fill="${a}" opacity=".8"/></svg>`;
}
