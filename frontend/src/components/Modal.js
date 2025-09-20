import React from 'react'
import '../styles/modal.css'

const Modal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div className="overlay" onClick={handleBackdropClick}>
            <div className="content">
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
