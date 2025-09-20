import '../styles/projectComponents.css'

const CreateProject = () => {
    return (
        <div>
            <div className="form-group">
                <label htmlFor="project-name" className="form-label">
                    Project Name:
                </label>
                <input 
                    type="text" 
                    id="project-name"
                    placeholder="Enter project name..."
                    className="form-input"
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="project-description" className="form-label">
                    Description:
                </label>
                <textarea 
                    id="project-description"
                    placeholder="Enter project description..."
                    rows="4"
                    className="form-textarea"
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="project-type" className="form-label">
                    Project Type:
                </label>
                <select 
                    id="project-type"
                    className="form-select"
                >
                    <option value="">Select project type...</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="software">Software Development</option>
                    <option value="research">Research</option>
                    <option value="other">Other</option>
                </select>
            </div>
            
            <div className="button-group">
                <button className="btn btn-secondary">
                    Cancel
                </button>
                <button className="btn btn-success">
                    Create Project
                </button>
            </div>
        </div>
    )
}

export default CreateProject

