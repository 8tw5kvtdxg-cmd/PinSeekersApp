import assert from 'node:assert/strict';
import test from 'node:test';
import { flagPaymentAlert, flagPaymentWithoutEntry, resolvePaymentAlert } from './system-payment-alerts.ts';
import { customerManagedClaimWhere, automaticClaimHistoryWhere, refundNotificationEventWhere } from './refund-claim-source.ts';

function fixture({status='Succeeded',refundStatus='None',entry=null}={}) {
  const alerts=new Map();
  const db={
    squareCheckout:{findUnique:async()=>({id:'checkout-1',status,refundStatus})},
    clubhouseEntryRecord:{findUnique:async()=>entry},
    paymentReconciliationIssue:{
      upsert:async({where,create,update})=>{const record=alerts.has(where.key)?{...alerts.get(where.key),...update}:create;alerts.set(where.key,record);return record;},
      updateMany:async({where,data})=>{const record=alerts.get(where.key);if(!record || record.status!==where.status)return {count:0};alerts.set(where.key,{...record,...data});return {count:1};},
    },
    get paymentIssueClaim(){throw new Error('Automatic checks must never access refund claims');},
    get paymentIssueEvent(){throw new Error('Automatic checks must never create claim notices');},
    get squareRefundAttempt(){throw new Error('Automatic checks must never issue refunds');},
  };
  return {db,alerts};
}
const issue={checkoutId:'checkout-1',issueCode:'challenge-hold-unused',reason:'Other payment issue',action:'Challenge hold may affect unused paid entry',narrative:'Review unused paid entry; no refund is automatic.'};
test('closed challenge detection creates one internal alert, without customer claim or notice',async()=>{
  const {db,alerts}=fixture();await flagPaymentAlert(db,issue);await flagPaymentAlert(db,issue);
  assert.equal(alerts.size,1);assert.equal([...alerts.values()][0].customerEmail,null);assert.equal([...alerts.values()][0].status,'Open');
});
test('missing paid entry is an internal alert and recovery resolves only that alert',async()=>{
  const {db,alerts}=fixture();await flagPaymentWithoutEntry(db,'checkout-1');assert.equal(alerts.size,1);
  await resolvePaymentAlert(db,'checkout-1','paid-without-entry');assert.equal([...alerts.values()][0].status,'Resolved');
  await flagPaymentWithoutEntry(db,'checkout-1');assert.equal(alerts.size,1);assert.equal([...alerts.values()][0].status,'Open');
});
test('unpaid, already refunding, and recovered entries do not produce new alerts',async()=>{
  for(const setup of [{status:'Pending'},{status:'Failed'},{refundStatus:'Refund Requested'},{refundStatus:'Refund Pending'},{refundStatus:'Refunded'}]){const {db,alerts}=fixture(setup);await flagPaymentAlert(db,issue);assert.equal(alerts.size,0);}
  const {db,alerts}=fixture({entry:{id:'entry-1'}});await flagPaymentWithoutEntry(db,'checkout-1');assert.equal(alerts.size,0);
});

// Evaluate the subset of Prisma predicates used by the source policy against
// historical fixtures, so real submissions/refund updates cannot be hidden.
function matches(record,where) {
  return Object.entries(where).every(([key,value])=>{
    if(key==='OR')return value.some(v=>matches(record,v));
    if(key==='AND')return value.every(v=>matches(record,v));
    if(key==='NOT')return !matches(record,value);
    const field=record?.[key]??null;
    if(value===null || typeof value!=='object')return field===value;
    if('not' in value)return field!==value.not;
    if('isNot' in value)return field!==value.isNot;
    if('some' in value)return Array.isArray(field)&&field.some(v=>matches(v,value.some));
    if('in' in value)return value.in.includes(field);
    if('startsWith' in value)return typeof field==='string'&&field.startsWith(value.startsWith);
    return matches(field,value);
  });
}
const legacy={systemIssueKey:'challenge-hold-unused:checkout-1',status:'Open',events:[{actorId:'system'}],evidenceFiles:[],refund:null,assignedTo:null};
test('only untouched automatic records leave the main claim queue; history stays accessible',()=>{
  assert.equal(matches(legacy,customerManagedClaimWhere),false);assert.equal(matches(legacy,automaticClaimHistoryWhere),true);
  for(const record of [{...legacy,systemIssueKey:null},{...legacy,events:[{actorId:'customer'}]},{...legacy,events:[{actorId:'admin'}]},{...legacy,refund:{providerStatus:'PENDING'}},{...legacy,status:'Approved'},{...legacy,evidenceFiles:[{id:'customer-file'}]}]){
    assert.equal(matches(record,customerManagedClaimWhere),true);assert.equal(matches(record,automaticClaimHistoryWhere),false);
  }
});
test('suppress old detection emails but retain customer submissions and actual refund status notices',()=>{
  assert.equal(matches({claim:legacy,actorId:'system',action:'Paid without entry detected'},refundNotificationEventWhere),false);
  const reviewed={...legacy,events:[{actorId:'admin'}]};
  assert.equal(matches({claim:reviewed,actorId:'system',action:'Issue signal cleared'},refundNotificationEventWhere),false);
  for(const event of [{claim:{...legacy,systemIssueKey:null},actorId:'customer',action:'Submitted'},{claim:reviewed,actorId:'admin',action:'Approved'},{claim:{...legacy,refund:{providerStatus:'COMPLETED'}},actorId:'system',action:'Square refund COMPLETED'}])assert.equal(matches(event,refundNotificationEventWhere),true);
});
