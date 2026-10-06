// Equirectangular panorama projected onto a sphere, with DOM hotspots in the same camera.
export class Tour {
  constructor(viewport,orb,onView){
    this.viewport=viewport;this.orb=orb;this.yaw=0;this.pitch=0;this.onView=onView;
    this.canvas=document.createElement('canvas');this.canvas.className='tour-canvas';this.canvas.setAttribute('aria-hidden','true');viewport.prepend(this.canvas);viewport.append(orb);
    const gl=this.canvas.getContext('webgl',{alpha:false,antialias:false});this.gl=gl;
    if(gl){
      const shader=(kind,source)=>{const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
      const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=p;gl_Position=vec4(p,0.,1.);}'));
      gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec2 uv;uniform sampler2D panorama;uniform float yaw,pitch,aspect;void main(){vec3 d=normalize(vec3(uv.x*aspect*.7,uv.y*.7,1.));float cp=cos(pitch),sp=sin(pitch);d=vec3(d.x,d.y*cp+d.z*sp,d.z*cp-d.y*sp);float cy=cos(yaw),sy=sin(yaw);d=vec3(d.x*cy+d.z*sy,d.y,d.z*cy-d.x*sy);vec2 st=vec2(fract(atan(d.x,d.z)/6.2831853+.5),.5-asin(d.y)/3.1415927);gl_FragColor=texture2D(panorama,st);}`));gl.linkProgram(program);gl.useProgram(program);
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
      const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,this.art());this.uniforms=Object.fromEntries(['yaw','pitch','aspect'].map(k=>[k,gl.getUniformLocation(program,k)]));
    }else{this.context=this.canvas.getContext('2d');const art=this.art();this.pixels=art.getContext('2d').getImageData(0,0,art.width,art.height);}
    new ResizeObserver(()=>this.render()).observe(viewport);
  }
  art(){
    const c=document.createElement('canvas');c.width=4096;c.height=2048;const x=c.getContext('2d');
    const sky=x.createLinearGradient(0,0,0,2048);sky.addColorStop(0,'#030913');sky.addColorStop(.48,'#182b40');sky.addColorStop(.53,'#71818b');sky.addColorStop(.56,'#dce5e8');sky.addColorStop(1,'#8cabbc');x.fillStyle=sky;x.fillRect(0,0,4096,2048);
    for(let i=0;i<700;i++){x.fillStyle=`rgba(240,233,211,${.2+i%5*.12})`;x.beginPath();x.arc(i*173%4096,90+i*83%870,i%7===0?2:1,0,7);x.fill();}
    x.fillStyle='#b9c5cb';x.beginPath();x.moveTo(0,1100);for(let i=0;i<=4096;i+=64)x.lineTo(i,990+Math.sin(i*.009)*42+Math.sin(i*.017)*25);x.lineTo(4096,1230);x.lineTo(0,1230);x.fill();
    const tree=(a,b,size)=>{x.fillStyle='#112c28';x.fillRect(a-5,b,10,size*.25);for(let n=0;n<3;n++){const y=b-size+n*size*.23,w=size*(.21+n*.06);x.beginPath();x.moveTo(a,y);x.lineTo(a-w,y+size*.55);x.lineTo(a+w,y+size*.55);x.fill();x.fillStyle='#d5e1dd';x.beginPath();x.moveTo(a,y);x.lineTo(a-w*.45,y+size*.22);x.lineTo(a+w*.45,y+size*.22);x.fill();x.fillStyle='#112c28';}};
    for(let i=0;i<36;i++)tree((i*233)%4096,1120+(i%3)*50,140+(i%4)*35);
    const house=(a,b,w,color)=>{x.fillStyle=color;x.fillRect(a,b,w,w*.7);x.fillStyle='#33262a';x.beginPath();x.moveTo(a-16,b);x.lineTo(a+w*.5,b-w*.45);x.lineTo(a+w+16,b);x.fill();x.strokeStyle='#e7e9dc';x.lineWidth=9;x.beginPath();x.moveTo(a-16,b);x.lineTo(a+w*.5,b-w*.45);x.lineTo(a+w+16,b);x.stroke();x.fillStyle='#f0c57a';x.shadowColor='#eec270';x.shadowBlur=20;for(let j=0;j<3;j++)x.fillRect(a+18+j*w*.28,b+22,w*.12,w*.18);x.shadowBlur=0;x.fillStyle='#231d21';x.fillRect(a+w*.45,b+w*.35,w*.18,w*.35);};
    house(440,1050,180,'#67474d');house(690,1070,150,'#5d5849');house(3120,1040,200,'#5a4540');house(3430,1080,170,'#3d514b');
    tree(2048,1290,500);x.fillStyle='#edc97b';x.font='60px serif';x.textAlign='center';x.fillText('✦',2048,797);for(let i=0;i<40;i++){const y=860+i*9,w=(y-795)*.3;x.beginPath();x.arc(2048+Math.sin(i*2.4)*w,y,4,0,7);x.shadowBlur=12;x.shadowColor='#ffe49a';x.fill();}x.shadowBlur=0;
    // Snow paths curve around the complete panorama; both edges match.
    x.strokeStyle='#e6ecec55';x.lineWidth=100;x.beginPath();x.moveTo(0,1640);x.bezierCurveTo(1000,1450,2400,1390,4096,1640);x.stroke();
    return c;
  }
  set(yaw,pitch=this.pitch){this.yaw=yaw;this.pitch=Math.max(-Math.PI*.47,Math.min(Math.PI*.47,pitch));this.render();}
  render(){
    const w=this.viewport.clientWidth,h=this.viewport.clientHeight;if(!w||!h)return;
    if(this.gl){const d=Math.min(devicePixelRatio||1,1.5);const rw=Math.round(w*d),rh=Math.round(h*d);if(this.canvas.width!==rw||this.canvas.height!==rh){this.canvas.width=rw;this.canvas.height=rh;}const g=this.gl;g.viewport(0,0,this.canvas.width,this.canvas.height);g.uniform1f(this.uniforms.yaw,this.yaw);g.uniform1f(this.uniforms.pitch,this.pitch);g.uniform1f(this.uniforms.aspect,w/h);g.drawArrays(g.TRIANGLES,0,6);}
    if(this.context){
      const rw=240,rh=Math.round(240*h/w);this.canvas.width=rw;this.canvas.height=rh;const frame=this.context.createImageData(rw,rh),src=this.pixels;
      const cp=Math.cos(this.pitch),sp=Math.sin(this.pitch),cy=Math.cos(this.yaw),sy=Math.sin(this.yaw);
      for(let j=0;j<rh;j++)for(let i=0;i<rw;i++){
        const vx=(2*(i+.5)/rw-1)*w/h*.7,vy=(1-2*(j+.5)/rh)*.7,l=Math.hypot(vx,vy,1);
        const px=vx/l,py=(vy*cp+sp)/l,pz=(cp-vy*sp)/l;
        const u=((Math.atan2(px*cy+pz*sy,pz*cy-px*sy)/(2*Math.PI)+.5)%1+1)%1,v=.5-Math.asin(py)/Math.PI;
        const from=(Math.min(src.height-1,Math.floor(v*src.height))*src.width+Math.floor(u*src.width))*4,to=(j*rw+i)*4;
        frame.data[to]=src.data[from];frame.data[to+1]=src.data[from+1];frame.data[to+2]=src.data[from+2];frame.data[to+3]=255;
      }this.context.putImageData(frame,0,0);
    }
    const delta=1.15-this.yaw;const dx=Math.sin(delta),z=Math.cos(delta),y=.03;const cy=Math.cos(this.pitch),sy=Math.sin(this.pitch),vy=y*cy-z*sy,vz=z*cy+y*sy;
    const visible=vz>0;const px=visible?w/2+dx/vz*h/1.4:w+200,py=visible?h/2-vy/vz*h/1.4:h/2;
    this.orb.style.left=`${px-31}px`;this.orb.style.top=`${py-31}px`;this.orb.style.visibility=visible&&px>-100&&px<w+100&&py>-100&&py<h+100?'visible':'hidden';this.onView?.();
  }
}
