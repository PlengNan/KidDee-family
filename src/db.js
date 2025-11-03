
const LS = {
  USERS: 'kiddee_users',
  SESSION: 'kiddee_session',
  ACTIVITIES: 'kiddee_activities',
  SCORES: 'kiddee_scores',
  CHALLENGES: 'kiddee_challenges',
  NOTIFS: 'kiddee_notifs'
}

function uid() { return 'id-' + crypto.getRandomValues(new Uint32Array(4)).join('') }

// ---------- INIT ----------
export function initDB() {
  if (!localStorage.getItem(LS.USERS)) {
    const admin = { id: uid(), firstName:'Admin', lastName:'KidDee', username:'admin', password:'admin123', age:30, role:'admin', parentCode:null, childrenIds:[], avatar:null }
    localStorage.setItem(LS.USERS, JSON.stringify([admin]))
  }
  for (const k of [LS.ACTIVITIES, LS.SCORES, LS.CHALLENGES, LS.NOTIFS])
    if (!localStorage.getItem(k)) localStorage.setItem(k, '[]')
}

// ---------- USERS ----------
export function getUsers(){ return JSON.parse(localStorage.getItem(LS.USERS) || '[]') }
export function saveUsers(v){ localStorage.setItem(LS.USERS, JSON.stringify(v)) }

export function getSessionUser(){ const id = localStorage.getItem(LS.SESSION); if(!id) return null; return getUsers().find(u=>u.id===id)||null }
export function setSessionUser(u){ if(u) localStorage.setItem(LS.SESSION, u.id); else localStorage.removeItem(LS.SESSION) }

export function createUser({ firstName,lastName,username,password,age,role,parentCode }){
  const list = getUsers()
  if (list.some(x=>x.username===username)) throw new Error('username นี้มีอยู่แล้ว')
  if (!password || String(password).length < 6) throw new Error('รหัสผ่านอย่างน้อย 6 ตัวอักษร')

  const u = { id: uid(), firstName,lastName,username,password, age:Number(age)||0, role,
    parentCode: role==='parent' ? (parentCode || Math.random().toString(36).slice(2,8)) : parentCode,
    childrenIds: [], avatar: null }

  if (role==='child'){
    const p = list.find(x=>x.role==='parent' && x.parentCode===parentCode)
    if(!p) throw new Error('รหัสผู้ปกครองไม่ถูกต้อง')
    p.childrenIds.push(u.id)
  }
  list.push(u); saveUsers(list); return u
}

export function login(username,password){
  const u = getUsers().find(x=>x.username===username && x.password===password)
  if(!u) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
  setSessionUser(u); return u
}
export function updateUser(id, patch){
  const list = getUsers(); const i = list.findIndex(x=>x.id===id); if(i===-1) return;
  list[i] = { ...list[i], ...patch }; saveUsers(list); return list[i]
}
export function updateAvatar(id, base64){ return updateUser(id, { avatar: base64 }) }
export function deleteUser(id){
  const list = getUsers().filter(u=>u.id!==id)
  list.forEach(u=>{ if(u.role==='parent') u.childrenIds = u.childrenIds.filter(cid=>cid!==id) })
  saveUsers(list)
}

// ---------- SCORES ----------
export function getScores(){ return JSON.parse(localStorage.getItem(LS.SCORES) || '[]') }
export function saveScores(v){ localStorage.setItem(LS.SCORES, JSON.stringify(v)) }
export function addScore(childId, delta, reason){
  const v = getScores(); v.push({ id: uid(), childId, delta:Number(delta), reason, ts: Date.now() }); saveScores(v)
}
export function totalScore(childId){ return getScores().filter(s=>s.childId===childId).reduce((a,b)=>a+(b.delta||0),0) }
export function getScoresByChild(childId){
  return getScores().filter(s=>s.childId===childId).sort((a,b)=>b.ts-a.ts)
}

// ---------- ACTIVITIES ----------
export function getActivities(){ return JSON.parse(localStorage.getItem(LS.ACTIVITIES) || '[]') }
export function saveActivities(v){ localStorage.setItem(LS.ACTIVITIES, JSON.stringify(v)) }
export function createActivity({ title, points, parentId, childIds }){
  const v = getActivities(); v.push({ id:uid(), title, points:Number(points)||0, parentId, childIds: childIds||[], submissions:[] }); saveActivities(v)
}
export function submitActivity(childId, activityId){
  const v = getActivities(); const a = v.find(x=>x.id===activityId); if(!a) throw new Error('ไม่พบกิจกรรม');
  a.submissions.push({ childId, status:'pending', score:0 }); saveActivities(v);
}
export function reviewSubmission(parentId, activityId, childId, status, score){
  const v = getActivities(); const a = v.find(x=>x.id===activityId); if(!a) return;
  const s = a.submissions.find(x=>x.childId===childId && x.status==='pending'); if(!s) return;
  s.status=status; s.score=Number(score)||0; saveActivities(v);
  if(status==='approved'){ addScore(childId, s.score, 'จากกิจกรรม '+a.title) }
}

// ---------- CHALLENGES ----------
export function getChallenges(){ return JSON.parse(localStorage.getItem(LS.CHALLENGES) || '[]') }
export function saveChallenges(v){ localStorage.setItem(LS.CHALLENGES, JSON.stringify(v)) }
export function createChallenge({ parentId, childId, targetPoints, reward }){
  const v = getChallenges(); v.push({ id:uid(), parentId, childId, targetPoints:Number(targetPoints)||0, reward }); saveChallenges(v)
}
export function progressChallenge(ch){ const cur = totalScore(ch.childId); const pct = Math.max(0, Math.min(100, Math.floor(cur / (ch.targetPoints||1) * 100))); return { current: cur, percent: pct } }

// ---------- BACKUP / RESTORE ----------
export function exportAllJSON(){
  const data = {
    users: getUsers(),
    activities: getActivities(),
    scores: getScores(),
    challenges: getChallenges()
  }
  return JSON.stringify(data, null, 2)
}
export function importAllJSON(jsonString){
  const obj = JSON.parse(jsonString)
  if (!obj || typeof obj !== 'object') throw new Error('ไฟล์ไม่ถูกต้อง')
  if (obj.users) localStorage.setItem(LS.USERS, JSON.stringify(obj.users))
  if (obj.activities) localStorage.setItem(LS.ACTIVITIES, JSON.stringify(obj.activities))
  if (obj.scores) localStorage.setItem(LS.SCORES, JSON.stringify(obj.scores))
  if (obj.challenges) localStorage.setItem(LS.CHALLENGES, JSON.stringify(obj.challenges))
}

// ---------- Utils ----------
export function computeLevel(total){ const lvl = Math.floor(total/50)+1; const pct = Math.round((total%50)/50*100); return { level:lvl, progress:pct } }
export function getBadges(total){ const r=[]; if(total>=10) r.push('⭐ ดีเด่น I'); if(total>=50) r.push('🥈 เหรียญเงิน'); if(total>=100) r.push('🥇 เหรียญทอง'); if(total>=200) r.push('🏆 ถ้วยครอบครัว'); return r }
export function resetAll(){ for (const k of Object.values(LS)) localStorage.removeItem(k); initDB() }
