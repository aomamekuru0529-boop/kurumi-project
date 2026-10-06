import QRCode from './vendor/qrcode.js';
import { fairySvg } from './fairy.js';
export function wrap(ctx, text, x, y, width, lineHeight) {
  let line='';
  for(const char of text){if(char==='\n'||ctx.measureText(line+char).width>width){ctx.fillText(line,x,y);y+=lineHeight;line=char==='\n'?'':char;}else line+=char;}
  if(line)ctx.fillText(line,x,y);
  return y+lineHeight;
}
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('画像を読み込めませんでした。'));img.src=src;});}
export async function renderCard(type, config, url) {
  await document.fonts.ready;
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('画像生成に対応していません。');
  const bg=ctx.createLinearGradient(0,0,1080,1350);bg.addColorStop(0,'#14283a');bg.addColorStop(1,'#123a31');ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1350);
  ctx.strokeStyle='#d4bb7d';ctx.lineWidth=2;ctx.strokeRect(42,42,996,1266);ctx.strokeStyle='#d4bb7d55';ctx.strokeRect(57,57,966,1236);
  ctx.textAlign='center';ctx.fillStyle='#e9d299';ctx.font='24px Georgia';ctx.fillText('A LITTLE CHRISTMAS GIFT FOR YOU',540,108);
  const svg=new Blob([fairySvg(type,'saved')],{type:'image/svg+xml'}),imageUrl=URL.createObjectURL(svg);
  try{ctx.drawImage(await loadImage(imageUrl),345,130,390,390);}finally{URL.revokeObjectURL(imageUrl);}
  ctx.fillStyle='#fff7e8';ctx.font='bold 52px sans-serif';ctx.fillText(`${type.label}タイプ「${type.name}」`,540,551);
  ctx.textAlign='left';ctx.font='28px sans-serif';wrap(ctx,type.desc,105,620,870,43);
  ctx.fillStyle='#e9d299';ctx.font='bold 26px sans-serif';ctx.fillText(type.strengths,105,800);
  ctx.font='27px sans-serif';wrap(ctx,type.wish,105,858,870,42);
  ctx.strokeStyle='#d4bb7d77';ctx.beginPath();ctx.moveTo(105,969);ctx.lineTo(975,969);ctx.stroke();
  ctx.font='21px Georgia';ctx.fillText('WITH GRATITUDE',105,1012);
  ctx.fillStyle='#fff7e8';ctx.font='bold 30px sans-serif';ctx.fillText('今年一年、ありがとうございました。',105,1061);
  ctx.font='23px sans-serif';wrap(ctx,config.companyMessage,105,1109,615,35);
  if(config.companyLogo){const logo=await loadImage(config.companyLogo);const scale=Math.min(220/logo.width,45/logo.height);ctx.drawImage(logo,105,1240,logo.width*scale,logo.height*scale);}
  else if(config.companyName){ctx.fillStyle='#e9d299';ctx.font='22px sans-serif';ctx.fillText(config.companyName,105,1270);}
  const qr=document.createElement('canvas');await QRCode.toCanvas(qr,url,{width:170,margin:4,errorCorrectionLevel:'M'});ctx.drawImage(qr,805,1090);
  ctx.fillStyle='#e9d299';ctx.font='20px sans-serif';ctx.fillText('あなたはどの妖精？',795,1286);
  // The real site URL and QR appear only in the exported image.
  const parsed=new URL(url);ctx.font='18px sans-serif';ctx.fillText(parsed.host+parsed.pathname,105,1300,650);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('画像を生成できませんでした。')),'image/png'));
}
export function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
