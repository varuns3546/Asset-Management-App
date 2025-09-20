import { useNavigate } from 'react-router-dom'
import React from 'react'
import OpenProject from './OpenProject'
import CreateProject from './CreateProject'
import '../styles/dropdown.css'

const Dropdown = ({title, options, isOpen, onToggle, onOpenModal}) => {
    const navigate = useNavigate()
    
    const handleOptionClick = (option) => {
        console.log('Option clicked:', option, 'onOpenModal:', !!onOpenModal) // Debug log
        
        // Handle modal options only for Projects dropdown
        if (onOpenModal && (option === 'Open Project' || option === 'Create Project')) {
            console.log('Opening modal for:', option) // Debug log
            if (option === 'Open Project') {
                onOpenModal(<OpenProject />, 'Open Project')
            } else if (option === 'Create Project') {
                onOpenModal(<CreateProject />, 'Create Project')
            }
        } else {
            // Map other options to routes
            const routeMap = {
                'Asset Hierarchy': '/hierarchies',
                // Add more mappings as needed for other options
            }
            
            if (routeMap[option]) {
                navigate(routeMap[option])
            }
        }
        onToggle() // Close dropdown after action
    }
    
    return (
        <div className="container">
            <button className="button" onClick={onToggle}>{title}</button>
            {isOpen && (
                <div className="options">
                    {options.map((option) => (
                        <button 
                            key={option} 
                            onClick={() => handleOptionClick(option)}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Dropdown