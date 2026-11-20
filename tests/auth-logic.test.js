import test from 'node:test';
import assert from 'node:assert/strict';
import {initialsFor,authErrorMessage} from '../src/auth-logic.js';

test('initials come from the first two display-name words',()=>{
 assert.equal(initialsFor({displayName:'Shy Alon'}),'SA');
 assert.equal(initialsFor({displayName:'שי אלון'}),'שא');
 assert.equal(initialsFor({displayName:'  shy  '}),'S');
});

test('initials fall back to the email local part',()=>{
 assert.equal(initialsFor({email:'shy.alon@gmail.com'}),'SH');
 assert.equal(initialsFor({email:'7up@x.io'}),'7U');
 assert.equal(initialsFor({}),'?');
 assert.equal(initialsFor(null),'?');
});

test('known auth codes map to Hebrew Error/Next pairs',()=>{
 const m=authErrorMessage({code:'auth/email-already-in-use'});
 assert.match(m.error,/כבר קיים חשבון/);
 assert.match(m.next,/כניסה/);
 const w=authErrorMessage({code:'auth/weak-password'});
 assert.match(w.next,/6 תווים/);
});

test('unknown codes get the generic failure, never the raw error',()=>{
 const m=authErrorMessage({code:'auth/internal-weirdness',message:'SQL exploded at line 9'});
 assert.equal(m.error,'ההתחברות נכשלה.');
 assert.doesNotMatch(m.error+m.next,/SQL|weirdness/);
 assert.deepEqual(authErrorMessage(undefined).error,'ההתחברות נכשלה.');
});
