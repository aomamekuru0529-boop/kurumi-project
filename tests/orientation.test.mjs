import test from 'node:test';
import assert from 'node:assert/strict';
import { SensorView } from '../orientation.js';
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('upright device turns match heading one for one and wrap without a jump',()=>{
 const s=new SensorView();s.calibrate({alpha:359,beta:90,gamma:0},0,.4,.1);
 const v=s.update({alpha:1,beta:90,gamma:0},0);near(v.yaw,.4-2*Math.PI/180);near(v.pitch,.1);
 s.calibrate({alpha:0,beta:90,gamma:0},0,0,0);near(s.update({alpha:90,beta:90,gamma:0},0).yaw,-Math.PI/2);near(s.update({alpha:360,beta:90,gamma:0},0).yaw,0);
});
test('pitch follows a physical tilt and equivalent Euler poses preserve the same heading',()=>{
 const s=new SensorView();s.calibrate({alpha:0,beta:90,gamma:0},0,0,0);near(s.update({alpha:0,beta:120,gamma:0},0).pitch,Math.PI/6);const rolled=s.update({alpha:-45,beta:90,gamma:45},0);near(rolled.yaw,0);near(rolled.pitch,0);
});
test('landscape calibration preserves the current view without snapping',()=>{
 const s=new SensorView();const sample={alpha:130,beta:52,gamma:-70};s.calibrate(sample,90,1.2,.3);const v=s.update(sample,90);near(v.yaw,1.2);near(v.pitch,.3);
});
