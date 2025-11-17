import { useSelector } from 'react-redux'
import '../styles/homeScreen.css'
const HomeScreen = () => {
    const { selectedProject } = useSelector((state) => state.projects)

    return (
        <div>
            {selectedProject ? (
                <h1 className="project-title">{selectedProject.title}</h1>
            ) : (
                <p className="project-title">No project selected</p>
            )}
        </div>
    )
}

export default HomeScreen