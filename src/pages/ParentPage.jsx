import React, { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  getSessionUser, getUsers,
  createActivity, getActivities, reviewSubmission,
  addScore, totalScore, getScoresByChild,
  createChallenge, getChallenges, progressChallenge,
  createUser, updateUser, updateAvatar
} from '../db'
import {
  Card, Button, Input, Select, SectionTitle, Tag, RoleNav,
  Avatar, AvatarUploader, useToast
} from '../ui'

/** แถวตรวจงาน (คอมโพเนนต์ย่อย ป้องกันการใช้ hook ใน .map) */
function ReviewRow({ me, activity, child, onReviewed }) {
  const [score, setScore] = useState(activity.points)
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <span className="text-sm">{child.firstName} ส่งงาน</span>
      <select
        className="border rounded-xl2 px-2 py-1"
        value={score}
        onChange={e=>setScore(Number(e.target.value))}
      >
        {[activity.points, activity.points-1, activity.points-2, activity.points-3, activity.points-4]
          .filter(x=>x>=0).map(x=>(<option key={x} value={x}>{x}</option>))}
      </select>
      <Button className="bg-kd-yellow" onClick={()=>{
        reviewSubmission(me.id, activity.id, child.id, 'approved', Number(score))
        onReviewed?.()
      }}>ให้คะแนน</Button>
      <Button className="bg-kd-pink" onClick={()=>{
        reviewSubmission(me.id, activity.id, child.id, 'rejected', 0)
        onReviewed?.()
      }}>ปฏิเสธ/ให้แก้</Button>
    </div>
  )
}

