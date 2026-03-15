import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CompanyDetail from './pages/CompanyDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"                  element={<Dashboard />} />
          <Route path="/company/:ticker"   element={<CompanyDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
