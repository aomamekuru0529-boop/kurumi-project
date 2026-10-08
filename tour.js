import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Tour as Panorama } from './panorama.js';

// A modeled village viewed from its snowy square. All scenery has real depth.
export class Tour {
  constructor(viewport,orb,onView){
    this.viewport=viewport;this.orb=orb;this.onView=onView;this.reduced=matchMedia('(prefers-reduced-motion: reduce)');this.yaw=0;this.pitch=0;
    try{this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}catch{return new Panorama(viewport,orb,onView);}
    this.canvas=this.renderer.domElement;this.canvas.className='tour-canvas';this.canvas.setAttribute('aria-hidden','true');this.canvas.dataset.scene='3d-village';viewport.prepend(this.canvas);viewport.append(orb);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#101c30');this.scene.fog=new THREE.FogExp2('#17283d',.012);
    this.camera=new THREE.PerspectiveCamera(2*Math.atan(.7)*180/Math.PI,1,.1,180);this.camera.position.set(0,2.8,0);
    this.materialCache=new Map();this.bulbMaterials=new Map();this.materials={snow:this.material('#c4d5df'),wood:this.material('#4e302b'),trim:this.material('#b49668'),roof:this.material('#272d3b'),pine:this.material('#173e35'),gold:this.material('#bba16a',.45,.6),light:new THREE.MeshBasicMaterial({color:'#ffe2a0',toneMapped:false})};
    this.scene.add(new THREE.HemisphereLight('#b0cbe6','#3c3b49',2));const moon=new THREE.DirectionalLight('#bcdcff',2.1);moon.position.set(-15,30,-10);moon.castShadow=true;moon.shadow.mapSize.set(1024,1024);Object.assign(moon.shadow.camera,{left:-24,right:24,top:24,bottom:-24,far:90});moon.shadow.normalBias=.08;this.scene.add(moon);
    this.build();this.batchScenery();this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.needsUpdate=true;this.hotspot=new THREE.Vector3(-Math.sin(1.15)*11,3.15,Math.cos(1.15)*11);
    new ResizeObserver(()=>this.render()).observe(viewport);
    let lastSnow=-Infinity,lastTick=0;
    const tick=t=>{
      const dt=Math.min(50,Math.max(1,t-lastTick));lastTick=t;
      if(document.body.dataset.phase==='world'&&!document.hidden){
        let moved=false;
        if(this.target){const dy=Math.atan2(Math.sin(this.target.yaw-this.yaw),Math.cos(this.target.yaw-this.yaw)),dp=this.target.pitch-this.pitch;
          const weight=1-Math.exp(-dt/28);this.yaw+=dy*weight;this.pitch+=dp*weight;moved=true;
          if(Math.abs(dy)+Math.abs(dp)<.00015){this.yaw=this.target.yaw;this.pitch=this.target.pitch;this.target=null;}
        }
        const snowing=!this.reduced.matches&&t-lastSnow>100;
        if(snowing){lastSnow=t;this.snow.rotation.y=t*.000008;}
        if(moved||snowing)this.render();
      }requestAnimationFrame(tick);
    };requestAnimationFrame(tick);
  }
  material(color,roughness=.85,metalness=0){const key=`${color}/${roughness}/${metalness}`;if(!this.materialCache.has(key))this.materialCache.set(key,roughness>=.8&&metalness===0?new THREE.MeshLambertMaterial({color}):new THREE.MeshStandardMaterial({color,roughness,metalness}));return this.materialCache.get(key);}
  mesh(geometry,material,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  box(parent,w,h,d,x,y,z,material){return this.mesh(new THREE.BoxGeometry(w,h,d),material,parent,x,y,z);}
  sphere(parent,r,x,y,z,material){return this.mesh(new THREE.SphereGeometry(r,12,8),material,parent,x,y,z);}
  cladding(color){
    const material=this.material(color).clone(),canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,512,512);
    for(let y=0;y<512;y+=32){ctx.fillStyle='#00000022';ctx.fillRect(0,y,512,2);ctx.fillStyle='#ffffff33';ctx.fillRect(0,y+2,512,1);for(let i=0;i<12;i++){ctx.fillStyle='#00000008';ctx.fillRect((i*71+y*5)%512,y+5+i%18,30+i*4,1);}}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;material.map=texture;return material;
  }
  text(text){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='#243d32';x.fillRect(0,0,512,128);x.strokeStyle='#c5a770';x.lineWidth=4;x.strokeRect(8,8,496,112);x.fillStyle='#f1ddb0';x.font='500 38px Georgia';x.textAlign='center';x.fillText(text,256,78);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:t,roughness:.8});}
  wire(parent,points,color='#304334',radius=.025){const curve=new THREE.CatmullRomCurve3(points);return this.mesh(new THREE.TubeGeometry(curve,32,radius,6,false),this.material(color),parent);}
  house(angle,distance,color,name){
    const g=new THREE.Group();g.position.set(-Math.sin(angle)*distance,0,Math.cos(angle)*distance);g.rotation.y=Math.PI-angle;g.userData.kind='house';this.scene.add(g);
    const wall=this.cladding(color),m=this.materials,w=7,h=4.6,d=5.8;
    this.box(g,w,h,d,0,h/2,0,wall);this.box(g,w+.3,.3,d+.3,0,.15,0,this.material('#72828e'));
    // Triangle gable extruded through the house, beneath two pitched roof slabs.
    const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,2.6);shape.closePath();const geom=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false});this.mesh(geom,wall,g,0,h,-d/2);
    for(const side of [-1,1]){const roof=this.box(g,4.9,.24,d+1,side*1.95,h+1.2,0,m.roof);roof.rotation.z=-side*.61;const snow=this.box(g,4.95,.18,d+1.04,side*1.95,h+1.37,0,m.snow);snow.rotation.z=-side*.61;}
    for(const xx of [-3.35,0,3.35])this.box(g,.16,h,.18,xx,h/2,d/2+.08,m.wood);
    for(const yy of [1.0,3.5,4.5])this.box(g,w,.13,.18,0,yy,d/2+.09,m.wood);
    const attic=this.mesh(new THREE.CylinderGeometry(.42,.42,.08,24),m.light,g,0,5.65,d/2+.06);attic.rotation.x=Math.PI/2;this.mesh(new THREE.TorusGeometry(.45,.075,8,24),m.trim,g,0,5.65,d/2+.13);this.box(g,.07,.85,.1,0,5.65,d/2+.2,m.wood);this.box(g,.85,.07,.1,0,5.65,d/2+.2,m.wood);
    this.box(g,.8,1.7,.9,2.1,6.5,-1,m.wood);this.box(g,1.02,.18,1.05,2.1,7.4,-1,m.snow);
    const window=(x,y,z,side=false)=>{const group=new THREE.Group();group.position.set(x,y,z);if(side)group.rotation.y=Math.PI/2;g.add(group);this.box(group,1.5,1.9,.14,0,0,0,m.trim);this.box(group,1.24,1.64,.16,0,0,.06,m.light);this.box(group,.07,1.7,.2,0,0,.15,m.wood);this.box(group,1.28,.07,.2,0,0,.15,m.wood);this.box(group,1.7,.15,.35,0,-1,.16,m.snow);for(const s of [-1,1])this.box(group,.23,1.6,.1,s*.48,0,.17,this.material('#b27c65'));};
    window(-2,2.4,d/2+.12);window(2,2.4,d/2+.12);window(w/2+.1,2.3,1,true);window(w/2+.1,2.3,-1.4,true);
    this.box(g,1.35,2.7,.22,0,1.5,d/2+.18,this.material('#243e35'));this.sphere(g,.065,.45,1.5,d/2+.32,m.gold);
    const wreath=this.mesh(new THREE.TorusGeometry(.36,.1,8,24),m.pine,g,0,2.1,d/2+.36);for(let i=0;i<7;i++)this.sphere(g,.055,Math.sin(i)*.34,2.1+Math.cos(i)*.34,d/2+.47,this.material('#a8313c'));
    this.box(g,1.8,.25,.9,0,.15,d/2+.55,m.snow);this.box(g,2.9,.62,.15,0,3.85,d/2+.2,this.text(name));
    // Warm festive festoons follow the eaves, rather than floating in the sky.
    const points=[];for(let i=0;i<=24;i++){const xx=-3.7+i*7.4/24,yy=4.45-Math.sin(i/24*Math.PI)*.42;points.push(new THREE.Vector3(xx,yy,3.48));if(i%2===0){const colors=['#ffc574','#e16b67','#91baa2'];const color=colors[(i/2)%3];if(!this.bulbMaterials.has(color))this.bulbMaterials.set(color,new THREE.MeshBasicMaterial({color,toneMapped:false}));const bulb=this.bulbMaterials.get(color);this.sphere(g,.065,xx,yy-.1,3.48,bulb);}}
    this.wire(g,points);
    const glow=new THREE.PointLight('#ffb85b',22,13,2);glow.position.set(0,2,5);g.add(glow);
    for(const xx of [-3.8,3.8]){this.sphere(g,1.1,xx,.15,3.5,m.snow).scale.set(1,.35,1);}
    return g;
  }
  tree(angle,r,height){const group=new THREE.Group();group.position.set(-Math.sin(angle)*r,0,Math.cos(angle)*r);group.userData.kind='distant-tree';this.scene.add(group);const m=this.materials;this.mesh(new THREE.CylinderGeometry(.16,.23,1.7,7),m.wood,group,0,.7,0);for(let i=0;i<4;i++){const y=height*(.27+i*.19),size=height*(.29-i*.045);this.mesh(new THREE.ConeGeometry(size,height*.48,10),m.pine,group,0,y,0);this.mesh(new THREE.ConeGeometry(size*.8,height*.35,10),m.snow,group,0,y+height*.09,0);}}
  lantern(angle,r){const g=new THREE.Group();g.position.set(-Math.sin(angle)*r,0,Math.cos(angle)*r);this.scene.add(g);const m=this.materials;this.mesh(new THREE.CylinderGeometry(.06,.1,3.2,8),m.wood,g,0,1.6,0);this.box(g,.5,.7,.5,0,3.2,0,m.light);this.mesh(new THREE.ConeGeometry(.45,.25,4),m.roof,g,0,3.7,0);this.mesh(new THREE.ConeGeometry(.45,.1,4),m.snow,g,0,3.82,0);for(const xx of [-.25,.25])for(const zz of [-.25,.25])this.box(g,.04,.75,.04,xx,3.2,zz,m.wood);}
  gift(parent,x,z,color,size=.6){const m=this.materials;this.box(parent,size,size,size,x,size/2,z,this.material(color));this.box(parent,size*.18,size+.02,size+.03,x,size/2,z,m.gold);this.box(parent,size+.03,.12,size+.03,x,size*.65,z,m.gold);for(const side of [-1,1]){const bow=this.mesh(new THREE.TorusGeometry(size*.16,.04,6,12),m.gold,parent,x+side*size*.12,size+.06,z);bow.rotation.x=Math.PI/2;}}
  build(){const m=this.materials;
    const ground=this.mesh(new THREE.PlaneGeometry(180,180,24,24).rotateX(-Math.PI/2),m.snow,this.scene);ground.receiveShadow=true;ground.castShadow=false;
    // A recessed cobbled square gives the near houses a believable scale.
    const plaza=this.mesh(new THREE.PlaneGeometry(13,13,12,12).rotateX(-Math.PI/2),this.material('#637984'),this.scene,0,.015,0);plaza.castShadow=false;
    const stones=new THREE.InstancedMesh(new THREE.BoxGeometry(.52,.03,.38),this.material('#9baeb4'),500);const dummy=new THREE.Object3D();let n=0;for(let z=-6.5;z<6.5;z+=.5)for(let x=-6.5;x<6.5;x+=.66){if(Math.hypot(x,z)>6.5||n>=500)continue;dummy.position.set(x+(Math.round(z*2)%2)*.22,.04,z);dummy.updateMatrix();stones.setMatrixAt(n++,dummy.matrix);}stones.count=n;stones.instanceMatrix.needsUpdate=true;stones.receiveShadow=true;this.scene.add(stones);
    this.workshopAngle=1.15;this.workshopDistance=31;this.house(this.workshopAngle,this.workshopDistance,'#395448','ありがとう工房');
    this.house(0,14,'#7a4844','NOEL • BAKERY');this.house(1.5,14,'#53665c','GIFT ATELIER');this.house(3,15,'#695775','WINTER HOUSE');this.house(4.6,14,'#496172','CHRISTMAS POST');
    for(let i=0;i<65;i++)this.tree(i/65*Math.PI*2,32+(i%5)*3,5+(i%4)*1.1);
    for(const a of [-.8,.55,1.95,2.65,3.65,5.35])this.lantern(a,8.8);
    // Wrapped presents, ribbons and red berry planters enliven the nearby porches.
    for(let i=0;i<10;i++){const a=1.5+(i%3-.8)*.09;this.gift(this.scene,-Math.sin(a)*(9.8+i%2),Math.cos(a)*(9.8+i%2),['#963d48','#365d4a','#bc9761'][i%3],.45+i%3*.18);}
    for(let i=0;i<4;i++)this.gift(this.scene,1.2+i*.45,9.4+(i%2)*.7,['#8f3345','#285745','#ad8353','#563f65'][i],.5+i%2*.18);
    const snowman=new THREE.Group();snowman.position.set(-3.4,0,10.5);this.scene.add(snowman);
    this.sphere(snowman,.58,0,.55,0,m.snow);this.sphere(snowman,.43,0,1.3,0,m.snow);this.sphere(snowman,.3,0,1.95,0,m.snow);
    const red=this.material('#a53543'),coal=this.material('#232c2e');this.mesh(new THREE.CylinderGeometry(.43,.43,.14,16),red,snowman,0,1.62,0);this.box(snowman,.16,.5,.08,.21,1.37,-.38,red);
    for(const xx of [-.1,.1])this.sphere(snowman,.037,xx,2.01,-.28,coal);for(const yy of [1.15,1.35,1.52])this.sphere(snowman,.04,0,yy,-.4,coal);
    const carrot=this.mesh(new THREE.ConeGeometry(.065,.28,8),this.material('#d5853f'),snowman,0,1.91,-.35);carrot.rotation.x=-Math.PI/2;
    this.mesh(new THREE.ConeGeometry(.32,.5,16),red,snowman,0,2.42,0);this.mesh(new THREE.CylinderGeometry(.33,.33,.12,16),m.snow,snowman,0,2.18,0);this.sphere(snowman,.09,0,2.67,0,m.snow);
    const moon=this.mesh(new THREE.SphereGeometry(2.2,24,16),new THREE.MeshBasicMaterial({color:'#ede8c9'}),this.scene,-32,34,-45);moon.castShadow=false;
    let seed=42;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const stars=[];for(let i=0;i<750;i++){const a=random()*Math.PI*2,y=12+random()*65,r=70;stars.push(-Math.sin(a)*r,y,Math.cos(a)*r);}const starGeom=new THREE.BufferGeometry();starGeom.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));this.scene.add(new THREE.Points(starGeom,new THREE.PointsMaterial({color:'#ddd8c1',size:.09,sizeAttenuation:true})));
    const snow=[];for(let i=0;i<320;i++)snow.push((random()-.5)*46,1+random()*17,(random()-.5)*46);const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(snow,3));this.snow=new THREE.Points(sg,new THREE.PointsMaterial({color:'#dbe7ef',size:.045,transparent:true,opacity:.65}));this.scene.add(this.snow);
    // Large snow banks beyond the square soften the edge of the forest.
    for(let i=0;i<15;i++){const a=i/15*Math.PI*2;this.sphere(this.scene,5,-Math.sin(a)*28,-2.8,Math.cos(a)*28,m.snow).scale.y=.7;}
  }
  batchScenery(){
    this.scene.updateMatrixWorld(true);const groups=new Map(),old=[];
    this.scene.traverse(obj=>{if(!obj.isMesh||obj.isInstancedMesh)return;const pos=new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld),sector=Math.hypot(pos.x,pos.z)<8?'center':Math.floor((Math.atan2(pos.x,pos.z)+Math.PI)/(Math.PI/4));const key=`${obj.material.uuid}/${obj.castShadow}/${obj.receiveShadow}/${sector}`;if(!groups.has(key))groups.set(key,{material:obj.material,cast:obj.castShadow,receive:obj.receiveShadow,geometries:[]});const geometry=(obj.geometry.index?obj.geometry.toNonIndexed():obj.geometry.clone()).applyMatrix4(obj.matrixWorld);groups.get(key).geometries.push(geometry);old.push(obj);});
    for(const mesh of old)mesh.removeFromParent();for(const group of groups.values()){const geometry=mergeGeometries(group.geometries);const mesh=new THREE.Mesh(geometry,group.material);mesh.castShadow=group.cast;mesh.receiveShadow=group.receive;this.scene.add(mesh);for(const g of group.geometries)g.dispose();}
  }
  resetJourney(){this.target=null;this.journey=null;this.camera.position.set(0,2.8,0);this.hotspot.set(-Math.sin(1.15)*11,3.15,Math.cos(1.15)*11);this.orb.style.scale='';this.orb.classList.remove('following');}
  beginJourney(){this.target=null;this.journey={yaw:this.yaw,pitch:this.pitch};this.orb.classList.add('following');}
  follow(progress){
    const ease=x=>x*x*(3-2*x),move=ease(Math.max(0,Math.min(1,(progress-.12)/.88)));
    const angle=this.workshopAngle,dx=-Math.sin(angle),dz=Math.cos(angle);
    const bend=Math.sin(move*Math.PI)*1.1;
    this.camera.position.set(dx*22*move+dz*bend,2.8,dz*22*move-dx*bend);
    const fairyDistance=11+16*move;
    this.hotspot.set(dx*fairyDistance+dz*bend*.55,3.15+Math.sin(move*Math.PI*3)*.3-1.2*move**5,dz*fairyDistance-dx*bend*.55);
    const offset=this.hotspot.clone().sub(this.camera.position),targetYaw=Math.atan2(-offset.x,offset.z),targetPitch=Math.atan2(offset.y,Math.hypot(offset.x,offset.z));
    const turn=ease(Math.min(1,progress/.16));this.yaw=this.journey.yaw+Math.atan2(Math.sin(targetYaw-this.journey.yaw),Math.cos(targetYaw-this.journey.yaw))*turn;this.pitch=this.journey.pitch+(targetPitch-this.journey.pitch)*turn;
    this.orb.style.scale=String(1-.35*move);this.canvas.dataset.journey=String(progress);this.canvas.dataset.cameraDistance=String(22*move);this.render();
  }
  set(yaw,pitch=this.pitch,{smooth=false}={}){pitch=Math.max(-Math.PI*.499,Math.min(Math.PI*.499,pitch));if(smooth){this.target={yaw,pitch};return;}this.target=null;this.yaw=yaw;this.pitch=pitch;this.render();}
  render(){const w=this.viewport.clientWidth,h=this.viewport.clientHeight;if(!w||!h)return;if(this.width!==w||this.height!==h){this.width=w;this.height=h;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
    this.camera.lookAt(this.camera.position.x-Math.sin(this.yaw)*Math.cos(this.pitch),this.camera.position.y+Math.sin(this.pitch),this.camera.position.z+Math.cos(this.yaw)*Math.cos(this.pitch));this.camera.updateMatrixWorld();this.renderer.render(this.scene,this.camera);this.lastDraw=performance.now();
    const p=this.hotspot.clone().project(this.camera),visible=p.z<1&&p.z>-1;const x=visible?(p.x+1)*w/2:w+200,y=(1-p.y)*h/2;this.orb.style.left=`${x-31}px`;this.orb.style.top=`${y-31}px`;this.orb.style.visibility=visible&&x>-100&&x<w+100&&y>-100&&y<h+100?'visible':'hidden';this.onView?.();
  }
}
