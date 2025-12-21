import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import metricsService from '../services/metricsService';
import StorageWarningBanner from '../components/StorageWarningBanner';
import { useRouteMount } from '../contexts/RouteMountContext';
import useDebouncedAsync from '../hooks/useDebouncedAsync';
import '../styles/homeScreen.css';

const HomeScreen = () => {
  const { selectedProject } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { isRouteMounted } = useRouteMount();

  // Reset dismissed warning when user changes
  useEffect(() => {
    if (user) {
      setDismissedWarning(false);
    }
  }, [user]);

  // Load account metrics when user is available (debounced to prevent excessive calls)
  useDebouncedAsync(
    async () => {
      if (!user) return;

      if (isRouteMounted()) {
        setLoading(true);
      }
      try {
        // Fetch account-level metrics (all projects)
        const allProjectsData = await metricsService.getAllProjectsMetrics(user.token);
        
        if (allProjectsData.success && isRouteMounted()) {
          setMetrics(allProjectsData.data);
        }
      } catch (error) {
        if (isRouteMounted()) {
          console.error('Error loading metrics:', error);
        }
      } finally {
        if (isRouteMounted()) {
          setLoading(false);
        }
      }
    },
    [user?.token],
    {
      delay: 300,
      shouldRun: (deps) => {
        const [token] = deps;
        return !!token;
      },
      onError: (error) => {
        if (isRouteMounted()) {
          console.error('Error loading metrics:', error);
        }
      }
    }
  );

  const handleExportData = async () => {
    if (!selectedProject) {
      alert('Please select a project to export data.');
      return;
    }
    if (isRouteMounted()) {
      setExporting(true);
    }
    try {
      await metricsService.exportProjectData(selectedProject.id, user.token);
      if (isRouteMounted()) {
        alert('Project data exported successfully!');
      }
    } catch (error) {
      if (isRouteMounted()) {
        console.error('Error exporting data:', error);
        alert('Failed to export project data. Please try again.');
      }
    } finally {
      if (isRouteMounted()) {
        setExporting(false);
      }
    }
  };

  const handleRefreshMetrics = async () => {
    if (!user) return;
    
    if (isRouteMounted()) {
      setLoading(true);
    }
    try {
      // Fetch account-level metrics (all projects)
      const allProjectsData = await metricsService.getAllProjectsMetrics(user.token);
      
      if (allProjectsData.success && isRouteMounted()) {
        setMetrics(allProjectsData.data);
      }
    } catch (error) {
      if (isRouteMounted()) {
        console.error('Error loading metrics:', error);
      }
    } finally {
      if (isRouteMounted()) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="home-screen">
      <div className="home-header">
        <div>
          <h1>Account Dashboard</h1>
          <p className="header-subtitle">Overview of your account usage and storage metrics</p>
        </div>
        <button 
          onClick={handleRefreshMetrics}
          className="refresh-btn"
          disabled={loading}
          title="Refresh metrics"
        >
          <span className="refresh-icon">🔄</span>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Storage Warning Banner */}
      {metrics && metrics.allProjects && !dismissedWarning && (
        <StorageWarningBanner 
          metrics={metrics.allProjects}
          onExport={handleExportData}
          onDismiss={() => setDismissedWarning(true)}
        />
      )}

      {/* Metrics Overview */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading account metrics...</p>
        </div>
      ) : metrics ? (
        <div className="metrics-container">
          {/* All Projects Summary */}
          {metrics.allProjects && (
            <div className="metrics-section all-projects-section">
              <div className="section-header">
                <h2>Account Usage</h2>
                <span className="project-count-badge">{metrics.allProjects.projectCount} {metrics.allProjects.projectCount === 1 ? 'Project' : 'Projects'}</span>
              </div>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <h3>
                      Total Database 
                      {metrics.allProjects.database.isEstimate && <span className="estimate-badge" title="Estimated size">~</span>}
                    </h3>
                    <span className={`status-badge ${metrics.allProjects.database.warning ? 'warning' : 'healthy'}`}>
                      {metrics.allProjects.database.warning ? '⚠️ Warning' : '✓ Healthy'}
                    </span>
                  </div>
                  <div className="metric-value">
                    {metrics.allProjects.database.sizeWithOverheadFormatted || metrics.allProjects.database.sizeFormatted}
                    <span className="metric-limit"> / {metrics.allProjects.database.limitFormatted}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${metrics.allProjects.database.percentage > 90 ? 'critical' : metrics.allProjects.database.percentage > 80 ? 'warning' : ''}`}
                      style={{ width: `${Math.min(metrics.allProjects.database.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="metric-percentage">
                    {metrics.allProjects.database.percentage.toFixed(1)}% used (includes overhead)
                  </p>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <h3>Total File Storage</h3>
                    <span className={`status-badge ${metrics.allProjects.storage.warning ? 'warning' : 'healthy'}`}>
                      {metrics.allProjects.storage.warning ? '⚠️ Warning' : '✓ Healthy'}
                    </span>
                  </div>
                  <div className="metric-value">
                    {metrics.allProjects.storage.sizeFormatted}
                    <span className="metric-limit"> / {metrics.allProjects.storage.limitFormatted}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${metrics.allProjects.storage.percentage > 90 ? 'critical' : metrics.allProjects.storage.percentage > 80 ? 'warning' : ''}`}
                      style={{ width: `${Math.min(metrics.allProjects.storage.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="metric-percentage">
                    {metrics.allProjects.storage.percentage.toFixed(1)}% used
                    {metrics.allProjects.storage.dataSource && (
                      <span className="data-source-badge" title={`Data source: ${metrics.allProjects.storage.dataSource === 'official_api' ? 'Official Supabase API (matches dashboard)' : metrics.allProjects.storage.dataSource === 'bucket_enumeration' ? 'Calculated from storage buckets (may differ from dashboard)' : 'Calculated from database records'}`}>
                        {metrics.allProjects.storage.dataSource === 'official_api' ? ' ✓ Official' : ' ~ Calculated'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📍</div>
                  <div className="stat-content">
                    <div className="stat-value">{metrics.allProjects.counts.assets}</div>
                    <div className="stat-label">Total Assets</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-content">
                    <div className="stat-value">{metrics.allProjects.counts.responses}</div>
                    <div className="stat-label">Total Responses</div>
                  </div>
                </div>

                <div className="stat-card storage-card">
                  <div className="stat-icon">📷</div>
                  <div className="stat-content">
                    <div className="stat-value">{metrics.allProjects.storage.photoSizeFormatted || '0 MB'}</div>
                    <div className="stat-label">Photos Storage</div>
                  </div>
                </div>

                <div className="stat-card storage-card">
                  <div className="stat-icon">📁</div>
                  <div className="stat-content">
                    <div className="stat-value">{metrics.allProjects.storage.otherFilesSizeFormatted || '0 MB'}</div>
                    <div className="stat-label">Other Files Storage</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Supabase Account Total (Official Metrics) */}
          {metrics.accountTotal && (
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
                    {metrics.accountTotal.database.sizeFormatted}
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
                    {metrics.accountTotal.storage.sizeFormatted}
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
                title={exporting ? 'Exporting data...' : 'Export project data as JSON'}
              >
                <div className="action-icon">📥</div>
                <div className="action-content">
                  <h3>{exporting ? 'Exporting...' : 'Export Project Data'}</h3>
                  <p>Download all project data as JSON</p>
                </div>
              </button>

              <div className="action-card info-action">
                <div className="action-icon">ℹ️</div>
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
