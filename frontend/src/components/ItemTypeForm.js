import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'


const ItemTypeForm = () => {
    const dispatch = useDispatch()
    const { selectedProject, isLoading } = useSelector((state) => state.projects)

    const [formData, setFormData] = useState({
        itemsTypes: []
    })

    return (
        <div>
            <h1>Item Type Form</h1>
        </div>
    )
}

export default ItemTypeForm;