import { useState, useEffect } from 'react'
import {useSelector, useDispatch} from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loadUser } from '../features/auth/authSlice'
import { createProject, getProjects, reset } from '../features/projects/projectSlice'


const OpenProjectScreen = () => {
    const dispatch = useDispatch()    
    const navigate = useNavigate()

    const { projects, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.projects)

    useEffect(() => {
            dispatch(loadUser())
        }, [])

    const {user} = useSelector((state) => state.auth)

    useEffect(() => {
        if (!user) {
            navigate('/')
            return
        }
        dispatch(getProjects())
        return () => {
            dispatch(reset())
        }
    }, [user, dispatch])

    useEffect(() => {
        if (isError) {
            console.log('Error:', message)
        }
    }, [isError, message])

    const [creatingProject, setCreatingProject] = useState(false)
    const [formData, setFormData] = useState({
        title: '', 
        description: '',
      })
    const { title, description } = formData

    const updateField = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }; 
    const handleCreateProject = (e) => {
        e.preventDefault()
        dispatch(createProject(formData))
        setCreatingProject(false)        
    }
    return (
        <div>
            <button onClick={()=>setCreatingProject(true)}>Create Project</button>
            {creatingProject && 
             <form onSubmit={handleCreateProject}>
                <input 
                    type="title" 
                    placeholder="Title" 
                    value={title}
                    onChange={(e) => updateField('title', e.target.value)}
                    required
                />
                <input 
                    type="description" 
                    placeholder="Description" 
                    value={description}
                    onChange={(e) => updateField('description', e.target.value)}
                    required
                />
                <button type="submit">Create Project</button>
            </form>
            }
        </div>
    )
}

export default OpenProjectScreen