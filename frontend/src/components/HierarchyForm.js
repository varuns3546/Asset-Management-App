import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateHierarchy } from '../features/projects/projectSlice'
import '../styles/hierarchyForm.css'

const HierarchyForm = () => {
    const dispatch = useDispatch()
    const { selectedProject, isLoading } = useSelector((state) => state.projects)
    
    // Form state
    const [formData, setFormData] = useState({
        items: []
    })
    
    // Individual item state for adding new items
    const [newItem, setNewItem] = useState({
        title: '',
        parentId: null
    })
    
    const handleInputChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }
    
    const handleNewItemChange = (e) => {
        setNewItem(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }
    
    const addItem = () => {
        if (newItem.title.trim()) {
            const item = {
                id: Date.now(), // temporary ID for frontend
                title: newItem.title,
                parentId: newItem.parentId ? parseInt(newItem.parentId) : null
            }
            
            setFormData(prev => ({
                ...prev,
                items: [...prev.items, item]
            }))
            
            // Reset new item form
            setNewItem({
                title: '',
                parentId: null
            })
        }
    }
    
    const removeItem = (itemId) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== itemId)
        }))
    }
    
    
    const handleUpdateHierarchy = (e) => {
        e.preventDefault()
        
        if (!selectedProject) {
            alert('Please select a project first')
            return
        }
        
        if (!formData.title.trim()) {
            alert('Please enter a hierarchy title')
            return
        }
        
        const hierarchyData = {
            title: formData.title,
            description: formData.description,
            items: formData.items.map(item => ({
                title: item.title,
                parentId: item.parentId
            }))
        }
        
        console.log('Sending hierarchy data:', hierarchyData)
        
        dispatch(updateHierarchy({ 
            hierarchyData, 
            projectId: selectedProject.id 
        }))
        
        // Reset form after successful creation
        setFormData({
            title: '',
            description: '',
            items: []
        })
    }
    
    return (
        <div className="hierarchy-form">
            <form onSubmit={handleUpdateHierarchy}>
                {/* Add New Item Section */}
                <div className="add-item-section">
                    <h3>Add Items</h3>
                    
                    <div className="form-group">
                        <label htmlFor="itemTitle">Item Title *</label>
                        <input
                            type="text"
                            id="itemTitle"
                            name="title"
                            value={newItem.title}
                            onChange={handleNewItemChange}
                            placeholder="Enter item title"
                            className="form-input"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="parentItem">Parent Item (Optional)</label>
                        <select
                            id="parentItem"
                            name="parentId"
                            value={newItem.parentId || ''}
                            onChange={handleNewItemChange}
                            className="form-select"
                        >
                            <option value="">No parent (root item)</option>
                            {formData.items.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <button
                        type="button"
                        onClick={addItem}
                        className="add-item-button"
                    >
                        Add Item
                    </button>
                </div>
                
                {/* Display Added Items */}
                {formData.items.length > 0 && (
                    <div className="added-items">
                        <h3>Added Items ({formData.items.length})</h3>
                        <div className="items-list">
                            {formData.items.map(item => {
                                const parentItem = item.parentId ? 
                                    formData.items.find(p => p.id === item.parentId) : null;
                                
                                return (
                                    <div key={item.id} className="item-card">
                                        <div className="item-info">
                                            <span className="item-title">{item.title}</span>
                                            {parentItem && (
                                                <span className="item-parent">
                                                    (Child of: {parentItem.title})
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="remove-item-button"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
                
                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="submit-button"
                >
                    {isLoading ? 'Creating...' : 'Create Hierarchy'}
                </button>
            </form>
        </div>
    )
}

export default HierarchyForm