import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Diagnosis from './pages/Diagnosis';
import Login from './pages/Login';
import History from './pages/History';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Diagnosis />} />
        <Route path="/login" element={<Login />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  );
}
