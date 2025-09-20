// App.js
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import LoginScreen from "./screens/loginScreen";
import HierarchyScreen from "./screens/hierarchyScreen";
import RegisterScreen from "./screens/registerScreen";
import Navbar from "./components/Navbar";
import Modal from "./components/Modal";


function AppContent() {
  const location = useLocation();
  const hideNavbarRoutes = ['/', '/register'];
  const showNavbar = !hideNavbarRoutes.includes(location.pathname);
  
  const [modalState, setModalState] = useState({
    isOpen: false,
    content: null,
    title: ''
  });

  const openModal = (content, title) => {
    setModalState({
      isOpen: true,
      content,
      title
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      content: null,
      title: ''
    });
  };

  return (
    <>
      {showNavbar && <Navbar onOpenModal={openModal} />}
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/hierarchies" element={<HierarchyScreen />} />
      </Routes>
      
      <Modal 
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
      >
        {modalState.content}
      </Modal>
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