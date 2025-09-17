import { useState, useEffect, useRef } from 'react'
import '../styles/navbar.css'
import Dropdown from './Dropdown'

const Navbar = () => {
    const [openDropdown, setOpenDropdown] = useState(null)
    const navbarRef = useRef(null)
    
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
    
    return (
        <div className="container" ref={navbarRef}>
            <Dropdown 
                title="Projects" 
                options={['Open Project', 'Create Project']} 
                isOpen={openDropdown === 'projects'}
                onToggle={() => toggleDropdown('projects')}
            />
            <Dropdown 
                title="View" 
                options={['Data', 'Map', 'Charts and Graphs', 'Reports']} 
                isOpen={openDropdown === 'view'}
                onToggle={() => toggleDropdown('view')}
            />
            <Dropdown 
                title="Structure" 
                options={['Asset Hierarchy']} 
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
            <button className="button">Logout</button>
        </div>
    )
}

export default Navbar