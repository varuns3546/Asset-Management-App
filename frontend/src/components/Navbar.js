import { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'
import '../styles/navbar.css'
import Dropdown from './Dropdown'

const Navbar = ({ onOpenModal, onCloseModal }) => {
    const [openDropdown, setOpenDropdown] = useState(null)
    const navbarRef = useRef(null)
    const dispatch = useDispatch()
    const navigate = useNavigate()
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
    
    const handleLogout = () => {
        dispatch(logout())
        navigate('/')
    }

    return (
        <div className="container" ref={navbarRef}>
            <Dropdown 
                title="Projects" 
                options={['Open Project', 'Create Project']} 
                isOpen={openDropdown === 'projects'}
                onToggle={() => toggleDropdown('projects')}
                onOpenModal={onOpenModal}
                onCloseModal={onCloseModal}
            />
            <Dropdown 
                title="View" 
                options={['Data', 'Map', 'Charts and Graphs', 'Reports']} 
                isOpen={openDropdown === 'view'}
                onToggle={() => toggleDropdown('view')}
            />
            <Dropdown 
                title="Structure" 
                options={['Asset Hierarchy', 'Item Types']} 
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
            <button className="button">Share</button>
            <button className="button" onClick={handleLogout}>Logout</button>
        </div>
    )
}

export default Navbar