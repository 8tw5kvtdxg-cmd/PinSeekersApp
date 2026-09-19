import assert from "node:assert/strict";
import test from "node:test";
import { customerManagedClaimWhere, automaticClaimHistoryWhere, refundNotificationEventWhere } from "./refund-claim-source.ts";

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
