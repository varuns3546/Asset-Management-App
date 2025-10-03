// App.js
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { loadUser } from "./features/auth/authSlice";
import { setSelectedProject } from "./features/projects/projectSlice"
import "./utils/axiosInterceptor"; // Initialize axios interceptor
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import HierarchyScreen from "./screens/HierarchyScreen";
import ItemTypeScreen from "./screens/ItemTypeScreen";
import MapScreen from "./screens/MapScreen";
import Navbar from "./components/Navbar";
import Modal from "./components/Modal";


function AppContent() {
  
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useSelector((state) => state.auth);
  useEffect(() => {
    // Give time for user to load on refresh
    const timer = setTimeout(() => {
        if (user === null && !isLoading && location.pathname !== '/register') {
            navigate('/');
        }
    }, 100);

    return () => clearTimeout(timer);
}, [user, isLoading, navigate, location.pathname]);
  const hideNavbarRoutes = ['/', '/register'];
  const showNavbar = !hideNavbarRoutes.includes(location.pathname);
  
  // Load user from localStorage on app start
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);
  
  // Load selected project from localStorage when user is loaded
  useEffect(() => {
    if (user) {
      try {
        const savedProject = localStorage.getItem('selectedProject');
        if (savedProject) {
          const project = JSON.parse(savedProject);
          dispatch(setSelectedProject(project));
        }
      } catch (error) {
        console.error('Error loading selected project:', error);
      }
    } else{
      
    }
  }, [user, dispatch]);
  
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
      {showNavbar && <Navbar onOpenModal={openModal} onCloseModal={closeModal} />}
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/hierarchies" element={<HierarchyScreen />} />
        <Route path="/item-types" element={<ItemTypeScreen />} />
        <Route path="/map" element={<MapScreen />} />
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