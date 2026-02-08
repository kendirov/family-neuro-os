import { Routes, Route } from 'react-router-dom'
import { Dashboard } from '@/pages/Dashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard mode="pilot" />} />
      <Route path="/admin" element={<Dashboard mode="commander" />} />
    </Routes>
  )
}

export default App
