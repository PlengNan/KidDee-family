
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, Button, Input } from '../ui'
import { login, getSessionUser } from '../db'

export default function LoginPage(){
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')
  const [err,setErr] = useState('')
  const nav = useNavigate()

  function onSubmit(e){
    e.preventDefault()
    setErr('')
    try{
      login(username, password)
      const me = getSessionUser()
      if (me.role === 'admin') nav('/admin')
      else if (me.role === 'parent') nav('/parent')
      else nav('/child')
    }catch(e){
      setErr(e.message)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-kd-blue to-kd-pink">
        <h1 className="text-3xl font-black text-kd-ink mb-2">KidDee</h1>
        <p className="text-kd-ink/80">เว็บลิสต์กิจกรรมและเก็บคะแนนความดี สำหรับครอบครัว</p>
        <ul className="mt-4 list-disc pl-6 text-sm text-kd-ink/80">
          <li>ผู้ใช้: แอดมิน / ผู้ปกครอง / เด็กน้อย</li>
          <li>ธีมพาสเทล ฟ้า-เหลือง-ชมพู-ม่วง</li>
          <li>ข้อมูลเก็บในเบราว์เซอร์ (เดโม) — สลับไปใช้ฐานข้อมูลจริงได้</li>
        </ul>
      </Card>
      <Card>
        <h2 className="text-xl font-bold mb-3">เข้าสู่ระบบ</h2>
        <form className="flex flex-col gap-3" onSubmit={onSubmit}>
          <Input label="ชื่อผู้ใช้" value={username} onChange={e=>setUsername(e.target.value)} required />
          <Input label="รหัสผ่าน" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          {err && <div className="text-red-600 text-sm">{err}</div>}
          <Button type="submit">เข้าสู่ระบบ</Button>
          <div className="text-sm">
            ยังไม่มีบัญชี? <Link to="/signup" className="underline">สมัครสมาชิก</Link><br/>
          </div>
        </form>
      </Card>
    </div>
  )
}
