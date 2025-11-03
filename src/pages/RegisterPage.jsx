import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUser } from '../db'
import { Card, Button, Input, Select, SectionTitle, useToast } from '../ui'

export default function RegisterPage(){
  const nav = useNavigate()
  const { push } = useToast()
  const [role, setRole] = useState('parent')
  const [form, setForm] = useState({ firstName:'', lastName:'', username:'', password:'', age:'', parentCode:'' })
  const [err, setErr] = useState({})

  function update(k,v){ setForm({ ...form, [k]: v }) }

  function validate(){
    const e = {}
    if (!form.firstName) e.firstName = 'กรอกชื่อ'
    if (!form.lastName) e.lastName = 'กรอกนามสกุล'
    if (!form.username) e.username = 'กรอกชื่อผู้ใช้'
    if (!form.password || form.password.length<6) e.password = 'รหัสผ่านอย่างน้อย 6 ตัวอักษร'
    if (!form.age) e.age = 'กรอกอายุ'
    if (role==='child' && !form.parentCode) e.parentCode = 'กรอกรหัสผู้ปกครอง'
    setErr(e)
    return Object.keys(e).length===0
  }

  function onSubmit(e){
    e.preventDefault()
    if (!validate()) return
    try{
      createUser({ ...form, role })
      push('สมัครสำเร็จ! กรุณาเข้าสู่ระบบ','info')
      nav('/login')
    }catch(ex){
      push(ex.message,'error')
    }
  }

  return (
    <div className="grid place-items-center">
      <Card className="max-w-md w-full">
        <SectionTitle>สมัครสมาชิก KidDee</SectionTitle>
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
          <Input label="ชื่อ" value={form.firstName} onChange={e=>update('firstName', e.target.value)} error={err.firstName}/>
          <Input label="นามสกุล" value={form.lastName} onChange={e=>update('lastName', e.target.value)} error={err.lastName}/>
          <Input label="ชื่อผู้ใช้" value={form.username} onChange={e=>update('username', e.target.value)} error={err.username}/>
          <Input label="รหัสผ่าน" type="password" value={form.password} onChange={e=>update('password', e.target.value)} error={err.password}/>
          <Input label="อายุ" type="number" value={form.age} onChange={e=>update('age', e.target.value)} error={err.age}/>
          <Select label="บทบาท" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="parent">ผู้ปกครอง</option>
            <option value="child">เด็กน้อย</option>
          </Select>
          {role==='child' && (
            <Input className="col-span-2" label="รหัสผู้ปกครอง" value={form.parentCode} onChange={e=>update('parentCode', e.target.value)} error={err.parentCode}/>
          )}
          <div className="col-span-2"><Button className="bg-kd-pink">สมัครสมาชิก</Button></div>
        </form>
        <p className="text-sm mt-3 text-center">มีบัญชีแล้ว? <Link to="/login" className="text-kd-ink underline">เข้าสู่ระบบ</Link></p>
      </Card>
    </div>
  )
}
