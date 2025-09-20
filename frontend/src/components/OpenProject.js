import '../styles/projectComponents.css'

const OpenProject = () => {
    return (
        <div>
            <div className="form-group">
                <label htmlFor="project-search" className="form-label">
                    Search Projects:
                </label>
                <input 
                    type="text" 
                    id="project-search"
                    placeholder="Enter project name..."
                    className="form-input"
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="project-list" className="form-label">
                    Available Projects:
                </label>
                <select 
                    id="project-list"
                    className="form-select"
                >
                    <option value="">Select a project...</option>
                    <option value="project1">Sample Project 1</option>
                    <option value="project2">Sample Project 2</option>
                    <option value="project3">Sample Project 3</option>
                </select>
            </div>
            
            <div className="button-group">
                <button className="btn btn-secondary">
                    Cancel
                </button>
                <button className="btn btn-primary">
                    Open Project
                </button>
            </div>
        </div>
    )
}

export default OpenProject
