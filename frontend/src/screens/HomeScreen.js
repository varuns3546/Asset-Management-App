import { useSelector } from 'react-redux'
import Spinner from '../components/Spinner'
import '../styles/homeScreen.css'

const HomeScreen = () => {
    const { selectedProject, isLoading } = useSelector((state) => state.projects)

    if (isLoading) {
        return <Spinner />
    }

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