/** การ์ดจัดการคะแนนต่อเด็กหนึ่งคน + ประวัติคะแนน */
function ChildScoreCard({ child, onChanged }) {
  const [showForm, setShowForm] = useState(false)
  const [isAdd, setIsAdd] = useState(true) // true=เพิ่ม, false=หัก
  const [points, setPoints] = useState('')
  const [reason, setReason] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const { push } = useToast()

  const total = totalScore(child.id)
  const history = getScoresByChild(child.id)

  function handleSubmit(e){
    e.preventDefault()
    const val = Number(points) || 0
    if (!val) return alert('กรอกจำนวนคะแนนก่อน')
    const delta = isAdd ? val : -val
    addScore(child.id, delta, reason || (isAdd ? 'เพิ่มคะแนน' : 'หักคะแนน'))
    setPoints(''); setReason(''); setShowForm(false)
    onChanged?.()
    push('บันทึกคะแนนเรียบร้อย','info')
  }

  return (
    <Card className="mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={child.avatar} />
          <div>
            <div className="font-semibold text-lg">{child.firstName} {child.lastName}</div>
            <div className="text-sm text-kd-ink/70">คะแนนรวมปัจจุบัน: <b>{total}</b></div>
          </div>
        </div>
        {!showForm && (
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button className="bg-kd-blue" onClick={()=>{ setShowForm(true); setIsAdd(true) }}>➕ เพิ่มคะแนน</Button>
            <Button className="bg-kd-pink" onClick={()=>{ setShowForm(true); setIsAdd(false) }}>➖ หักคะแนน</Button>
          </div>
        )}
      </div>

      {showForm && (
        <form className="mt-4 grid sm:grid-cols-3 gap-3" onSubmit={handleSubmit}>
          <Input
            label={isAdd ? "จำนวนคะแนนที่จะเพิ่ม" : "จำนวนคะแนนที่จะหัก"}
            type="number"
            value={points}
            onChange={e=>setPoints(e.target.value)}
            required
          />
          <Input
            label="เหตุผล"
            value={reason}
            onChange={e=>setReason(e.target.value)}
            placeholder={isAdd ? "ทำความดี / ช่วยงานบ้าน" : "ลืมการบ้าน / ทะเลาะกัน"}
          />
          <div className="flex items-end gap-2">
            <Button type="submit" className={isAdd ? "bg-kd-blue" : "bg-kd-pink"}>บันทึก</Button>
            <Button type="button" className="bg-white border" onClick={()=>setShowForm(false)}>ยกเลิก</Button>
          </div>
        </form>
      )}

      <div className="mt-3">
        <Button className="bg-white border" onClick={()=>setShowHistory(v=>!v)}>
          {showHistory ? 'ซ่อนประวัติคะแนน' : 'ดูประวัติคะแนน'}
        </Button>
      </div>

      {showHistory && (
        <div className="mt-3 grid gap-2">
          {history.length===0 && <div className="text-sm text-kd-ink/60">ยังไม่มีประวัติ</div>}
          {history.map(h=>(
            <div key={h.id} className="flex items-center justify-between text-sm bg-kd-yellow/50 rounded-xl2 px-3 py-2">
              <span>{new Date(h.ts).toLocaleString()}</span>
              <span className="font-medium">{h.delta>0?'+':''}{h.delta}</span>
              <span className="text-kd-ink/70">{h.reason}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function ParentPage(){
  const me = getSessionUser()
  if (!me) return <Navigate to="/login" replace />
  if (me.role !== 'parent') return <Navigate to="/" replace />

  const { push } = useToast()
  const [bump, setBump] = useState(0)
  const force = () => setBump(x=>x+1)

  const users = useMemo(()=> getUsers(), [bump])
  const children = useMemo(()=> users.filter(u => me.childrenIds?.includes(u.id)), [users, me])
  const activities = useMemo(()=> getActivities().filter(a=>a.parentId===me.id), [bump, me])
  const challenges = useMemo(()=> getChallenges().filter(c=>c.parentId===me.id), [bump, me])

  // Nav
  const [tab, setTab] = useState('children')
  const navItems = [
    {value:'children',   label:'เด็กน้อย',     desc:'รายชื่อและคะแนนรวม'},
    {value:'addchild',   label:'เพิ่มเด็กน้อย', desc:'สร้างบัญชีเด็กน้อยในครอบครัว'},
    {value:'activities', label:'กิจกรรม',      desc:'สร้าง/มอบหมายกิจกรรม'},
    {value:'review',     label:'ตรวจงาน',      desc:'อนุมัติ/ให้คะแนน'},
    {value:'scores',     label:'จัดการคะแนน',  desc:'เพิ่ม/หักคะแนน'},
    {value:'challenges', label:'Challenge',     desc:'ตั้งเป้า/รางวัล'},
    {value:'profile',    label:'โปรไฟล์ผู้ปกครอง', desc:'รูปโปรไฟล์'},
  ]

  // สร้างกิจกรรม
  const [title,setTitle] = useState('')
  const [points,setPoints] = useState('5')
  const [assignChildIds,setAssignChildIds] = useState([])
  function toggleAssign(childId){
    setAssignChildIds(prev => prev.includes(childId) ? prev.filter(x=>x!==childId) : [...prev, childId])
  }
  function onCreateActivity(e){
    e.preventDefault()
    createActivity({title, points, parentId: me.id, childIds: assignChildIds})
    setTitle(''); setPoints('5'); setAssignChildIds([]); force()
    push('สร้างกิจกรรมสำเร็จ','info')
  }

  // เพิ่มเด็กน้อยโดยผู้ปกครอง
  const [firstName,setFirstName] = useState('')
  const [lastName,setLastName]   = useState('')
  const [username,setUsername]   = useState('')
  const [password,setPassword]   = useState('')
  const [age,setAge]             = useState('')
  const [err,setErr]             = useState('')

  function onCreateChild(e){
    e.preventDefault()
    setErr('')
    try{
      // ถ้ายังไม่มี parentCode สร้างให้
      if (!me.parentCode) {
        const code = Math.random().toString(36).slice(2,8)
        updateUser(me.id, { parentCode: code })
        me.parentCode = code
      }
      createUser({
        firstName, lastName, username, password, age,
        role:'child',
        parentCode: me.parentCode
      })
      setFirstName(''); setLastName(''); setUsername(''); setPassword(''); setAge('')
      force()
      push('เพิ่มเด็กน้อยสำเร็จ','info')
    }catch(e){
      setErr(e.message)
      push(e.message,'error')
    }
  }

  // โปรไฟล์ผู้ปกครอง (อัปโหลด avatar)
  function onPickAvatar(base64){
    updateAvatar(me.id, base64)
    force()
    push('อัปเดตรูปโปรไฟล์แล้ว','info')
  }

  return (
    <Card>
      <SectionTitle>ผู้ปกครอง</SectionTitle>
      <RoleNav items={navItems} value={tab} onChange={setTab} />

      {/* เด็กน้อย */}
      {tab==='children' && (
        <>
          <div className="flex flex-wrap gap-2">
            {children.map(c=>(
              <div key={c.id} className="p-3 bg-kd-yellow/60 rounded-xl2">
                <div className="font-semibold">{c.firstName} {c.lastName}</div>
                <div className="text-xs">คะแนนรวม: {totalScore(c.id)}</div>
              </div>
            ))}
            {children.length===0 && (
              <div className="text-sm text-kd-ink/60">
                ยังไม่มีเด็กน้อย — ให้เด็กสมัครด้วยรหัสผู้ปกครองของคุณ:
                <b className="ml-1">{me.parentCode || '(ยังไม่มีโค้ด)'}</b>
              </div>
            )}
          </div>
          {me.parentCode && <div className="mt-2 text-xs">รหัสผู้ปกครอง: <span className="px-2 py-1 bg-white rounded-xl2">{me.parentCode}</span></div>}
        </>
      )}

      {/* เพิ่มเด็กน้อย */}
      {tab==='addchild' && (
        <>
          <SectionTitle>เพิ่มเด็กน้อยของฉัน</SectionTitle>
          <form className="grid md:grid-cols-2 gap-3 max-w-xl" onSubmit={onCreateChild}>
            <Input label="ชื่อ" value={firstName} onChange={e=>setFirstName(e.target.value)} required/>
            <Input label="นามสกุล" value={lastName} onChange={e=>setLastName(e.target.value)} required/>
            <Input label="Username" value={username} onChange={e=>setUsername(e.target.value)} required/>
            <Input label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
            <Input label="อายุ" type="number" value={age} onChange={e=>setAge(e.target.value)} required/>
            {err && <div className="md:col-span-2 text-red-600 text-sm">{err}</div>}
            <div className="md:col-span-2">
              <Button type="submit" className="bg-kd-blue">เพิ่มเด็กน้อย</Button>
            </div>
          </form>
          <p className="mt-3 text-sm text-kd-ink/60">
            เด็กน้อยที่สร้างจะถูกผูกกับรหัสผู้ปกครองของคุณ (<b>{me.parentCode || 'จะสร้างให้อัตโนมัติเมื่อบันทึก'}</b>) โดยอัตโนมัติ
          </p>
        </>
      )}

      {/* สร้างกิจกรรม */}
      {tab==='activities' && (
        <>
          <SectionTitle>สร้างกิจกรรม</SectionTitle>
          <form className="grid sm:grid-cols-4 gap-3" onSubmit={onCreateActivity}>
            <Input label="ชื่อกิจกรรม" value={title} onChange={e=>setTitle(e.target.value)} required />
            <Input label="คะแนนเต็ม" type="number" value={points} onChange={e=>setPoints(e.target.value)} required />
            <div className="sm:col-span-2">
              <div className="text-sm mb-1">มอบหมายให้เด็กน้อย</div>
              <div className="flex flex-wrap gap-2">
                {children.map(c=>(
                  <label key={c.id} className="inline-flex items-center gap-2 bg-kd-blue/60 px-2 py-1 rounded-xl2">
                    <input type="checkbox" checked={assignChildIds.includes(c.id)} onChange={()=>toggleAssign(c.id)} />
                    {c.firstName}
                  </label>
                ))}
              </div>
            </div>
            <div className="sm:col-span-4">
              <Button type="submit">สร้างกิจกรรม</Button>
            </div>
          </form>
        </>
      )}

      {/* ตรวจงาน */}
      {tab==='review' && (
        <>
          {activities.length===0 && <div className="text-sm text-kd-ink/60">ยังไม่มีกิจกรรม</div>}
          {activities.map(a=> {
            const pending = (a.submissions||[]).filter(s=>s.status==='pending')
            const myChildrenMap = Object.fromEntries(children.map(c=>[c.id, c]))
            return (
              <div key={a.id} className="border-t pt-3 mt-3">
                <div className="font-semibold">{a.title} <Tag color="bg-kd-purple/40">คะแนนเต็ม {a.points}</Tag></div>
                <div className="text-sm text-kd-ink/70">งานที่รอตรวจ: { pending.length }</div>
                {pending.length===0 && <div className="text-sm text-kd-ink/60">ยังไม่มีงานที่รอตรวจ</div>}
                {pending.map(s=>{
                  const child = myChildrenMap[s.childId] || { firstName: 'เด็ก', lastName: '' }
                  return (
                    <ReviewRow
                      key={s.childId}
                      me={me}
                      activity={a}
                      child={child}
                      onReviewed={force}
                    />
                  )
                })}
              </div>
            )
          })}
        </>
      )}

      {/* จัดการคะแนน */}
      {tab==='scores' && (
        <>
          <SectionTitle>จัดการคะแนนของเด็กน้อย</SectionTitle>
          {children.length === 0 && (
            <div className="text-sm text-kd-ink/60">ยังไม่มีเด็กน้อยในความดูแล</div>
          )}
          {children.map(c => (
            <ChildScoreCard key={c.id} child={c} onChanged={force} />
          ))}
        </>
      )}

      {/* Challenge */}
      {tab==='challenges' && (
        <>
          <ChallengeSection me={me} children={children} challenges={challenges} onChanged={force} />
        </>
      )}

      {/* โปรไฟล์ผู้ปกครอง */}
      {tab==='profile' && (
        <>
          <SectionTitle>โปรไฟล์ผู้ปกครอง</SectionTitle>
          <div className="flex items-center gap-3">
            <Avatar src={users.find(u=>u.id===me.id)?.avatar} size={72}/>
            <AvatarUploader onPick={onPickAvatar} />
          </div>
          <div className="mt-3 text-sm text-kd-ink/70">อัปโหลดรูปเพื่อใช้เป็น avatar ของผู้ปกครอง</div>
        </>
      )}
    </Card>
  )
}

/** ส่วน Challenge แยกต่างหากเพื่อให้อ่านง่าย */
function ChallengeSection({ me, children, challenges, onChanged }) {
  const [chChild,setChChild] = useState('')
  const [target,setTarget] = useState('50')
  const [reward,setReward] = useState('ของเล่น/ทริปเล็ก ๆ')

  function onCreate(e){
    e.preventDefault()
    if (!chChild) return alert('เลือกเด็กน้อย')
    createChallenge({parentId: me.id, childId: chChild, targetPoints: target, reward})
    setTarget('50'); setReward('ของเล่น/ทริปเล็ก ๆ')
    onChanged?.()
  }

  return (
    <>
      <form className="grid sm:grid-cols-4 gap-3" onSubmit={onCreate}>
        <div className="sm:col-span-2">
          <div className="text-sm mb-1">เลือกเด็กน้อย</div>
          <select className="border rounded-xl2 px-3 py-2 w-full" value={chChild} onChange={e=>setChChild(e.target.value)}>
            <option value="">-- เลือก --</option>
            {children.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </select>
        </div>
        <Input label="สะสมครบ (คะแนน)" type="number" value={target} onChange={e=>setTarget(e.target.value)} required />
        <Input label="ของรางวัล" value={reward} onChange={e=>setReward(e.target.value)} required />
        <div className="sm:col-span-4">
          <Button type="submit">สร้าง Challenge</Button>
        </div>
      </form>

      <div className="grid gap-3 mt-4">
        {challenges.map(ch=>{
          const child = children.find(c=>c.id===ch.childId) || {}
          const pg = progressChallenge(ch)
          return (
            <div key={ch.id} className="p-3 rounded-xl2 bg-kd-blue/40">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{child.firstName} — เป้าหมาย {ch.targetPoints} คะแนน</div>
                  <div className="text-sm text-kd-ink/70">รางวัล: {ch.reward}</div>
                </div>
                <div className="text-sm">{pg.current}/{ch.targetPoints}</div>
              </div>
              <div className="h-3 bg-white rounded-xl2 mt-2 overflow-hidden">
                <div className="h-full bg-kd-purple" style={{width: pg.percent + '%'}}/>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
