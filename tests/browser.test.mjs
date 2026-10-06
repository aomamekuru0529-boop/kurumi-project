import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, access } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
const root=resolve(process.env.APP_ROOT || '.');
let server,browser,base;
test.before(async()=>{
 server=createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;const file=resolve(root,'.'+(name==='/'?'/index.html':decodeURIComponent(name)));if(!file.startsWith(root+'/')){res.writeHead(403);res.end();return;}const body=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png'})[extname(file)]||'application/octet-stream');res.end(body);}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/`;
 const system='/usr/bin/chromium';let executablePath=process.env.CHROMIUM_PATH;try{await access(system);executablePath ||= system;}catch{}
 browser=await chromium.launch({executablePath,args:['--no-sandbox']});await mkdir('test-results',{recursive:true});
});
test.after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(width,{reduced=false,share=true}={}){
 const page=await browser.newPage({viewport:{width,height:844},reducedMotion:reduced?'reduce':'no-preference',acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({share})=>{
   window.shares=[];Object.defineProperty(navigator,'share',{configurable:true,value:share?async payload=>window.shares.push({files:payload.files?.map(f=>({size:f.size,type:f.type})),url:payload.url}):undefined});
   Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
 },{share});
 await page.clock.install();await page.clock.pauseAt(new Date());await page.goto(base);return {page,errors};
}
async function enter(page){await page.locator('#startBtn').click();await page.clock.runFor(100);assert.equal(await page.locator('#fairySpeech').evaluate(e=>getComputedStyle(e).display),'none');const rect=await page.locator('#fairyOrb').boundingBox();assert(rect.x>page.viewportSize().width);
 for(let i=0;i<10;i++){await page.locator('#lookRight').click();if(await page.locator('#fairySpeech').evaluate(e=>getComputedStyle(e).display==='block'))break;}
 assert.equal(await page.locator('#fairyOrb').getAttribute('tabindex'),'0');await page.locator('#fairyOrb').click({force:true});await page.clock.runFor(2300);assert.equal(await page.locator('.option').count(),4);
}
async function answer(page,index){for(let i=0;i<4;i++){await page.locator('.option').nth(index).click();await page.clock.runFor(2400);}await page.clock.runFor(13500);assert.equal(await page.locator('body').getAttribute('data-phase'),'stroke');
 await page.locator('#strokeFairy').focus();for(let i=0;i<14;i++)await page.keyboard.press(i%2?'ArrowRight':'ArrowLeft');const reduce=await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);await page.clock.runFor(reduce?400:1700);assert.equal(await page.locator('body').getAttribute('data-phase'),'evolved');assert(await page.locator('#evolvedFairy svg').isVisible());const centered=await page.locator('#evolvedFairy').boundingBox();assert(Math.abs(centered.x+centered.width/2-page.viewportSize().width/2)<1);assert(Math.abs(centered.y+centered.height/2-page.viewportSize().height/2)<1);assert.equal(await page.locator('#evolvedFairy').evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await page.locator('#fairyInfoCard').isVisible(),false);await page.clock.runFor(1500);assert.equal(await page.locator('body').getAttribute('data-phase'),'evolved');await page.clock.runFor(500);assert.equal(await page.locator('body').getAttribute('data-phase'),'profile');}
