import React, { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  getSessionUser, getUsers,
  getActivities, submitActivity,
  totalScore, getScoresByChild
} from '../db'
import { Card, Button, SectionTitle, RoleNav, Tag, Avatar, useToast } from '../ui'

export default function ChildPage(){
  const me = getSessionUser()
  if (!me) return <Navigate to="/login" replace />
  if (me.role !== 'child') return <Navigate to="/" replace />

  const { push } = useToast()
  const users = useMemo(()=> getUsers(), [])
  const parent = users.find(u=>u.role==='parent' && u.childrenIds?.includes(me.id))
  const [bump, setBump] = useState(0)
  const force = ()=>setBump(x=>x+1)

  const activities = useMemo(()=>{
    return getActivities()
      .filter(a => a.childIds?.includes(me.id))
  }, [bump])

  const pending = activities.map(a => ({
    activity: a,
    my: (a.submissions||[]).find(s=>s.childId===me.id)
  }))

  const total = totalScore(me.id)
  const history = getScoresByChild(me.id)

  const [tab, setTab] = useState('tasks')
  const navItems = [
    {value:'tasks', label:'กิจกรรมของฉัน', desc:'ส่งงาน'},
    {value:'scores', label:'คะแนน/ประวัติ', desc:'รวมคะแนนและรายการ'},
    {value:'profile', label:'โปรไฟล์', desc:'ข้อมูลส่วนตัว'}
  ]

  return (
    <Card>
      <SectionTitle>เด็กน้อย</SectionTitle>
      <div className="flex items-center gap-3 mb-3">
        <Avatar src={me.avatar} />
        <div>
          <div className="font-semibold">{me.firstName} {me.lastName}</div>
          <div className="text-sm text-kd-ink/70">ผู้ปกครอง: {parent ? `${parent.firstName} ${parent.lastName}` : '-'}</div>
        </div>
      </div>

      <RoleNav items={navItems} value={tab} onChange={setTab} />

      {/* กิจกรรมของฉัน */}
      {tab==='tasks' && (
        <>
          {pending.length===0 && <div className="text-sm text-kd-ink/60">ยังไม่มีกิจกรรมที่ได้รับมอบหมาย</div>}
          {pending.map(row=>{
            const a = row.activity
            const my = row.my
            const status = my?.status || 'none'
            return (
              <div key={a.id} className="border-t pt-3 mt-3">
                <div className="font-semibold">{a.title} <Tag color="bg-kd-purple/40">คะแนนเต็ม {a.points}</Tag></div>
                {status==='none' && (
                  <Button className="mt-2 bg-kd-blue" onClick={()=>{
                    submitActivity(me.id, a.id)
                    force()
                    push('ส่งงานแล้ว! รอผู้ปกครองตรวจ','info')
                  }}>ส่งงาน</Button>
                )}
                {status==='pending' && <div className="text-sm text-kd-ink/70 mt-2">🕒 รอตรวจ</div>}
                {status==='approved' && <div className="text-sm text-green-700 mt-2">✅ ผ่านแล้ว +{my.score} คะแนน</div>}
                {status==='rejected' && <div className="text-sm text-red-600 mt-2">✏️ ให้แก้งานก่อน</div>}
              </div>
            )
          })}
        </>
      )}

      {/* คะแนน/ประวัติ */}
      {tab==='scores' && (
        <>
          <div className="text-lg font-semibold">คะแนนรวมของฉัน: {total}</div>
          <div className="mt-3 grid gap-2">
            {history.length===0 && <div className="text-sm text-kd-ink/60">ยังไม่มีประวัติคะแนน</div>}
            {history.map(h=>(
              <div key={h.id} className="flex items-center justify-between text-sm bg-kd-yellow/50 rounded-xl2 px-3 py-2">
                <span>{new Date(h.ts).toLocaleString()}</span>
                <span className="font-medium">{h.delta>0?'+':''}{h.delta}</span>
                <span className="text-kd-ink/70">{h.reason}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* โปรไฟล์ (อ่านอย่างเดียวในเวอร์ชันฐาน) */}
      {tab==='profile' && (
        <div className="text-sm text-kd-ink/70">
          ชื่อผู้ใช้: <b>{me.username}</b><br/>
          อายุ: {me.age} ปี
        </div>
      )}
    </Card>
  )
}
