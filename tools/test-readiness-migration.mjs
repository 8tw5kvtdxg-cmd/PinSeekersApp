// Exercises migration of historical records in an isolated local database.
import { Client } from 'pg';
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
(async()=>{
 const control=new Client({connectionString:'postgresql://pin2win_test@127.0.0.1:55439/postgres'});await control.connect();
 const name='pin2win_migration_'+Date.now();await control.query(`CREATE DATABASE "${name}"`);await control.end();
 const db=new Client({connectionString:`postgresql://pin2win_test@127.0.0.1:55439/${name}`});await db.connect();
 try {
  await db.query("SET TIME ZONE 'UTC'");
  const migrations=readdirSync('prisma/migrations').filter(n=>n!=='migration_lock.toml').sort();const latest='20260919000000_business_readiness';
  for(const migration of migrations.filter(n=>n!==latest))await db.query(readFileSync(`prisma/migrations/${migration}/migration.sql`,'utf8'));
  await db.query(`INSERT INTO "User" (id,name,username,email,"passwordHash","emailVerifiedAt","updatedAt") VALUES ('unproven','Unproven','unproven','unproven@example.com','disabled',NOW(),NOW()),('proven','Proven','proven','proven@example.com','disabled',NOW(),NOW());
  INSERT INTO "EmailVerificationToken" (id,"userId",email,"tokenHash","expiresAt","usedAt") VALUES ('proof','proven','proven@example.com','test-hash',NOW()+interval '1 hour',NOW());
  INSERT INTO "Location" (id,name,slug,"bookingUrl","isActive","updatedAt") VALUES ('existing','Owner edited venue','alamo-golf-den','https://changed.example/booking',false,NOW());
  INSERT INTO "ClubhouseChallengeSetting" (id,"challengeSlug","salesState","updatedAt") VALUES ('open','open','Open',NOW()),('paused','paused','Paused',NOW());`);
  await db.query(readFileSync(`prisma/migrations/${latest}/migration.sql`,'utf8'));
  const users=(await db.query('SELECT id,"emailVerifiedAt" FROM "User"')).rows;assert.equal(users.find(u=>u.id==='unproven').emailVerifiedAt,null);assert.ok(users.find(u=>u.id==='proven').emailVerifiedAt);
  const venue=(await db.query('SELECT * FROM "Location" WHERE slug=\'alamo-golf-den\'')).rows;assert.equal(venue.length,1);assert.equal(venue[0].name,'Owner edited venue');assert.equal(venue[0].isActive,false);assert.equal(venue[0].bookingUrl,'https://changed.example/booking');
  const settings=(await db.query('SELECT "challengeSlug","salesState","rehearsalCompleted" FROM "ClubhouseChallengeSetting"')).rows;assert.equal(settings.find(s=>s.challengeSlug==='open').salesState,'Draft');assert.equal(settings.find(s=>s.challengeSlug==='paused').salesState,'Paused');assert.ok(settings.every(s=>!s.rehearsalCompleted));
  assert.equal((await db.query('SELECT count(*)::int n FROM "ClubhouseChallengeBay"')).rows[0].n,0);
  console.log('PASS historical migration: unproven verification cleared, proven verification retained, owner venue changes/inactive status preserved, Open becomes Draft, Paused remains Paused, no fabricated bay or rehearsal approvals.');
 }finally{await db.end();}
})().catch(e=>{console.error(e);process.exitCode=1});
