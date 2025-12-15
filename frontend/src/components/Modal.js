import React, { useRef } from 'react'
import '../styles/modal.css'

const Modal = ({ isOpen, onClose, children, title }) => {
    const contentRef = useRef(null)
    const mouseDownLocationRef = useRef(null) // 'overlay' or 'content' or null
    const mouseUpLocationRef = useRef(null) // 'overlay' or 'content' or null
    
    if (!isOpen) return null

    const handleMouseDown = (e) => {
        // Track where mousedown occurred
        if (e.target === e.currentTarget) {
            // Clicked directly on overlay
            mouseDownLocationRef.current = 'overlay'
        } else if (contentRef.current && contentRef.current.contains(e.target)) {
            // Clicked inside content
            mouseDownLocationRef.current = 'content'
        } else {
            mouseDownLocationRef.current = 'overlay'
        }
        // Reset mouseup location
        mouseUpLocationRef.current = null
    }

    const handleMouseUp = (e) => {
        // Track where mouseup occurred
        if (e.target === e.currentTarget) {
            // Released on overlay
            mouseUpLocationRef.current = 'overlay'
        } else if (contentRef.current && contentRef.current.contains(e.target)) {
            // Released inside content
            mouseUpLocationRef.current = 'content'
        } else {
            mouseUpLocationRef.current = 'overlay'
        }
    }

    const handleClick = (e) => {
        // Only close if:
        // 1. Mousedown started on overlay
        // 2. Mouseup ended on overlay
        // This prevents closing when:
        // - Dragging text selection from inside to outside
        // - Clicking outside but releasing inside
        if (mouseDownLocationRef.current === 'overlay' && 
            mouseUpLocationRef.current === 'overlay' &&
            e.target === e.currentTarget) {
            onClose()
        }
        // Reset tracking
        mouseDownLocationRef.current = null
        mouseUpLocationRef.current = null
    }

    return (
        <div 
            className="overlay" 
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
        >
            <div className="content" ref={contentRef}>
                <div className="header">
                    <h2 className="title">{title}</h2>
                    <button className="close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className="body">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default Modal
