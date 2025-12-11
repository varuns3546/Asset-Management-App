import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import metricsService from '../services/metricsService';
import StorageWarningBanner from '../components/StorageWarningBanner';
import '../styles/homeScreen.css';

const HomeScreen = () => {
  const { selectedProject } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);
  const [metrics, setMetrics] = useState(null);
  const [allProjectsMetrics, setAllProjectsMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load metrics when project is selected
  useEffect(() => {
    if (selectedProject && user) {
      loadMetrics();
      setDismissedWarning(false);
    }
  }, [selectedProject, user]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Fetch both individual project metrics and all projects metrics in parallel
      const [projectData, allProjectsData] = await Promise.all([
        metricsService.getProjectMetrics(selectedProject.id, user.token),
        metricsService.getAllProjectsMetrics(user.token)
      ]);
      
      if (projectData.success) {
        setMetrics(projectData.data);
      }
      if (allProjectsData.success) {
        setAllProjectsMetrics(allProjectsData.data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      await metricsService.exportProjectData(selectedProject.id, user.token);
      alert('Project data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export project data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleRefreshMetrics = () => {
    loadMetrics();
  };

  if (!selectedProject) {
    return (
      <div className="home-screen">
        <div className="welcome-message">
          <h1>Welcome to GIS Vulnerability Assessment Tool</h1>
          <p>Please select a project from the sidebar to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-screen">
      <div className="home-header">
        <div>
          <h1>Project Dashboard</h1>
          <p className="project-name">{selectedProject.name}</p>
        </div>
        <button 
          onClick={handleRefreshMetrics}
          className="refresh-btn"
          disabled={loading}
        >
          🔄 {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Data Source Info Banner */}
      {metrics && metrics.usingOfficialMetrics && (
        <div className="info-banner official-metrics-banner">
          <span className="info-icon">✓</span>
          <span className="info-text">
            Using <strong>official Supabase metrics</strong> - 100% accurate data from your project settings!
          </span>
        </div>
      )}

      {/* Storage Warning Banner */}
      {metrics && !dismissedWarning && (
        <StorageWarningBanner 
          metrics={metrics}
          onExport={handleExportData}
          onDismiss={() => setDismissedWarning(true)}
        />
      )}

      {/* Metrics Overview */}
      {loading && !metrics ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading project metrics...</p>
        </div>
      ) : metrics ? (
        <div className="metrics-container">
          {/* Storage Metrics */}
          <div className="metrics-section">
            <h2>Storage Usage</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <h3>
                    Database 
                    {metrics.database.dataSource === 'official' && <span className="official-badge" title="Official Supabase metrics">✓</span>}
                    {metrics.database.dataSource === 'sql_accurate' && <span className="official-badge" title="SQL-based accurate measurement">✓</span>}
                    {metrics.database.isEstimate && <span className="estimate-badge" title="Estimated size">~</span>}
                  </h3>
                  <span className={`status-badge ${metrics.database.warning ? 'warning' : 'healthy'}`}>
                    {metrics.database.warning ? '⚠️ Warning' : '✓ Healthy'}
                  </span>
                </div>
                <div className="metric-value">
                  {metrics.database.sizeWithOverheadFormatted || metrics.database.sizeFormatted}
                  <span className="metric-limit"> / {metrics.database.limitFormatted}</span>
                </div>
                {metrics.database.sizeWithOverhead && (
                  <div className="metric-breakdown">
                    <span className="breakdown-item">Your data: {metrics.database.sizeFormatted}</span>
                    <span className="breakdown-item">Supabase overhead: {metrics.database.supabaseOverheadFormatted}</span>
                  </div>
                )}
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${metrics.database.percentage > 90 ? 'critical' : metrics.database.percentage > 80 ? 'warning' : ''}`}
                    style={{ width: `${Math.min(metrics.database.percentage, 100)}%` }}
                  />
                </div>
                <p className="metric-percentage">
                  {metrics.database.percentage.toFixed(1)}% used
                  {metrics.database.dataSource === 'sql_accurate' && <span className="official-note"> (includes Supabase overhead)</span>}
                  {metrics.database.dataSource === 'official' && <span className="official-note"> (official)</span>}
                  {metrics.database.isEstimate && <span className="estimate-note"> (estimated)</span>}
                </p>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <h3>
                    File Storage 
                    {metrics.storage.dataSource === 'official' && <span className="official-badge" title="Official Supabase metrics">✓</span>}
                    {metrics.storage.bucketsScanned > 0 && !metrics.storage.dataSource === 'official' && <span className="buckets-badge" title={`Scanning ${metrics.storage.bucketsScanned} bucket(s)`}>📦{metrics.storage.bucketsScanned}</span>}
                  </h3>
                  <span className={`status-badge ${metrics.storage.warning ? 'warning' : 'healthy'}`}>
                    {metrics.storage.warning ? '⚠️ Warning' : '✓ Healthy'}
                  </span>
                </div>
                <div className="metric-value">
                  {metrics.storage.sizeFormatted}
                  <span className="metric-limit"> / {metrics.storage.limitFormatted}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${metrics.storage.percentage > 90 ? 'critical' : metrics.storage.percentage > 80 ? 'warning' : ''}`}
                    style={{ width: `${Math.min(metrics.storage.percentage, 100)}%` }}
                  />
                </div>
                <p className="metric-percentage">
                  {metrics.storage.percentage.toFixed(1)}% used
                  {metrics.storage.dataSource === 'official' && <span className="official-note"> (official)</span>}
                  {metrics.storage.bucketsScanned > 0 && metrics.storage.dataSource !== 'official' && <span className="buckets-note"> (across {metrics.storage.bucketsScanned} bucket{metrics.storage.bucketsScanned !== 1 ? 's' : ''})</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Project Statistics */}
          <div className="metrics-section">
            <h2>Project Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📍</div>
                <div className="stat-content">
                  <div className="stat-value">{metrics.counts.assets}</div>
                  <div className="stat-label">Assets</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <div className="stat-value">{metrics.counts.responses}</div>
                  <div className="stat-label">Questionnaire Responses</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📁</div>
                <div className="stat-content">
                  <div className="stat-value">{metrics.counts.files}</div>
                  <div className="stat-label">Files</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🏷️</div>
                <div className="stat-content">
                  <div className="stat-value">{metrics.counts.assetTypes}</div>
                  <div className="stat-label">Asset Types</div>
                </div>
              </div>
            </div>
          </div>

          {/* All Projects Summary */}
          {allProjectsMetrics && (
            <div className="metrics-section all-projects-section">
              <h2>All Projects Summary</h2>
              <div className="summary-banner">
                <span className="summary-icon">📊</span>
                <span className="summary-text">
                  Showing combined metrics across <strong>{allProjectsMetrics.allProjects.projectCount} project(s)</strong>
                </span>
              </div>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <h3>
                      Total Database 
                      {allProjectsMetrics.allProjects.database.isEstimate && <span className="estimate-badge" title="Estimated size">~</span>}
                    </h3>
                    <span className={`status-badge ${allProjectsMetrics.allProjects.database.warning ? 'warning' : 'healthy'}`}>
                      {allProjectsMetrics.allProjects.database.warning ? '⚠️ Warning' : '✓ Healthy'}
                    </span>
                  </div>
                  <div className="metric-value">
                    {allProjectsMetrics.allProjects.database.sizeFormatted}
                    <span className="metric-limit"> / {allProjectsMetrics.allProjects.database.limitFormatted}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${allProjectsMetrics.allProjects.database.percentage > 90 ? 'critical' : allProjectsMetrics.allProjects.database.percentage > 80 ? 'warning' : ''}`}
                      style={{ width: `${Math.min(allProjectsMetrics.allProjects.database.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="metric-percentage">
                    {allProjectsMetrics.allProjects.database.percentage.toFixed(1)}% used (estimated)
                  </p>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <h3>Total File Storage</h3>
                    <span className={`status-badge ${allProjectsMetrics.allProjects.storage.warning ? 'warning' : 'healthy'}`}>
                      {allProjectsMetrics.allProjects.storage.warning ? '⚠️ Warning' : '✓ Healthy'}
                    </span>
                  </div>
                  <div className="metric-value">
                    {allProjectsMetrics.allProjects.storage.sizeFormatted}
                    <span className="metric-limit"> / {allProjectsMetrics.allProjects.storage.limitFormatted}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${allProjectsMetrics.allProjects.storage.percentage > 90 ? 'critical' : allProjectsMetrics.allProjects.storage.percentage > 80 ? 'warning' : ''}`}
                      style={{ width: `${Math.min(allProjectsMetrics.allProjects.storage.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="metric-percentage">
                    {allProjectsMetrics.allProjects.storage.percentage.toFixed(1)}% used
                  </p>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📍</div>
                  <div className="stat-content">
                    <div className="stat-value">{allProjectsMetrics.allProjects.counts.assets}</div>
                    <div className="stat-label">Total Assets</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-content">
                    <div className="stat-value">{allProjectsMetrics.allProjects.counts.responses}</div>
                    <div className="stat-label">Total Responses</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📁</div>
                  <div className="stat-content">
                    <div className="stat-value">{allProjectsMetrics.allProjects.counts.files}</div>
                    <div className="stat-label">Total Files</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🏷️</div>
                  <div className="stat-content">
                    <div className="stat-value">{allProjectsMetrics.allProjects.counts.assetTypes}</div>
                    <div className="stat-label">Total Asset Types</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Supabase Account Total (Official Metrics) */}
          {allProjectsMetrics?.accountTotal && (
            <div className="metrics-section account-total-section">
              <h2>Supabase Account Total</h2>
              <div className="info-banner official-account-banner">
                <span className="info-icon">🔒</span>
                <span className="info-text">
                  <strong>Official Supabase metrics</strong> - Includes ALL data in your Supabase project (may include system tables and non-app data)
                </span>
              </div>
              <div className="metrics-grid">
                <div className="metric-card account-metric">
                  <div className="metric-header">
                    <h3>
                      Account Database
                      <span className="official-badge" title="Official Supabase metrics">✓</span>
                    </h3>
                  </div>
                  <div className="metric-value">
                    {allProjectsMetrics.accountTotal.database.sizeFormatted}
                  </div>
                  <p className="metric-note">
                    <span className="official-note">Official measurement from Supabase</span>
                  </p>
                </div>

                <div className="metric-card account-metric">
                  <div className="metric-header">
                    <h3>
                      Account Storage
                      <span className="official-badge" title="Official Supabase metrics">✓</span>
                    </h3>
                  </div>
                  <div className="metric-value">
                    {allProjectsMetrics.accountTotal.storage.sizeFormatted}
                  </div>
                  <p className="metric-note">
                    <span className="official-note">Official measurement from Supabase</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="metrics-section">
            <h2>Data Management</h2>
            <div className="actions-grid">
              <button 
                onClick={handleExportData}
                className="action-card export-action"
                disabled={exporting}
              >
                <div className="action-icon">📥</div>
                <div className="action-content">
                  <h3>{exporting ? 'Exporting...' : 'Export Project Data'}</h3>
                  <p>Download all project data as JSON</p>
                </div>
              </button>

              <div className="action-card info-action">
                <div className="action-icon">💡</div>
                <div className="action-content">
                  <h3>Free Tier Limits</h3>
                  <p>500 MB Database • 1 GB Storage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-metrics">
          <p>Unable to load project metrics.</p>
          <button onClick={handleRefreshMetrics} className="retry-btn">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
