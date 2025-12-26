import React, { useState } from 'react';
import visualizationService from '../services/visualizationService';
import { useRouteMount } from '../contexts/RouteMountContext';
import useDebouncedAsync from '../hooks/useDebouncedAsync';
import useProjectData from '../hooks/useProjectData';
import BarChart from '../components/visualization/BarChart';
import PieChart from '../components/visualization/PieChart';
import LineChart from '../components/visualization/LineChart';
import StatCard from '../components/visualization/StatCard';
import '../styles/visualizationScreen.css';

const VisualizationScreen = () => {
  const { selectedProject, user } = useProjectData();
  const [questionnaireStats, setQuestionnaireStats] = useState(null);
  const [assetStats, setAssetStats] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isRouteMounted } = useRouteMount();

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

  if (!selectedProject) {
    return (
      <div className="visualization-screen">
        <div className="no-project-message">
          <h2>No Project Selected</h2>
          <p>Please select a project to view visualizations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="visualization-screen">
      <div className="visualization-header">
        <div>
          <h1>Data Visualization</h1>
          <p className="header-subtitle">
            {selectedProject.title || selectedProject.name || 'Project'} - Analytics and Insights
          </p>
        </div>
      </div>

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
                  title="Questionnaire Responses"
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
              <p>Start adding assets and questionnaire responses to see visualizations</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisualizationScreen;

