import { useSelector } from 'react-redux'

const HomeScreen = () => {
    const { selectedProject } = useSelector((state) => state.projects)
    
    return (
        <div>
            {selectedProject ? (
                <h1>{selectedProject.title}</h1>
            ) : (
                <p>No project selected</p>
            )}
        </div>
    )
}

export default HomeScreen