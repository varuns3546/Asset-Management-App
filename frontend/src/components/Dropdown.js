import { useNavigate } from 'react-router-dom'
import React from 'react'
import OpenProjectModal from './OpenProjectModal'
import CreateProjectModal from './CreateProjectModal'
import '../styles/navbar.css'

const Dropdown = ({title, options, isOpen, onToggle, onOpenModal, onCloseModal, onOptionClick, className}) => {
    const navigate = useNavigate()
    
    const handleOptionClick = (option) => {
        // If custom handler provided, call it first
        if (onOptionClick) {
            const handled = onOptionClick(option)
            // If handler returns true, it handled the action and we should close dropdown
            if (handled) {
                onToggle()
                return
            }
        }
        
        // Handle modal options only for Projects dropdown
        if (onOpenModal && (option === 'Open Project' || option === 'Create Project')) {
            console.log('Opening modal for:', option) // Debug log
            if (option === 'Open Project') {
                onOpenModal(<OpenProjectModal onClose={onCloseModal} />, 'Open Project')
            } else if (option === 'Create Project') {
                onOpenModal(<CreateProjectModal onClose={onCloseModal} />, 'Create Project')
            }
        } else {
            // Map other options to routes
            const routeMap = {
                'Asset Hierarchy': '/hierarchies',
                'Asset Types': '/asset-types',
                'Map': '/map',
                'Leaflet': '/leaflet',
                'Questionnaire': '/questionnaire',
                'Usage': '/usage',
            }
            
            if (routeMap[option]) {
                navigate(routeMap[option])
            }
        }
        onToggle() // Close dropdown after action
    }
    
    return (
        <div className={`dropdown-container ${className || ''}`}>
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