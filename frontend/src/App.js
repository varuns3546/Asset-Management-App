// App.js
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import LoginScreen from "./screens/loginScreen";
import OpenProjectScreen from "./screens/openProjectScreen";
import HierarchyScreen from "./screens/hierarchyScreen";
import RegisterScreen from "./screens/registerScreen";
import Navbar from "./components/Navbar";

function AppContent() {
  const location = useLocation();
  const hideNavbarRoutes = ['/', '/register'];
  const showNavbar = !hideNavbarRoutes.includes(location.pathname);
  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/projects" element={<OpenProjectScreen />} />
        <Route path="/hierarchies" element={<HierarchyScreen />} />
      </Routes>
    </>
  );
  
}


function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;