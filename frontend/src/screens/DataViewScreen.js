import { useState, useEffect } from 'react';
import useProjectData from '../hooks/useProjectData';
import SurveyDataSection from '../components/dataView/SurveyDataSection';
import AssetsDataSection from '../components/dataView/AssetsDataSection';
import HierarchyDataSection from '../components/dataView/HierarchyDataSection';
import PhotosDataSection from '../components/dataView/PhotosDataSection';
import FilesDataSection from '../components/dataView/FilesDataSection';
import ErrorMessage from '../components/forms/ErrorMessage';
import '../styles/dataViewScreen.css';

const DataViewScreen = () => {
    const { selectedProject, user } = useProjectData();
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('surveys');

    useEffect(() => {
        if (!selectedProject) {
            setError('No project selected. Please select a project first.');
        } else {
            setError('');
        }
    }, [selectedProject]);

    const tabs = [
        { id: 'surveys', label: 'Surveys' },
        { id: 'assets', label: 'Assets' },
        { id: 'hierarchy', label: 'Hierarchy' },
        { id: 'photos', label: 'Photos' },
        { id: 'files', label: 'Files' }
    ];

    const renderTabContent = () => {
        if (!selectedProject) return null;

        switch (activeTab) {
            case 'surveys':
                return <SurveyDataSection projectId={selectedProject.id} user={user} />;
            case 'assets':
                return <AssetsDataSection projectId={selectedProject.id} user={user} />;
            case 'hierarchy':
                return <HierarchyDataSection projectId={selectedProject.id} user={user} />;
            case 'photos':
                return <PhotosDataSection projectId={selectedProject.id} user={user} />;
            case 'files':
                return <FilesDataSection projectId={selectedProject.id} user={user} />;
            default:
                return null;
        }
    };

    if (!selectedProject) {
        return (
            <div className="data-view-screen">
                <div className="data-view-container">
                    <h1>Data View</h1>
                    <ErrorMessage message="No project selected. Please select a project first." />
                </div>
            </div>
        );
    }

    return (
        <div className="data-view-screen">
            <div className="data-view-container">
                <h1>Data View</h1>
                <p className="data-view-subtitle">View all project data: surveys, assets, hierarchy, photos, and files</p>
                
                {error && <ErrorMessage message={error} />}

                <div className="tabs-container">
                    <div className="tabs-navigation">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="tab-content">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataViewScreen;

