import { useNavigate } from 'react-router-dom'
import React from 'react'
import OpenProject from './OpenProject'
import CreateProject from './CreateProject'
import '../styles/navbar.css'

const Dropdown = ({title, options, isOpen, onToggle, onOpenModal, onCloseModal}) => {
    const navigate = useNavigate()
    
    const handleOptionClick = (option) => {
        // Handle modal options only for Projects dropdown
        if (onOpenModal && (option === 'Open Project' || option === 'Create Project')) {
            console.log('Opening modal for:', option) // Debug log
            if (option === 'Open Project') {
                onOpenModal(<OpenProject onClose={onCloseModal} />, 'Open Project')
            } else if (option === 'Create Project') {
                onOpenModal(<CreateProject onClose={onCloseModal} />, 'Create Project')
            }
        } else {
            // Map other options to routes
            const routeMap = {
                'Asset Hierarchy': '/hierarchies',
                'Item Types': '/item-types',
                'Map': '/map',
            }
            
            if (routeMap[option]) {
                navigate(routeMap[option])
            }
        }
        onToggle() // Close dropdown after action
    }
    
    return (
        <div className="dropdown-container">
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