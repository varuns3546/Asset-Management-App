import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'
import '../styles/navbar.css'
import Dropdown from './Dropdown'
import ShareProjectModal from './ShareProjectModal'

const Navbar = ({ onOpenModal, onCloseModal }) => {
    const [openDropdown, setOpenDropdown] = useState(null)
    const navbarRef = useRef(null)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { user } = useSelector((state) => state.auth)
    const toggleDropdown = (dropdownName) => {
        setOpenDropdown(openDropdown === dropdownName ? null : dropdownName)
    }
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (navbarRef.current && !navbarRef.current.contains(event.target)) {
                setOpenDropdown(null)
            }
        }
        
        // Add event listener when a dropdown is open
        if (openDropdown) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        
        // Cleanup event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [openDropdown])
    
    const handleNavigate = (path) => {
        navigate(path)
        setOpenDropdown(null)
    }

    const handleLogout = () => {
        dispatch(logout())
        navigate('/')
        setOpenDropdown(null)
    }

    const handleUserOptionClick = (option) => {
        if (option === 'Usage') {
            handleNavigate('/usage')
        } else if (option === 'Logout') {
            handleLogout()
        }
    }

    const userFirstName = user?.firstName || user?.first_name || 'User'

    return (
        <div className="container" ref={navbarRef}>
            <button className="button" onClick={() => handleNavigate('/home')}>Home</button>
            <Dropdown 
                title="Projects" 
                options={['Save Project', 'My Projects', 'Shared with me', 'Create Project', 'Upload File']} 
                isOpen={openDropdown === 'projects'}
                onToggle={() => toggleDropdown('projects')}
                onOpenModal={onOpenModal}
                onCloseModal={onCloseModal}
            />
            <button className="button" onClick={() => handleNavigate('/pull-requests')}>Pull Requests</button>
            <Dropdown 
                title="View" 
                options={['Data', 'Map', 'Charts and Graphs', 'Reports']} 
                isOpen={openDropdown === 'view'}
                onToggle={() => toggleDropdown('view')}
            />
            <Dropdown 
                title="Structure" 
                options={['Asset Hierarchy', 'Asset Types']} 
                isOpen={openDropdown === 'structure'}
                onToggle={() => toggleDropdown('structure')}
            />
            <Dropdown
                title="Enter Data"
                options={['Questionnaire', 'Geodata', 'Upload']}
                isOpen={openDropdown === 'enterData'}
                onToggle={() => toggleDropdown('enterData')}
            />
            <Dropdown
                title="Generate"
                options={['Visualize Data', 'Reports']}
                isOpen={openDropdown === 'generate'}
                onToggle={() => toggleDropdown('generate')}
            />
            <button className="button" onClick={() => onOpenModal(<ShareProjectModal onClose={onCloseModal} />, 'Share Project')}>
                Share
            </button>
            <Dropdown
                title={userFirstName}
                options={['Usage', 'Logout']}
                isOpen={openDropdown === 'user'}
                onToggle={() => toggleDropdown('user')}
                className="user-dropdown-container"
                onOptionClick={(option) => {
                    handleUserOptionClick(option)
                    return true // Indicate we handled it
                }}
            />
        </div>
    )
}

export default Navbar