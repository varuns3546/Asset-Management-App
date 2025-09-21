import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getHierarchies, createHierarchy, updateHierarchy, deleteHierarchy, reset } from '../features/hierarchies/hierarchySlice';
import { loadUser } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
const HierarchyScreen = () => {
    const { hierarchies, isLoading, isError, message } = useSelector((state) => state.hierarchies);
    const { selectedProject } = useSelector((state) => state.projects);
    const dispatch = useDispatch();
    const navigate = useNavigate()  
    
    useEffect(() => {
        dispatch(loadUser())
    }, [dispatch])
    
    const {user} = useSelector((state) => state.auth)

    useEffect(() => {
        if (!user) {
            navigate('/')
            return
        }
    }, [user, navigate])

    useEffect(() => {
        if (selectedProject) {
            console.log('Using selected project:', selectedProject);
            dispatch(getHierarchies(selectedProject.id))
        } else {
            console.log('No project selected. Please open a project first.');
        }
        return () => {
            dispatch(reset())
        }
    }, [selectedProject, dispatch])

    useEffect(() => {
        if (isError) {
            console.log('Error:', message)
        }
    }, [isError, message])

    return (
        <div>
            {selectedProject ? (
                <div>
                    <h2>Asset Hierarchy - {selectedProject.title}</h2>
                    <p>Project ID: {selectedProject.id}</p>
                    {isLoading && <p>Loading hierarchies...</p>}
                    {hierarchies && hierarchies.length > 0 ? (
                        <div>
                            <h3>Hierarchies:</h3>
                            <ul>
                                {hierarchies.map((hierarchy) => (
                                    <li key={hierarchy.id}>
                                        {hierarchy.name || hierarchy.title || `Hierarchy ${hierarchy.id}`}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p>No hierarchies found for this project.</p>
                    )}
                </div>
            ) : (
                <div>
                    <h2>Asset Hierarchy</h2>
                    <p>Please select a project first using the "Open Project" option.</p>
                </div>
            )}
        </div>
    )
}

export default HierarchyScreen;