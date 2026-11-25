import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import Overview from '@/pages/Overview'
import Explorer from '@/pages/Explorer'
import FlightPath from '@/pages/FlightPath'
import Drift from '@/pages/Drift'
import Coverage from '@/pages/Coverage'
import Sonar from '@/pages/Sonar'
import Hypotheses from '@/pages/Hypotheses'
import Evidence from '@/pages/Evidence'
import Methodology from '@/pages/Methodology'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="explorer" element={<Explorer />} />
        <Route path="flight-path" element={<FlightPath />} />
        <Route path="drift" element={<Drift />} />
        <Route path="coverage" element={<Coverage />} />
        <Route path="sonar" element={<Sonar />} />
        <Route path="hypotheses" element={<Hypotheses />} />
        <Route path="evidence" element={<Evidence />} />
        <Route path="methodology" element={<Methodology />} />
        <Route path="*" element={<Overview />} />
      </Route>
    </Routes>
  )
}
