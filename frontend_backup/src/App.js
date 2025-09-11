// App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginScreen from "./screens/loginScreen";
import OpenProjectScreen from "./screens/openProjectScreen";
import HierarchyScreen from "./screens/hierarchyScreen";
import RegisterScreen from "./screens/registerScreen";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/projects" element={<OpenProjectScreen />} />
        <Route path="/hierarchies" element={<HierarchyScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
