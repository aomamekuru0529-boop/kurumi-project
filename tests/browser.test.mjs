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
 await page.clock.install();await page.goto(base);return {page,errors};
}
async function enter(page){await page.locator('#startBtn').click();await page.clock.runFor(100);assert.equal(await page.locator('#fairySpeech').evaluate(e=>getComputedStyle(e).display),'none');const rect=await page.locator('#fairyOrb').boundingBox();assert(rect.x>page.viewportSize().width);
 for(let i=0;i<10;i++){await page.locator('#lookRight').click();if(await page.locator('#fairySpeech').evaluate(e=>getComputedStyle(e).display==='block'))break;}
 assert.equal(await page.locator('#fairyOrb').getAttribute('tabindex'),'0');await page.locator('#fairyOrb').click({force:true});await page.clock.runFor(2300);assert.equal(await page.locator('.option').count(),4);
}
async function answer(page,index){for(let i=0;i<4;i++){await page.locator('.option').nth(index).click();await page.clock.runFor(900);}await page.clock.runFor(3500);assert.equal(await page.locator('body').getAttribute('data-phase'),'stroke');
 await page.locator('#strokeFairy').focus();for(let i=0;i<14;i++)await page.keyboard.press(i%2?'ArrowRight':'ArrowLeft');await page.clock.runFor(1100);assert.equal(await page.locator('body').getAttribute('data-phase'),'profile');}
for(const [i,width] of [320,390,1280,1920].entries())test(`complete fairy ${i}, viewport ${width}: cards, QR, share, retry`,async()=>{
 const {page,errors}=await open(width);if(i===1)await page.screenshot({path:'test-results/intro-mobile.png'});await enter(page);if(i===1)await page.screenshot({path:'test-results/workshop-mobile.png'});await answer(page,i);
 assert.match(await page.locator('#fairyInfoTitle').textContent(),new RegExp(['キラリ','ポム','トト','モコ'][i]));assert(await page.locator('#fairyInfoStrengths').textContent());if(i===1)await page.screenshot({path:'test-results/profile-mobile.png'});
 await page.locator('#fairyInfoNext').click();await page.clock.runFor(3000);assert.equal(await page.locator('body').getAttribute('data-phase'),'magic');assert(await page.locator('#magicFairyClone svg').isVisible());await page.clock.runFor(3800);assert.equal(await page.locator('body').getAttribute('data-phase'),'gratitude');
 if(i===1)await page.screenshot({path:'test-results/gratitude-mobile.png'});await page.locator('#gratitudeNext').click();await page.clock.runFor(1000);assert.equal(await page.locator('body').getAttribute('data-phase'),'combined');await page.locator('#retryBtn').scrollIntoViewIfNeeded();const r=await page.locator('#retryBtn').boundingBox();assert(r.y>=0&&r.y+r.height<=844);if(i===1)await page.screenshot({path:'test-results/result-mobile.png',fullPage:true});
 const pending=page.waitForEvent('download');await page.locator('#saveBtn').click();const download=await pending;assert.equal(await download.failure(),null);const image=PNG.sync.read(await readFile(await download.path()));assert.equal(image.width,1080);assert.equal(image.height,1350);const qr=jsQR(new Uint8ClampedArray(image.data),image.width,image.height);assert.equal(qr?.data,base);
 await page.locator('#shareBtn').click();const shares=await page.evaluate(()=>window.shares);assert.equal(shares.length,1);assert(shares[0].files[0].size>1000);assert.equal(shares[0].files[0].type,'image/png');
 await page.locator('#retryBtn').click();await page.clock.runFor(200);assert.equal(await page.locator('body').getAttribute('data-phase'),'world');assert.equal(await page.locator('#fairySpeech').evaluate(e=>getComputedStyle(e).display),'none');await enterRetry(page);assert.deepEqual(errors,[]);await page.close();
});
async function enterRetry(page){for(let i=0;i<10;i++){await page.locator('#lookRight').click();if(await page.locator('#fairySpeech').evaluate(e=>getComputedStyle(e).display==='block'))break;}await page.locator('#fairyOrb').click({force:true});await page.clock.runFor(2300);assert.equal(await page.locator('.option').count(),4);}
test('reduced motion and denied clipboard have usable fallbacks',async()=>{
 const {page,errors}=await open(390,{reduced:true,share:false});await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied')}}}));await enter(page);await answer(page,0);await page.locator('#fairyInfoNext').click();await page.clock.runFor(500);await page.locator('#gratitudeNext').click();await page.locator('#shareBtn').click();assert(await page.locator('#shareDialog').isVisible());assert.equal(await page.locator('#shareUrl').inputValue(),base);await page.locator('#closeShare').click();assert.deepEqual(errors,[]);await page.close();
});
test('gyro is opt-in, calibration does not reveal fairy, mute state works',async()=>{
 const {page,errors}=await open(390);await page.evaluate(()=>{window.DeviceOrientationEvent=class extends Event{static requestPermission(){return Promise.resolve('granted')}}});await page.locator('#startBtn').click();await page.locator('#gyroBtn').click();assert.equal(await page.locator('#gyroBtn').getAttribute('aria-pressed'),'true');await page.evaluate(()=>{const e=new Event('deviceorientation');e.gamma=30;window.dispatchEvent(e)});assert.equal(await page.locator('#fairySpeech').evaluate(e=>getComputedStyle(e).display),'none');await page.locator('#soundBtn').click();assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'),'true');await page.locator('#soundBtn').click();assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'),'false');assert.deepEqual(errors,[]);await page.close();
});
test('pointer stroke needs sustained movement and discovery works by dragging',async()=>{
 const {page,errors}=await open(390);await page.locator('#startBtn').click();
 for(let i=0;i<7;i++){await page.mouse.move(320,650);await page.mouse.down();await page.mouse.move(70,650,{steps:10});await page.mouse.up();if(await page.locator('#fairySpeech').evaluate(e=>getComputedStyle(e).display==='block'))break;}
 await page.locator('#fairyOrb').click({force:true});await page.clock.runFor(2300);
 for(let i=0;i<4;i++){await page.locator('.option').nth(0).click();await page.clock.runFor(900);}await page.clock.runFor(3500);
 const rect=await page.locator('#strokeFairy').boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();
 for(let i=0;i<10;i++)await page.mouse.move(rect.x+rect.width/2+(i%2?30:-30),rect.y+rect.height/2);
 assert.equal(await page.locator('body').getAttribute('data-phase'),'stroke');
 for(let i=0;i<40;i++){await page.clock.runFor(100);await page.mouse.move(rect.x+rect.width/2+(i%2?30:-30),rect.y+rect.height/2);}
 await page.mouse.up();await page.clock.runFor(1000);assert.equal(await page.locator('body').getAttribute('data-phase'),'profile');assert.deepEqual(errors,[]);await page.close();
});
