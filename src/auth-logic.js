// Pure auth helpers: no Firebase imports, hermetically testable.

// Initials fallback for the account avatar when the provider gives no
// photo: first letters of the first two display-name words, else the
// first two alphanumeric letters of the email local part (Hebrew ok).
export function initialsFor(user){
  const name=(user?.displayName||'').trim();
  if(name){
    const parts=name.split(/\s+/).filter(Boolean);
    return parts.slice(0,2).map(p=>[...p][0]).join('').toUpperCase();
  }
  const local=(user?.email||'').split('@')[0]||'';
  const letters=[...local].filter(ch=>/[A-Za-z0-9\u0590-\u05FF]/.test(ch));
  return letters.slice(0,2).join('').toUpperCase()||'?';
}

const AUTH_MESSAGES={
  'auth/invalid-email':['כתובת האימייל לא תקינה.','בודקים את הכתובת ומנסים שוב.'],
  'auth/invalid-credential':['הפרטים לא תואמים חשבון קיים.','בודקים אימייל וסיסמה, או פותחים חשבון חדש.'],
  'auth/wrong-password':['הפרטים לא תואמים חשבון קיים.','בודקים אימייל וסיסמה, או פותחים חשבון חדש.'],
  'auth/user-not-found':['הפרטים לא תואמים חשבון קיים.','בודקים אימייל וסיסמה, או פותחים חשבון חדש.'],
  'auth/email-already-in-use':['כבר קיים חשבון עם האימייל הזה.','עוברים למסך הכניסה.'],
  'auth/weak-password':['הסיסמה חלשה מדי.','בוחרים סיסמה של 6 תווים לפחות.'],
  'auth/too-many-requests':['יותר מדי ניסיונות התחברות.','מחכים דקה ומנסים שוב.'],
  'auth/network-request-failed':['אין חיבור לרשת.','בודקים את החיבור ומנסים שוב.'],
  'auth/popup-closed-by-user':['חלון ההתחברות נסגר לפני הסיום.','מנסים שוב ומשלימים את ההתחברות בחלון שנפתח.'],
  'auth/popup-blocked':['הדפדפן חסם את חלון ההתחברות.','מאפשרים חלונות קופצים לאתר ומנסים שוב.'],
  'auth/operation-not-allowed':['שיטת ההתחברות הזו לא זמינה כרגע.','מנסים שיטה אחרת.'],
};

// Maps a Firebase Auth error to the site's Error / Next pattern. Never
// exposes the raw provider error to the user.
export function authErrorMessage(error){
  const code=error?.code||'';
  const [err,next]=AUTH_MESSAGES[code]||['ההתחברות נכשלה.','מנסים שוב בעוד רגע.'];
  return {error:err,next};
}
