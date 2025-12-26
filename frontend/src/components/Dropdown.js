import { useNavigate } from 'react-router-dom'
import React from 'react'
import CreateProjectModal from './CreateProjectModal'
import MyProjectsModal from './MyProjectsModal'
import SharedProjectsModal from './SharedProjectsModal'
import GenerateReportModal from './GenerateReportModal'
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
        
        // Handle modal options
        if (onOpenModal && (option === 'Create Project' || option === 'My Projects' || option === 'Shared with Me' || option === 'Reports')) {
            console.log('Opening modal for:', option) // Debug log
            if (option === 'Create Project') {
                onOpenModal(<CreateProjectModal onClose={onCloseModal} />, 'Create Project')
            } else if (option === 'My Projects') {
                onOpenModal(<MyProjectsModal onClose={onCloseModal} />, 'My Projects')
            } else if (option === 'Shared with Me') {
                onOpenModal(<SharedProjectsModal onClose={onCloseModal} />, 'Shared with Me')
            } else if (option === 'Reports') {
                onOpenModal(<GenerateReportModal onClose={onCloseModal} />, 'Generate Report')
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
                'Visualize Data': '/visualize',
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