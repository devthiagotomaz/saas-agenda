import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home.tsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Profile } from './pages/Profile.jsx';
import { Services } from './pages/Services.jsx';
import { Appointments } from './pages/Appointments.jsx';
import { ProviderDashboard } from './pages/ProviderDashboard.jsx';
import { ProviderDetail } from './pages/ProviderDetail.jsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/services" element={<Services />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/provider-dashboard" element={<ProviderDashboard />} />
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;