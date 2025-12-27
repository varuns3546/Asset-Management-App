import React, { useState } from 'react';
import reportService from '../services/reportService';
import useProjectData from '../hooks/useProjectData';
import ButtonGroup from '../components/forms/ButtonGroup';
import ErrorMessage from '../components/forms/ErrorMessage';
import '../styles/reportsScreen.css';

const ReportsScreen = () => {
  const { selectedProject, user } = useProjectData();

  // Report generation state
  const [format, setFormat] = useState('pdf');
  const [sections, setSections] = useState({
    summary: true,
    assets: false,
    survey: false,
    assetTypes: false,
    visualization: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Report generation handlers
  const handleSectionChange = (section) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleGenerate = async () => {
    // Check if at least one section is selected
    const selectedSections = Object.entries(sections)
      .filter(([_, selected]) => selected)
      .map(([section, _]) => section);

    if (selectedSections.length === 0) {
      setError('Please select at least one section to include in the report.');
      return;
    }

    if (!selectedProject?.id) {
      setError('Please select a project first.');
      return;
    }

    if (!user?.token) {
      setError('You must be logged in to generate reports.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      const options = {
        format,
        sections: selectedSections
      };

      const response = await reportService.generateReport(
        selectedProject.id,
        options,
        user.token
      );

      // Create blob from response
      const blob = new Blob([response], {
        type: format === 'pdf' 
          ? 'application/pdf' 
          : format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      });

      // Generate filename
      const extension = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv';
      const projectName = (selectedProject.name || selectedProject.title || 'project')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      const filename = `report_${projectName}_${Date.now()}.${extension}`;

      // Download the file
      reportService.downloadReport(blob, filename);

      setSuccess(`Report generated and downloaded successfully as ${filename}`);
      setIsGenerating(false);

    } catch (err) {
      console.error('Error generating report:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to generate report';
      setError(errorMessage);
      setIsGenerating(false);
    }
  };

  if (!selectedProject) {
    return (
      <div className="reports-screen">
        <div className="no-project-message">
          <h2>No Project Selected</h2>
          <p>Please select a project to view reports and visualizations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-screen">
      <div className="reports-header">
        <div>
          <h1>Report Generation</h1>
          <p className="header-subtitle">
            {selectedProject.title || selectedProject.name || 'Project'} - Generate Reports
          </p>
        </div>
      </div>

      <div className="reports-content">
        <div className="generate-report-section">
            <div className="form-section">
              <h3>Project: {selectedProject.name || selectedProject.title || 'Untitled Project'}</h3>
            </div>

            <div className="form-section">
              <h3>Select Format</h3>
              <div className="format-selection">
                <label className="format-option">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={format === 'pdf'}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  <span>PDF</span>
                </label>
                <label className="format-option">
                  <input
                    type="radio"
                    name="format"
                    value="excel"
                    checked={format === 'excel'}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  <span>Excel (XLSX)</span>
                </label>
                <label className="format-option">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  <span>CSV</span>
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>Select Sections</h3>
              <div className="sections-selection">
                <label className="section-option">
                  <input
                    type="checkbox"
                    checked={sections.summary}
                    onChange={() => handleSectionChange('summary')}
                  />
                  <span>Project Summary</span>
                  <p className="section-description">Overview statistics, completion rates, and project metadata</p>
                </label>
                <label className="section-option">
                  <input
                    type="checkbox"
                    checked={sections.assets}
                    onChange={() => handleSectionChange('assets')}
                  />
                  <span>Asset Inventory</span>
                  <p className="section-description">Complete list of all assets with details</p>
                </label>
                <label className="section-option">
                  <input
                    type="checkbox"
                    checked={sections.survey}
                    onChange={() => handleSectionChange('survey')}
                  />
                  <span>Attribute Values</span>
                  <p className="section-description">All attribute values grouped by asset</p>
                </label>
                <label className="section-option">
                  <input
                    type="checkbox"
                    checked={sections.assetTypes}
                    onChange={() => handleSectionChange('assetTypes')}
                  />
                  <span>Asset Types Breakdown</span>
                  <p className="section-description">Asset types, attributes, and counts</p>
                </label>
                <label className="section-option">
                  <input
                    type="checkbox"
                    checked={sections.visualization}
                    onChange={() => handleSectionChange('visualization')}
                  />
                  <span>Data Visualization</span>
                  <p className="section-description">Charts, statistics, and analytics data</p>
                </label>
              </div>
            </div>

            {error && <ErrorMessage message={error} />}
            {success && <div className="success-message">{success}</div>}

            <ButtonGroup
              buttons={[
                {
                  label: isGenerating ? 'Generating...' : 'Generate Report',
                  variant: 'primary',
                  onClick: handleGenerate,
                  disabled: isGenerating
                }
              ]}
            />
          </div>
      </div>
    </div>
  );
};

export default ReportsScreen;

