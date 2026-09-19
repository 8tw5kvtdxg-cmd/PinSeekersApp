import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import ts from 'typescript';

function route({refundFailure=false}={}) {
 const calls=[];
 const dependencies={
  'node:crypto':{timingSafeEqual},
  '@/lib/admin-auth':{isAdminRequestAuthenticated:async()=>true},
  '@/lib/refund-claims':{reconcileSquareRefunds:async()=>{calls.push('existing-refund-status');if(refundFailure)throw new Error('Provider unavailable');return {scanned:0,updated:0};}},
  '@/lib/refund-claim-email':{deliverPaymentIssueCommunications:async()=>{calls.push('claim-email-retries');return {scanned:1,delivered:2};}},
  '@/lib/privacy-request-email':{deliverPrivacyRequestEmails:async()=>0},
  '@/lib/participation-hold-email':{deliverParticipationHoldEmails:async()=>0},
  '@/lib/request-security':{rejectCrossSiteRequest:()=>null},
 };
 const code=ts.transpileModule(readFileSync(new URL('../app/api/cron/payment-reconciliation/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};new Function('require','exports','process','console',code)(name=>{assert.ok(name in dependencies,`Unexpected maintenance dependency: ${name}`);return dependencies[name];},exports,{env:{CRON_SECRET:'test-maintenance-secret'}},{error:()=>{}});
 return {calls,GET:exports.GET};
}
test('maintenance runs only existing refund updates and requested-claim communications, with no detector dependency',async()=>{
 const {GET,calls}=route();const response=await GET(new Request('https://pin2wingolf.com/api/cron/payment-reconciliation',{headers:{authorization:'Bearer test-maintenance-secret'}}));assert.equal(response.status,200);assert.deepEqual(calls,['existing-refund-status','claim-email-retries']);assert.equal('checkedCheckouts' in await response.json(),false);
});
test('provider status failure does not stop claim-email retries, and unauthorized requests do no work',async()=>{
 const {GET,calls}=route({refundFailure:true});assert.equal((await GET(new Request('https://pin2wingolf.com/api/cron/payment-reconciliation'))).status,401);assert.deepEqual(calls,[]);
 const response=await GET(new Request('https://pin2wingolf.com/api/cron/payment-reconciliation',{headers:{authorization:'Bearer test-maintenance-secret'}}));assert.equal(response.status,200);assert.deepEqual(calls,['existing-refund-status','claim-email-retries']);assert.equal((await response.json()).communications.delivered,2);
});
