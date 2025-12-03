import '../styles/spinner.css';

const Spinner = () => {
    return (
        <div className="spinner-container">
            <div className="spinner"></div>
            <span className="spinner-text">Loading...</span>
        </div>
    );
};

export default Spinner;
