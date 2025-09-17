import { useNavigate } from 'react-router-dom'
import '../styles/dropdown.css'

const Dropdown = ({title, options, isOpen, onToggle}) => {
    const navigate = useNavigate()
    
    const handleOptionClick = (option) => {
        // Map options to routes based on your available screens
        const routeMap = {
            'Asset Hierarchy': '/hierarchies',
            'Open Project': '/projects',
            // Add more mappings as needed for other options
        }
        
        if (routeMap[option]) {
            navigate(routeMap[option])
        }
        onToggle() // Close dropdown after navigation
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