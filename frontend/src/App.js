// App.js
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { loadUser } from "./features/auth/authSlice";
import { getSelectedProject } from "./features/projects/projectSlice"
import authService from "./features/auth/authService";
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
  const [authChecked, setAuthChecked] = useState(false);

  // Load user from localStorage on app start
  useEffect(() => {
    dispatch(loadUser()).finally(() => {
      setAuthChecked(true);
    });
  }, [dispatch]);
  
  // Protect routes - only redirect if not authenticated
  useEffect(() => {
    // Don't do anything until initial auth check is complete
    if (!authChecked || isLoading) {
      return;
    }

    const isAuthRoute = location.pathname === '/' || location.pathname === '/register';
    
    // Only redirect if trying to access protected route without authentication
    if (user === null && !isAuthRoute) {
      navigate('/', { replace: true });
    }
    // Don't automatically redirect away from any route if authenticated
    // Let the user stay on whatever route they're on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, user, isLoading, location.pathname]); // navigate is stable from React Router
  
  const hideNavbarRoutes = ['/', '/register'];
  const showNavbar = !hideNavbarRoutes.includes(location.pathname);
  
  // Load selected project from user_profiles when user is loaded
  // Also initialize token refresh timer
  useEffect(() => {
    if (user) {
      dispatch(getSelectedProject());
      authService.initializeRefreshTimer();
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
      <div style={{ paddingTop: showNavbar ? '53px' : '0' }}>
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/hierarchies" element={<HierarchyScreen />} />
          <Route path="/item-types" element={<ItemTypeScreen />} />
          <Route path="/map" element={<MapScreen />} />
        </Routes>
      </div>
      
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