for(const [i,width] of [320,390,1280,1920].entries())test(`complete fairy ${i}, viewport ${width}: cards, QR, share, retry`,async()=>{
 const {page,errors}=await open(width);if(i===1)await page.screenshot({path:'test-results/intro-mobile.png'});await enter(page);if(i===1)await page.screenshot({path:'test-results/workshop-mobile.png'});await answer(page,i);
 assert.match(await page.locator('#fairyInfoTitle').textContent(),new RegExp(['キラリ','ポム','トト','モコ'][i]));assert(await page.locator('#fairyInfoStrengths').textContent());const fairyWidth=await page.locator('#evolvedFairy').evaluate(e=>parseFloat(getComputedStyle(e).width));assert(fairyWidth>=Math.min(width*.72,280)-1);if(i===1)await page.screenshot({path:'test-results/profile-mobile.png',animations:'disabled'});
 await page.locator('#fairyInfoNext').click();await page.clock.runFor(3000);assert.equal(await page.locator('body').getAttribute('data-phase'),'magic');assert(await page.locator('#magicFairyClone svg').isVisible());await page.clock.runFor(3800);assert.equal(await page.locator('body').getAttribute('data-phase'),'handoff');assert(await page.locator('#offeredCard').isVisible());assert(await page.locator('#magicFairyClone svg').isVisible());if(i===1)await page.screenshot({path:'test-results/handoff-mobile.png',animations:'disabled'});await page.clock.runFor(2700);assert.equal(await page.locator('body').getAttribute('data-phase'),'gratitude');
 assert(await page.locator('#evolvedFairy').evaluate(e=>parseFloat(getComputedStyle(e).width))>=Math.min(width*.72,280)-1);if(i===1)await page.screenshot({path:'test-results/gratitude-mobile.png',animations:'disabled'});await page.locator('#gratitudeNext').click();await page.clock.runFor(1000);assert.equal(await page.locator('body').getAttribute('data-phase'),'combined');assert(await page.locator('#finalCardPreview').isVisible());assert.equal(await page.locator('#finalCardPreview').evaluate(e=>e.naturalWidth),1080);await page.locator('#retryBtn').scrollIntoViewIfNeeded();const r=await page.locator('#retryBtn').boundingBox();assert(r.y>=0&&r.y+r.height<=844);if(i===1)await page.screenshot({path:'test-results/result-mobile.png',fullPage:true});
 const pending=page.waitForEvent('download');await page.locator('#saveBtn').click();const download=await pending;assert.equal(await download.failure(),null);await download.saveAs(`test-results/saved-card-${i}.png`);const image=PNG.sync.read(await readFile(await download.path()));assert.equal(image.width,1080);assert.equal(image.height,1350);const qr=jsQR(new Uint8ClampedArray(image.data),image.width,image.height);assert.equal(qr?.data,base);
 await page.locator('#shareBtn').click();const shares=await page.evaluate(()=>window.shares);assert.equal(shares.length,1);assert(shares[0].files[0].size>1000);assert.equal(shares[0].files[0].type,'image/png');
 await page.locator('#retryBtn').click();await page.clock.runFor(200);assert.equal(await page.locator('body').getAttribute('data-phase'),'world');assert.equal(await page.locator('#fairySpeech').evaluate(e=>getComputedStyle(e).display),'none');await enterRetry(page);assert.deepEqual(errors,[]);await page.close();
});
async function enterRetry(page){for(let i=0;i<10;i++){await page.locator('#lookRight').click();if(await page.locator('#fairySpeech').evaluate(e=>getComputedStyle(e).display==='block'))break;}await page.locator('#fairyOrb').click({force:true});await page.clock.runFor(2300);assert.equal(await page.locator('.option').count(),4);}
test('reduced motion and denied clipboard have usable fallbacks',async()=>{
 const {page,errors}=await open(390,{reduced:true,share:false});await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied')}}}));await enter(page);await answer(page,0);await page.locator('#fairyInfoNext').click();await page.clock.runFor(900);await page.locator('#gratitudeNext').click();await page.locator('#shareBtn').click();assert(await page.locator('#shareDialog').isVisible());assert.equal(await page.locator('#shareUrl').inputValue(),base);await page.locator('#closeShare').click();assert.deepEqual(errors,[]);await page.close();
});
test('gyro is opt-in, calibration does not reveal fairy, mute state works',async()=>{
 const {page,errors}=await open(390);await page.evaluate(()=>{window.DeviceOrientationEvent=class extends Event{static requestPermission(){return Promise.resolve('granted')}}});await page.locator('#startBtn').click();await page.locator('#gyroBtn').click();assert.equal(await page.locator('#gyroBtn').getAttribute('aria-pressed'),'true');await page.evaluate(()=>{const e=new Event('deviceorientation');e.gamma=30;window.dispatchEvent(e)});assert.equal(await page.locator('#fairySpeech').evaluate(e=>getComputedStyle(e).display),'none');await page.locator('#soundBtn').click();assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'),'true');await page.locator('#soundBtn').click();assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'),'false');assert.deepEqual(errors,[]);await page.close();
});
test('pointer stroke needs sustained movement and discovery works by dragging',async()=>{
 const {page,errors}=await open(390);await page.locator('#startBtn').click();
 for(let i=0;i<7;i++){await page.mouse.move(320,650);await page.mouse.down();await page.mouse.move(70,650,{steps:10});await page.mouse.up();if(await page.locator('#fairySpeech').evaluate(e=>getComputedStyle(e).display==='block'))break;}
 await page.locator('#fairyOrb').click({force:true});await page.clock.runFor(2300);
 for(let i=0;i<4;i++){await page.locator('.option').nth(0).click();await page.clock.runFor(2400);}await page.clock.runFor(13500);
 const rect=await page.locator('#strokeFairy').boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();
 for(let i=0;i<10;i++)await page.mouse.move(rect.x+rect.width/2+(i%2?30:-30),rect.y+rect.height/2);
 assert.equal(await page.locator('body').getAttribute('data-phase'),'stroke');
 for(let i=0;i<40;i++){await page.clock.runFor(100);await page.mouse.move(rect.x+rect.width/2+(i%2?30:-30),rect.y+rect.height/2);if(i===19){const progress=await page.locator('#strokeWrap').evaluate(e=>parseFloat(e.style.getPropertyValue('--power-progress')));assert(progress>.4&&progress<1);const glow=await page.locator('#strokeFairy svg').evaluate(e=>getComputedStyle(e).filter);assert(parseFloat(glow.match(/brightness\(([^)]+)/)[1])>1);}}
 await page.mouse.up();assert(await page.locator('#flash').evaluate(e=>e.classList.contains('go')));await page.clock.runFor(4000);assert.equal(await page.locator('body').getAttribute('data-phase'),'profile');assert.equal(await page.locator('#flash').evaluate(e=>e.classList.contains('go')),false);assert.deepEqual(errors,[]);await page.close();
});
test('gift shakes in surprise for five seconds before swelling and releasing power',async()=>{
 const {page,errors}=await open(390);await enter(page);
 for(let i=0;i<3;i++){await page.locator('.option').nth(0).click();await page.clock.runFor(2400);}
 await page.locator('.option').nth(0).click();await page.clock.runFor(800);
 assert.equal(await page.locator('body').getAttribute('data-phase'),'gift');
 await page.clock.runFor(1300);assert.equal(await page.locator('body').getAttribute('data-phase'),'gift-shake');assert.equal(await page.locator('.right-panel').isVisible(),false);assert.equal(await page.locator('.workshop-bubble').textContent(),'何か変…？');
 await page.clock.runFor(4700);assert.equal(await page.locator('body').getAttribute('data-phase'),'gift-shake');assert.equal(await page.locator('.right-panel').isVisible(),false);assert.equal(await page.locator('#gift').evaluate(e=>e.classList.contains('inflate')),false);
 await page.clock.runFor(300);assert.equal(await page.locator('body').getAttribute('data-phase'),'gift-inflate');
 await page.clock.runFor(1200);assert.equal(await page.locator('body').getAttribute('data-phase'),'power');assert(await page.locator('#powerBurst').isVisible());
 await page.clock.runFor(2500);assert.equal(await page.locator('body').getAttribute('data-phase'),'power');assert(await page.locator('#powerBurst p').isVisible());await page.clock.runFor(600);assert.equal(await page.locator('body').getAttribute('data-phase'),'stroke');assert(await page.locator('#thankYouMotes').isVisible());await page.clock.runFor(5000);assert.equal(await page.locator('body').getAttribute('data-phase'),'stroke');assert.deepEqual(errors,[]);await page.close();
});
test('answers separately add inner sparkles, paper color, satin color and foil decoration',async()=>{
 const {page,errors}=await open(390);await enter(page);
 const color=()=>page.locator('#gift-paper stop').first().getAttribute('stop-color');
 const satin=()=>page.locator('#gift-satin stop').first().getAttribute('stop-color');
 const initialColor=await color(),initialSatin=await satin();
 assert.equal(await page.locator('#gift .gift-ribbon').isVisible(),false);assert.equal(await page.locator('#gift .gift-bow').isVisible(),false);await page.locator('.option').nth(0).click();assert.equal(await page.locator('#gift .gift-lid').getAttribute('transform'),'translate(0 -36)');await page.clock.runFor(500);assert(await page.locator('#gift .gift-sparkle').count()>0);assert.equal(await color(),initialColor);assert.equal(await satin(),initialSatin);await page.clock.runFor(1900);assert.equal(await page.locator('#gift .gift-lid').getAttribute('transform'),'translate(0 0)');
 await page.locator('.option').nth(1).click();const paperColor=await color();assert.notEqual(paperColor,initialColor);assert.equal(await satin(),initialSatin);await page.clock.runFor(2400);
 await page.locator('.option').nth(2).click();const satinColor=await satin();assert.notEqual(satinColor,initialSatin);assert(await page.locator('#gift .gift-ribbon').isVisible());assert(await page.locator('#gift .gift-bow').isVisible());assert.equal(await color(),paperColor);await page.clock.runFor(2400);
 await page.locator('.option').nth(3).click();assert.equal(await color(),paperColor);assert.equal(await satin(),satinColor);assert(await page.locator('#gift g[clip-path] path').count()>0);assert(await page.locator('#gift .gift-festive').isVisible());assert.equal(await page.locator('#gift .gift-lid').getAttribute('transform'),'translate(0 0)');assert.equal(await page.locator('#gift text').count(),0);await page.clock.runFor(500);await page.screenshot({path:'test-results/gift-complete-mobile.png'});assert.deepEqual(errors,[]);await page.close();
});
