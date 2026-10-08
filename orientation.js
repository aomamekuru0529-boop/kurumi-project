import { Euler, Quaternion, Vector3 } from 'three';
const rad=Math.PI/180;
// DeviceOrientation is an orientation in 3D, not three independent pan offsets.
export class SensorView {
  constructor(){this.euler=new Euler(0,0,0,'YXZ');this.device=new Quaternion();this.screen=new Quaternion();this.upright=new Quaternion().setFromAxisAngle(new Vector3(1,0,0),-Math.PI/2);this.axis=new Vector3(0,0,1);this.forward=new Vector3();}
  read({alpha,beta,gamma},screenAngle){return this.device.setFromEuler(this.euler.set(beta*rad,alpha*rad,-gamma*rad,'YXZ')).multiply(this.upright).multiply(this.screen.setFromAxisAngle(this.axis,-screenAngle*rad));}
  direction(sample,screenAngle){this.forward.set(0,0,-1).applyQuaternion(this.read(sample,screenAngle));return {yaw:Math.atan2(-this.forward.x,this.forward.z),pitch:Math.asin(Math.max(-1,Math.min(1,this.forward.y)))};}
  calibrate(sample,screenAngle,yaw,pitch){this.origin=this.direction(sample,screenAngle);this.view={yaw,pitch};}
  update(sample,screenAngle){const direction=this.direction(sample,screenAngle);const delta=Math.atan2(Math.sin(direction.yaw-this.origin.yaw),Math.cos(direction.yaw-this.origin.yaw));return {yaw:this.view.yaw+delta,pitch:this.view.pitch+direction.pitch-this.origin.pitch};}
}
