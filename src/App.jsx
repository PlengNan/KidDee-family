
import React from 'react'
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { initDB, getSessionUser, setSessionUser } from './db'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminPage from './pages/AdminPage'
import ParentPage from './pages/ParentPage'
import ChildPage from './pages/ChildPage'
import { ToastProvider } from './ui'

function Shell({children}){
  React.useEffect(()=>{ initDB() }, [])
  const nav = useNavigate()
  const me = getSessionUser()
  const logout = ()=>{ setSessionUser(null); nav('/login') }
  const roleHome = !me ? '/' : me.role==='admin'?'/admin':(me.role==='parent'?'/parent':'/child')

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-kd-pink via-kd-yellow to-kd-purple p-3 shadow-kd">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to={roleHome} className="text-2xl font-black text-kd-ink">KidDee</Link>
          <nav className="flex items-center gap-3 text-sm">
            {!me ? (<>
              <Link to="/login" className="underline">เข้าสู่ระบบ</Link>
              <Link to="/register" className="underline">สมัครสมาชิก</Link>
            </>) : (<>
              <Link to={roleHome} className="px-3 py-1 rounded-xl2 bg-white/70">{me.firstName} {me.lastName} · {me.role}</Link>
              <button onClick={logout} className="underline">ออกจากระบบ</button>
            </>)}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">{children}</main>
      <footer className="mt-10 p-6 text-center text-xs text-kd-ink/60">© {new Date().getFullYear()} KidDee</footer>
    </div>
  )
}

function RoleRoute({ allow, children }){
  const me = getSessionUser()
  if (!me) return <Navigate to="/login" replace />
  if (!allow.includes(me.role)) return <Navigate to="/" replace />
  return children
}

function HomeRedirect(){
  const me = getSessionUser()
  if (!me) return <Navigate to="/home" replace />
  if (me.role==='admin') return <Navigate to="/admin" replace />
  if (me.role==='parent') return <Navigate to="/parent" replace />
  return <Navigate to="/child" replace />
}

export default function App(){
  return (
    <ToastProvider>
      <Shell>
        <Routes>
          <Route path="/" element={<HomeRedirect/>} />
          <Route path="/home" element={<HomePage/>} />
          <Route path="/login" element={<LoginPage/>} />
          <Route path="/register" element={<RegisterPage/>} />

          <Route path="/admin" element={<RoleRoute allow={['admin']}><AdminPage/></RoleRoute>} />
          <Route path="/parent" element={<RoleRoute allow={['parent']}><ParentPage/></RoleRoute>} />
          <Route path="/child" element={<RoleRoute allow={['child']}><ChildPage/></RoleRoute>} />

          <Route path="*" element={<Navigate to="/" replace/>} />
        </Routes>
      </Shell>
    </ToastProvider>
  )
}
