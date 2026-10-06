import QRCode from './vendor/qrcode.js';
import { fairySvg } from './fairy.js';
export function wrap(ctx, text, x, y, width, lineHeight) {
  let line='';
  for(const char of text){if(char==='\n'||ctx.measureText(line+char).width>width){ctx.fillText(line,x,y);y+=lineHeight;line=char==='\n'?'':char;}else line+=char;}
  if(line)ctx.fillText(line,x,y);
  return y+lineHeight;
}
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('画像を読み込めませんでした。'));img.src=src;});}
const cardThemes = {
  inspiration: { ink:'#223b58', sky:'#19334d', light:'#567492', label:'INSPIRATION', line:'小さな発見を、大きなきらめきに。' },
  connection: { ink:'#703f50', sky:'#633343', light:'#ae7882', label:'CONNECTION', line:'あなたの優しさが、誰かの灯りになる。' },
  challenge: { ink:'#315944', sky:'#1e4538', light:'#64866a', label:'CHALLENGE', line:'踏み出す一歩に、魔法は宿る。' },
  calm: { ink:'#46665c', sky:'#334e47', light:'#86a89a', label:'SERENITY', line:'穏やかな心が、世界をあたためる。' },
};
function rounded(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}
function star(ctx,x,y,size,color){ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-size);ctx.quadraticCurveTo(size*.22,-size*.22,size,0);ctx.quadraticCurveTo(size*.22,size*.22,0,size);ctx.quadraticCurveTo(-size*.22,size*.22,-size,0);ctx.quadraticCurveTo(-size*.22,-size*.22,0,-size);ctx.fill();ctx.restore();}
function branch(ctx,x,y,rotation,color){
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.strokeStyle=color;ctx.lineWidth=1.8;
  ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(20,-45,4,-110);ctx.stroke();
  for(let i=0;i<6;i++){const by=-15-i*15;for(const side of [-1,1]){ctx.save();ctx.translate(9,by);ctx.rotate(side*.8);ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(side*12,-6,17,5,-side*.4,0,Math.PI*2);ctx.fill();ctx.restore();}}
  ctx.restore();
}
function centerWrap(ctx,text,x,y,width,lineHeight){ctx.save();ctx.textAlign='center';let line='';for(const ch of text){if(ctx.measureText(line+ch).width>width){ctx.fillText(line,x,y);y+=lineHeight;line=ch;}else line+=ch;}if(line)ctx.fillText(line,x,y);ctx.restore();return y+lineHeight;}
export async function renderCard(type, config, url, { includeShareDetails=true } = {}) {
  await document.fonts.ready;
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('画像生成に対応していません。');
  const theme=cardThemes[type.id],gold='#ba965b',paper='#f7f1e5',serif='"Yu Mincho", "Hiragino Mincho ProN", Georgia, serif';
  ctx.fillStyle=paper;ctx.fillRect(0,0,1080,1350);
  // Deterministic fine paper grain; independent of animation randomness.
  for(let i=0;i<4500;i++){ctx.fillStyle=i%2?'#8f704509':'#ffffff55';ctx.fillRect((i*173)%1080,(i*269)%1350,1.3,1.3);}
  ctx.strokeStyle='#bba17a';ctx.lineWidth=1.5;rounded(ctx,35,35,1010,1280,24);ctx.stroke();
  ctx.strokeStyle='#bba17a44';rounded(ctx,47,47,986,1256,17);ctx.stroke();
  branch(ctx,69,165,-.35,'#9ba88b');branch(ctx,1011,165,.35,'#9ba88b');
  ctx.textAlign='center';ctx.fillStyle=gold;ctx.font='18px Georgia, serif';ctx.fillText('A LITTLE CHRISTMAS MAGIC, JUST FOR YOU',540,93);
  ctx.fillStyle=theme.ink;ctx.font=`500 43px ${serif}`;ctx.fillText('私のクリスマス妖精',540,153);
  // A luminous, celestial portrait set inside an engraved arch.
  ctx.save();ctx.beginPath();ctx.moveTo(120,600);ctx.lineTo(120,395);ctx.bezierCurveTo(120,114,960,114,960,395);ctx.lineTo(960,600);ctx.quadraticCurveTo(960,620,940,620);ctx.lineTo(140,620);ctx.quadraticCurveTo(120,620,120,600);ctx.closePath();
  const sky=ctx.createLinearGradient(0,190,0,620);sky.addColorStop(0,theme.sky);sky.addColorStop(1,theme.light);ctx.fillStyle=sky;ctx.fill();ctx.clip();
  const halo=ctx.createRadialGradient(540,440,15,540,440,300);halo.addColorStop(0,'#fff2bb55');halo.addColorStop(1,'#fff2bb00');ctx.fillStyle=halo;ctx.fillRect(100,160,880,470);
  ctx.strokeStyle='#efdcab35';ctx.lineWidth=1;for(const r of [188,224]){ctx.beginPath();ctx.arc(540,439,r,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<50;i++){const x=150+(i*163)%780,y=228+(i*79)%346;ctx.fillStyle='#fff3d4';ctx.globalAlpha=.25+(i%4)*.15;ctx.beginPath();ctx.arc(x,y,i%3===0?2:1,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  star(ctx,240,343,21,'#f5e4b7');star(ctx,817,398,15,'#f5e4b7');star(ctx,757,273,9,'#f5e4b7');star(ctx,324,545,10,'#f5e4b7');
  branch(ctx,180,650,-.4,'#d6c28b77');branch(ctx,906,650,.4,'#d6c28b77');
  const svg=new Blob([fairySvg(type,'saved')],{type:'image/svg+xml'}),imageUrl=URL.createObjectURL(svg);
  try{ctx.shadowColor='#fff1b344';ctx.shadowBlur=36;ctx.drawImage(await loadImage(imageUrl),300,167,480,480);ctx.shadowBlur=0;}finally{URL.revokeObjectURL(imageUrl);}
  ctx.restore();
  ctx.textAlign='center';ctx.fillStyle=gold;ctx.font='18px Georgia, serif';ctx.fillText(`${theme.label}  /  CHRISTMAS FAIRY`,540,664);
  ctx.fillStyle=theme.ink;ctx.font=`600 55px ${serif}`;ctx.fillText(`${type.label}の妖精「${type.name}」`,540,733);
  ctx.font=`28px ${serif}`;ctx.fillText(theme.line,540,782);
  const strengths=type.strengths.split('・');ctx.font='21px sans-serif';
  for(let i=0;i<strengths.length;i++){const x=200+i*235;ctx.fillStyle='#ece4d4';rounded(ctx,x,816,210,43,21);ctx.fill();ctx.fillStyle=theme.ink;ctx.fillText(strengths[i],x+105,845);}
  ctx.fillStyle=theme.ink;ctx.font=`600 29px ${serif}`;centerWrap(ctx,type.wish,540,922,812,42);
  ctx.strokeStyle='#bca37a66';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(126,996);ctx.lineTo(954,996);ctx.stroke();star(ctx,540,996,9,paper);star(ctx,540,996,6,gold);
  ctx.fillStyle=gold;ctx.font='16px Georgia, serif';ctx.fillText('WITH GRATITUDE',540,1036);
  ctx.fillStyle=theme.ink;ctx.font=`600 32px ${serif}`;ctx.fillText('今年一年、ありがとうございました。',540,1086);
  ctx.textAlign='left';ctx.fillStyle='#696255';ctx.font='23px sans-serif';wrap(ctx,config.companyMessage,120,1135,includeShareDetails?665:840,34);
  if(includeShareDetails){
    if(config.companyLogo){const logo=await loadImage(config.companyLogo);const scale=Math.min(200/logo.width,34/logo.height);ctx.drawImage(logo,120,1240,logo.width*scale,logo.height*scale);}
    else if(config.companyName){ctx.fillStyle=theme.ink;ctx.font='19px sans-serif';ctx.fillText(config.companyName,120,1250,640);}
    const qr=document.createElement('canvas');await QRCode.toCanvas(qr,url,{width:144,margin:4,errorCorrectionLevel:'M',color:{dark:theme.ink,light:'#ffffff'}});ctx.drawImage(qr,818,1133);
    ctx.textAlign='center';ctx.fillStyle=theme.ink;ctx.font='17px sans-serif';ctx.fillText('あなたはどの妖精？',890,1293);
    const parsed=new URL(url);ctx.textAlign='left';ctx.fillStyle='#807666';ctx.font='17px sans-serif';ctx.fillText(parsed.host+parsed.pathname,120,1290,650);
  } else {branch(ctx,915,1290,.45,'#9ba88b');ctx.textAlign='center';ctx.fillStyle=gold;ctx.font='16px Georgia';ctx.fillText('MAY YOUR DAYS BE FILLED WITH LITTLE WONDERS',540,1287);}
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('画像を生成できませんでした。')),'image/png'));
}
export function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
