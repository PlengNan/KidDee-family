
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Input, Select, Tag } from '../ui'
import { createUser, getSessionUser, login } from '../db'

export default function SignupPage(){
  const [firstName,setFirstName] = useState('')
  const [lastName,setLastName] = useState('')
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')
  const [age,setAge] = useState('')
  const [role,setRole] = useState('parent') // parent / child
  const [parentCode,setParentCode] = useState('')
  const [err,setErr] = useState('')
  const nav = useNavigate()

  function onSubmit(e){
    e.preventDefault()
    setErr('')
    try{
      const u = createUser({firstName,lastName,username,password,age,role,parentCode})
      // auto login
      login(username,password)
      const me = getSessionUser()
      nav(me.role === 'parent' ? '/parent' : (me.role === 'child' ? '/child' : '/'))
    }catch(e){
      setErr(e.message)
    }
  }

  return (
    <Card>
      <h2 className="text-xl font-bold mb-3">สมัครสมาชิก</h2>
      <form className="grid md:grid-cols-2 gap-3" onSubmit={onSubmit}>
        <Input label="ชื่อ" value={firstName} onChange={e=>setFirstName(e.target.value)} required />
        <Input label="นามสกุล" value={lastName} onChange={e=>setLastName(e.target.value)} required />
        <Input label="ชื่อผู้ใช้ (username)" value={username} onChange={e=>setUsername(e.target.value)} required />
        <Input label="รหัสผ่าน" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <Input label="อายุ" type="number" value={age} onChange={e=>setAge(e.target.value)} required />
        <Select label="บทบาท (Role)" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="parent">ผู้ปกครอง</option>
          <option value="child">เด็กน้อย</option>
        </Select>

        {role === 'child' && (
          <div className="md:col-span-2">
            <Input label="รหัสผู้ปกครอง (Parent Code)" value={parentCode} onChange={e=>setParentCode(e.target.value)} required />
            <p className="text-xs text-kd-ink/60 mt-1">รับรหัสจากผู้ปกครองของตนเองเพื่อผูกบัญชี</p>
          </div>
        )}

        {err && <div className="md:col-span-2 text-red-600 text-sm">{err}</div>}
        <div className="md:col-span-2">
          <Button type="submit">สมัครสมาชิก</Button>
        </div>
      </form>
      <div className="mt-4 text-sm">
        <Tag color="bg-kd-purple/40">หมายเหตุ</Tag> ผู้ปกครองจะมีรหัสส่วนตัว (Parent Code) เพื่อเชื่อมเด็กน้อยเข้ามาในครอบครัว
      </div>
    </Card>
  )
}
