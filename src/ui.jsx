
import React, {createContext, useContext, useState, useCallback} from 'react'

export function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl shadow-kd p-4 ${className}`}>{children}</div>
}
export function Button({ children, className = '', ...props }) {
  return (
    <button {...props}
      className={`px-4 py-2 rounded-xl2 font-medium transition hover:scale-[1.02] active:scale-[0.98] shadow-kd ${className}`}>
      {children}
    </button>
  )
}
export function Input({ label, error, ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="text-kd-ink/80">{label}</span>}
      <input className={`border rounded-xl2 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kd-purple/40 ${error?'border-red-400':''}`} {...props}/>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  )
}
export function Select({ label, children, error, ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="text-kd-ink/80">{label}</span>}
      <select className={`border rounded-xl2 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kd-purple/40 ${error?'border-red-400':''}`} {...props}>
        {children}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  )
}
export function SectionTitle({ children }) { return <h2 className="text-xl font-bold text-kd-ink mb-3">{children}</h2> }
export function Tag({ children, color = 'bg-kd-yellow' }) { return <span className={`px-2 py-1 rounded-xl2 text-xs ${color}`}>{children}</span> }
export function RoleNav({ items, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {items.map(it => {
        const active = it.value === value
        return (
          <button key={it.value} onClick={() => onChange(it.value)}
            className={`px-3 py-2 rounded-xl2 text-sm transition shadow-kd ${active ? 'bg-kd-purple text-[#1b2430]' : 'bg-white hover:bg-kd-blue/40'}`}>
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
export function Avatar({ src, size = 56 }) {
  return (
    <div className="rounded-full border overflow-hidden bg-gray-100" style={{ width: size, height: size }}>
      {src ? <img src={src} alt="avatar" className="w-full h-full object-cover" /> :
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>}
    </div>
  )
}
export function AvatarUploader({ onPick, label = 'รูปโปรไฟล์' }) {
  function handleChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => onPick?.(reader.result)
    reader.readAsDataURL(f)
  }
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-kd-ink/80">{label}</span>
      <input type="file" accept="image/*" onChange={handleChange} />
    </label>
  )
}

// -------- Toast (Context) --------
const ToastCtx = createContext(null)
export function useToast(){ return useContext(ToastCtx) }
export function ToastProvider({children}){
  const [toasts, setToasts] = useState([])
  const push = useCallback((msg, type='info')=>{
    const id = crypto.randomUUID()
    setToasts(t=>[...t, {id,msg,type}])
    setTimeout(()=> setToasts(t=>t.filter(x=>x.id!==id)), 2500)
  },[])
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed right-3 top-3 z-50 flex flex-col gap-2">
        {toasts.map(t=>(
          <div key={t.id} className={`px-3 py-2 rounded-xl2 shadow-kd text-sm ${t.type==='error'?'bg-red-200':'bg-kd-blue'}`}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
