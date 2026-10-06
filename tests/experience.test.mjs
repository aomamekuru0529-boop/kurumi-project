import test from 'node:test';
import assert from 'node:assert/strict';
import { resultIndex, shareUrl } from '../experience.js';
test('each fairy and tie-break scoring',()=>{
 for(let i=0;i<4;i++)assert.equal(resultIndex([i,i,i,i]),i);
 assert.equal(resultIndex([0,1,0,1]),1);
 assert.equal(resultIndex([0,0,1,2]),0);
 assert.equal(resultIndex([0,1,2,3]),3);
 assert.throws(()=>resultIndex([]));assert.throws(()=>resultIndex([4]));
});
test('share URL removes session query and fragment, respects configured URL',()=>{
 assert.equal(shareUrl('', 'https://example.com/christmas/?private=123#card'),'https://example.com/christmas/');
 assert.equal(shareUrl('https://example.com/?campaign=x','http://localhost/'),'https://example.com/?campaign=x');
 assert.throws(()=>shareUrl('javascript:alert(1)','http://localhost/'));
});
