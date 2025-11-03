import React, { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getSessionUser, getUsers, deleteUser, updateUser, createUser } from '../db'
import { Card, Button, Input, Select, SectionTitle, Tag, RoleNav, useToast } from '../ui'

export default function AdminPage(){
  const me = getSessionUser()
  if (!me) return <Navigate to="/login" replace />
  if (me.role !== 'admin') return <Navigate to="/" replace />

  const [_, force] = useState(0)
  const users = useMemo(()=> getUsers(), [_, force])
  const { push } = useToast()

  // ---- Nav ----
  const [tab, setTab] = useState('users')
  const navItems = [
    { value: 'users', label: 'จัดการผู้ใช้', desc: 'เพิ่ม/ลบ/แก้ไขสมาชิก' },
  ]

  // ---- ฟอร์มเพิ่มผู้ใช้ ----
  const [firstName,setFirstName] = useState('')
  const [lastName,setLastName]   = useState('')
  const [username,setUsername]   = useState('')
  const [password,setPassword]   = useState('')
  const [age,setAge]             = useState('')
  const [role,setRole]           = useState('parent')
  const [parentId,setParentId]   = useState('')
  const [err,setErr]             = useState('')

  const parents = users.filter(u => u.role === 'parent')

  function onCreateUser(e){
    e.preventDefault()
    setErr('')
    try{
      let parentCode = null
      if(role === 'child'){
        if(!parentId) throw new Error('เลือกผู้ปกครองก่อน')
        const p = users.find(u=>u.id===parentId)
        if(!p?.parentCode) throw new Error('ผู้ปกครองที่เลือกยังไม่มีโค้ด')
        parentCode = p.parentCode
      }
      createUser({ firstName, lastName, username, password, age, role, parentCode })
      setFirstName(''); setLastName(''); setUsername(''); setPassword('')
      setAge(''); setRole('parent'); setParentId('')
      force(x=>x+1)
      push('เพิ่มผู้ใช้สำเร็จ','info')
    }catch(e){ setErr(e.message) ; push(e.message,'error')}
  }

  function onDelete(id){
    if (!confirm('ลบผู้ใช้นี้?')) return
    deleteUser(id); force(x=>x+1); push('ลบผู้ใช้เรียบร้อย','info')
  }
  function onRoleChange(u, role){
    updateUser(u.id, {role}); force(x=>x+1); push('อัปเดตRole สำเร็จ','info')
  }

  return (
    <Card>
      <SectionTitle>แผงผู้ดูแลระบบ (Admin)</SectionTitle>
      <p className="text-sm text-kd-ink/70">ตั้งค่าและจัดการสมาชิก</p>

      <RoleNav items={navItems} value={tab} onChange={setTab} />

      {tab === 'users' && (
        <>
          {/* ฟอร์มเพิ่มผู้ใช้ */}
          <form className="grid md:grid-cols-6 gap-3 mb-6" onSubmit={onCreateUser}>
            <Input  label="ชื่อ" value={firstName} onChange={e=>setFirstName(e.target.value)} required/>
            <Input  label="นามสกุล" value={lastName} onChange={e=>setLastName(e.target.value)} required/>
            <Input  label="Username" value={username} onChange={e=>setUsername(e.target.value)} required/>
            <Input  label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
            <Input  label="อายุ" type="number" value={age} onChange={e=>setAge(e.target.value)} required/>
            <Select label="Role" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="admin">admin</option>
              <option value="parent">parent</option>
              <option value="child">child</option>
            </Select>

            {role==='child' && (
              <div className="md:col-span-6">
                <div className="text-sm mb-1">เลือกผู้ปกครองของเด็กน้อย</div>
                <select className="border rounded-xl2 px-3 py-2 w-full"
                        value={parentId} onChange={e=>setParentId(e.target.value)}>
                  <option value="">-- เลือกผู้ปกครอง --</option>
                  {parents.map(p=>(
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} — code: {p.parentCode || '(ยังไม่มี)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {err && <div className="md:col-span-6 text-red-600 text-sm">{err}</div>}
            <div className="md:col-span-6">
              <Button type="submit" className="bg-kd-blue">เพิ่มผู้ใช้</Button>
            </div>
          </form>

          {/* ตารางสมาชิก */}
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-kd-yellow/60">
                  <th className="p-2 text-left">ชื่อ</th>
                  <th className="p-2 text-left">Username</th>
                  <th className="p-2 text-left">อายุ</th>
                  <th className="p-2 text-left">Role</th>
                  <th className="p-2">เด็กในความดูแล</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u=>(
                  <tr key={u.id} className="border-b">
                    <td className="p-2">{u.firstName} {u.lastName}</td>
                    <td className="p-2">{u.username}</td>
                    <td className="p-2">{u.age}</td>
                    <td className="p-2">
                      <select className="border rounded-xl2 px-2 py-1"
                              value={u.role}
                              onChange={e=>onRoleChange(u, e.target.value)}>
                        <option value="admin">admin</option>
                        <option value="parent">parent</option>
                        <option value="child">child</option>
                      </select>
                    </td>
                    <td className="p-2">{(u.childrenIds||[]).length || '-'}</td>
                    <td className="p-2 text-right">
                      {u.username!=='admin' && (
                        <Button className="bg-kd-pink" onClick={()=>onDelete(u.id)}>ลบ</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm">
            <Tag color="bg-kd-blue/50">หมายเหตุ</Tag> เดโมนี้เก็บข้อมูลในเบราว์เซอร์ — สำหรับใช้งานจริงให้เชื่อมฐานข้อมูล
          </div>
        </>
      )}
    </Card>
  )
}
