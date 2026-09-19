import assert from 'node:assert/strict';
import test from 'node:test';
import { claimNotificationMessages, deliverClaimEvent } from './refund-claim-notifications.ts';
const event={id:'event-1',action:'Submitted',note:'Private staff note',customerMessage:null,meta:null,deliveries:[],claim:{id:'claim-1',checkoutId:'checkout-1',playerEmail:'customer@example.com',reason:'Technical failure',status:'Open',venueName:'Test venue',incidentAt:new Date('2026-09-19T12:00:00Z'),narrative:'The simulator stopped before I could take my shots.',evidenceReference:'Receipt screenshot',lateSubmissionFlag:false}};
test('customer acknowledgement and staff review email include submitted information and proper destinations',()=>{
 const messages=claimNotificationMessages(event,'https://pin2wingolf.com',['owner@example.com','reviewer@example.com']);
 assert.deepEqual(messages.Customer.to,['customer@example.com']);assert.deepEqual(messages.Staff.to,['owner@example.com','reviewer@example.com']);
 for(const message of Object.values(messages)){assert.match(message.text,/Technical failure/);assert.match(message.text,/Test venue/);assert.match(message.text,/simulator stopped/);assert.match(message.text,/Receipt screenshot/);}
 assert.match(messages.Customer.text,/Submission does not guarantee a refund/);assert.ok(!messages.Customer.text.includes('Private staff note'));assert.match(messages.Staff.text,/Private staff note/);assert.match(messages.Staff.text,/\/admin\/refunds/);
});
test('failed customer delivery cannot block staff; retry does not resend delivered staff email',async()=>{
 const sent=[],recorded=[];
 const first=await deliverClaimEvent({event,baseUrl:'https://pin2wingolf.com',staffEmails:['staff@example.com'],send:async email=>{sent.push(email);if(email.to.includes('customer@example.com'))throw new Error('Delivery failed');},recordDelivery:async audience=>recorded.push(audience)});
 assert.deepEqual(first,{delivered:1,failed:['Customer']});assert.deepEqual(recorded,['Staff']);assert.equal(sent.length,2);
 const retried=[];const second=await deliverClaimEvent({event:{...event,deliveries:[{audience:'Staff'}]},baseUrl:'https://pin2wingolf.com',staffEmails:['staff@example.com'],send:async email=>retried.push(email),recordDelivery:async()=>{}});
 assert.equal(second.delivered,1);assert.equal(retried.length,1);assert.equal(retried[0].idempotencyKey,sent[0].idempotencyKey);
});
test('failed staff delivery is independently retried while acknowledged customer is skipped',async()=>{
 const result=await deliverClaimEvent({event,baseUrl:'https://pin2wingolf.com',staffEmails:['staff@example.com'],send:async email=>{if(email.to.includes('staff@example.com'))throw new Error('Delivery failed');},recordDelivery:async()=>{}});
 assert.deepEqual(result,{delivered:1,failed:['Staff']});
 const sent=[];await deliverClaimEvent({event:{...event,deliveries:[{audience:'Customer'}]},baseUrl:'https://pin2wingolf.com',staffEmails:['staff@example.com'],send:async email=>sent.push(email),recordDelivery:async()=>{}});assert.equal(sent.length,1);assert.deepEqual(sent[0].to,['staff@example.com']);
});
