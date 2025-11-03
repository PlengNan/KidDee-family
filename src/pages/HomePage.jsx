// src/pages/HomePage.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { Card, Button, SectionTitle } from '../ui'

export default function HomePage(){
  return (
    <div className="grid place-items-center">
      <Card className="max-w-xl w-full text-center bg-white/90">
        <SectionTitle>KidDee — เว็บลิสต์กิจกรรมและเก็บคะแนนความดี</SectionTitle>
        <p className="text-kd-ink/70">ธีมพาสเทล ฟ้า · เหลือง · ชมพู · ม่วง</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link to="/login"><Button className="bg-kd-blue">เข้าสู่ระบบ</Button></Link>
          <Link to="/register"><Button className="bg-kd-pink">สมัครสมาชิก</Button></Link>
        </div>
      </Card>
    </div>
  )
}
