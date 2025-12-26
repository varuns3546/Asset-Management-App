import React, { useState } from 'react';
import visualizationService from '../services/visualizationService';
import reportService from '../services/reportService';
import { useRouteMount } from '../contexts/RouteMountContext';
import useDebouncedAsync from '../hooks/useDebouncedAsync';
import useProjectData from '../hooks/useProjectData';
import BarChart from '../components/visualization/BarChart';
import PieChart from '../components/visualization/PieChart';
import LineChart from '../components/visualization/LineChart';
import StatCard from '../components/visualization/StatCard';
import ButtonGroup from '../components/forms/ButtonGroup';
import ErrorMessage from '../components/forms/ErrorMessage';
import '../styles/reportsScreen.css';

const ReportsScreen = () => {
  const { selectedProject, user } = useProjectData();
  const [activeTab, setActiveTab] = useState('visualize'); // 'visualize' or 'generate'
  
  // Visualization state
  const [questionnaireStats, setQuestionnaireStats] = useState(null);
  const [assetStats, setAssetStats] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isRouteMounted } = useRouteMount();

  // Report generation state
  const [format, setFormat] = useState('pdf');
  const [sections, setSections] = useState({
    summary: true,
    assets: false,
    questionnaire: false,
    assetTypes: false,
    visualization: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load questionnaire stats
  useDebouncedAsync(
    async () => {
      if (!selectedProject?.id || !user?.token) return;

      if (isRouteMounted()) {
        setLoading(true);
      }
      try {
        const data = await visualizationService.getQuestionnaireStats(selectedProject.id, user.token);
        if (data.success && isRouteMounted()) {
          setQuestionnaireStats(data.data);
        }
      } catch (error) {
        if (isRouteMounted()) {
          console.error('Error loading questionnaire stats:', error);
          if (error.response?.data?.details) {
            console.error('Error details:', error.response.data.details);
          }
        }
      } finally {
        if (isRouteMounted()) {
          setLoading(false);
        }
      }
    },
    [selectedProject?.id, user?.token],
    {
      delay: 300,
      shouldRun: (deps) => {
        const [projectId, token] = deps;
        return !!(projectId && token);
      }
    }
  );

  // Load asset stats
  useDebouncedAsync(
    async () => {
      if (!selectedProject?.id || !user?.token) return;

      try {
        const data = await visualizationService.getAssetStats(selectedProject.id, user.token);
        if (data.success && isRouteMounted()) {
          setAssetStats(data.data);
        }
      } catch (error) {
        if (isRouteMounted()) {
          console.error('Error loading asset stats:', error);
          if (error.response?.data?.details) {
            console.error('Error details:', error.response.data.details);
          }
        }
      }
    },
    [selectedProject?.id, user?.token],
    {
      delay: 300,
      shouldRun: (deps) => {
        const [projectId, token] = deps;
        return !!(projectId && token);
      }
    }
  );

  // Load project stats
  useDebouncedAsync(
    async () => {
      if (!selectedProject?.id || !user?.token) return;

      try {
        const data = await visualizationService.getProjectStats(selectedProject.id, user.token);
        if (data.success && isRouteMounted()) {
          setProjectStats(data.data);
        }
      } catch (error) {
        if (isRouteMounted()) {
          console.error('Error loading project stats:', error);
          if (error.response?.data?.details) {
            console.error('Error details:', error.response.data.details);
          }
        }
      }
    },
    [selectedProject?.id, user?.token],
    {
      delay: 300,
      shouldRun: (deps) => {
        const [projectId, token] = deps;
        return !!(projectId && token);
      }
    }
  );

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
          <h1>Reports & Analytics</h1>
          <p className="header-subtitle">
            {selectedProject.title || selectedProject.name || 'Project'} - Data Visualization and Report Generation
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="reports-tabs">
        <button
          className={`tab-button ${activeTab === 'visualize' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualize')}
        >
          Visualize Data
        </button>
        <button
          className={`tab-button ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          Generate Report
        </button>
      </div>

      {/* Tab Content */}
      <div className="reports-content">
        {activeTab === 'visualize' ? (
          <>
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading visualization data...</p>
              </div>
            ) : (
              <div className="visualization-container">
                {/* Project Overview - Stat Cards */}
                {projectStats && (
                  <div className="visualization-section">
                    <h2>Project Overview</h2>
                    <div className="stats-grid">
                      <StatCard
                        title="Total Assets"
                        value={projectStats.counts.assets}
                        icon="📍"
                      />
                      <StatCard
                        title="Attribute Values"
                        value={projectStats.counts.responses}
                        icon="📋"
                      />
                      <StatCard
                        title="Files"
                        value={projectStats.counts.files}
                        icon="📁"
                      />
                      <StatCard
                        title="Asset Types"
                        value={projectStats.counts.assetTypes}
                        icon="🏷️"
                      />
                      {questionnaireStats && (
                        <StatCard
                          title="Completion Rate"
                          value={`${questionnaireStats.summary.completionRate}%`}
                          subtitle={`${questionnaireStats.summary.assetsWithResponses} of ${questionnaireStats.summary.totalAssets} assets`}
                          icon="✓"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Asset Analytics */}
                {assetStats && (
                  <div className="visualization-section">
                    <h2>Asset Analytics</h2>
                    <div className="charts-grid">
                      <div className="chart-card">
                        <PieChart
                          data={assetStats.byType.map(type => ({
                            name: type.typeName,
                            value: type.count
                          }))}
                          dataKey="value"
                          nameKey="name"
                          title="Assets by Type"
                          height={350}
                        />
                      </div>
                      <div className="chart-card">
                        <BarChart
                          data={assetStats.byType.map(type => ({
                            name: type.typeName,
                            count: type.count
                          }))}
                          dataKey="count"
                          nameKey="name"
                          title="Asset Count by Type"
                          height={350}
                        />
                      </div>
                      <div className="chart-card">
                        <PieChart
                          data={[
                            { name: 'With Coordinates', value: assetStats.summary.assetsWithCoordinates },
                            { name: 'Without Coordinates', value: assetStats.summary.assetsWithoutCoordinates }
                          ]}
                          dataKey="value"
                          nameKey="name"
                          title="Assets with Geographic Data"
                          height={350}
                        />
                      </div>
                      {assetStats.depthDistribution && assetStats.depthDistribution.length > 0 && (
                        <div className="chart-card">
                          <BarChart
                            data={assetStats.depthDistribution.map(d => ({
                              name: `Depth ${d.depth}`,
                              count: d.count
                            }))}
                            dataKey="count"
                            nameKey="name"
                            title="Hierarchy Depth Distribution"
                            height={350}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Questionnaire Analytics */}
                {questionnaireStats && (
                  <div className="visualization-section">
                    <h2>Questionnaire Analytics</h2>
                    <div className="charts-grid">
                      {questionnaireStats.byAssetType && questionnaireStats.byAssetType.length > 0 && (
                        <div className="chart-card">
                          <BarChart
                            data={questionnaireStats.byAssetType.map(type => ({
                              name: type.typeName,
                              completionRate: type.totalAssets > 0 
                                ? parseFloat(((type.assetsWithResponses / type.totalAssets) * 100).toFixed(2))
                                : 0
                            }))}
                            dataKey="completionRate"
                            nameKey="name"
                            title="Completion Rate by Asset Type (%)"
                            height={350}
                          />
                        </div>
                      )}
                      {questionnaireStats.byAttribute && questionnaireStats.byAttribute.length > 0 && (
                        <div className="chart-card">
                          <BarChart
                            data={questionnaireStats.byAttribute
                              .sort((a, b) => b.responseCount - a.responseCount)
                              .slice(0, 10)
                              .map(attr => ({
                                name: attr.attributeTitle.length > 20 
                                  ? attr.attributeTitle.substring(0, 20) + '...' 
                                  : attr.attributeTitle,
                                count: attr.responseCount
                              }))}
                            dataKey="count"
                            nameKey="name"
                            title="Top 10 Attributes by Response Count"
                            height={350}
                          />
                        </div>
                      )}
                      {questionnaireStats.timeline && questionnaireStats.timeline.length > 0 && (
                        <div className="chart-card">
                          <LineChart
                            data={questionnaireStats.timeline}
                            dataKey="count"
                            nameKey="date"
                            title="Response Completion Timeline"
                            height={350}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* No Data Message */}
                {!loading && !questionnaireStats && !assetStats && !projectStats && (
                  <div className="no-data-message">
                    <h2>No Data Available</h2>
                    <p>Start adding assets and attribute values to see visualizations</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
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
                    checked={sections.questionnaire}
                    onChange={() => handleSectionChange('questionnaire')}
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
        )}
      </div>
    </div>
  );
};

export default ReportsScreen;

