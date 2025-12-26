import '../styles/projectComponents.css'
import '../styles/generateReportModal.css'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import reportService from '../services/reportService'
import ButtonGroup from './forms/ButtonGroup'
import ErrorMessage from './forms/ErrorMessage'

const GenerateReportModal = ({ onClose }) => {
    const { selectedProject } = useSelector((state) => state.projects)
    const { user } = useSelector((state) => state.auth)
    
    const [format, setFormat] = useState('pdf')
    const [sections, setSections] = useState({
        summary: true,
        assets: false,
        questionnaire: false,
        assetTypes: false
    })
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleSectionChange = (section) => {
        setSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }

    const handleGenerate = async () => {
        // Check if at least one section is selected
        const selectedSections = Object.entries(sections)
            .filter(([_, selected]) => selected)
            .map(([section, _]) => section)

        if (selectedSections.length === 0) {
            setError('Please select at least one section to include in the report.')
            return
        }

        if (!selectedProject?.id) {
            setError('Please select a project first.')
            return
        }

        if (!user?.token) {
            setError('You must be logged in to generate reports.')
            return
        }

        setIsGenerating(true)
        setError('')
        setSuccess('')

        try {
            const options = {
                format,
                sections: selectedSections
            }

            const response = await reportService.generateReport(
                selectedProject.id,
                options,
                user.token
            )

            // Create blob from response
            const blob = new Blob([response], {
                type: format === 'pdf' 
                    ? 'application/pdf' 
                    : format === 'excel' 
                    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    : 'text/csv'
            })

            // Generate filename
            const extension = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'
            const projectName = (selectedProject.name || selectedProject.title || 'project')
                .replace(/[^a-z0-9]/gi, '_')
                .toLowerCase()
            const filename = `report_${projectName}_${Date.now()}.${extension}`

            // Download the file
            reportService.downloadReport(blob, filename)

            setSuccess(`Report generated and downloaded successfully as ${filename}`)
            setIsGenerating(false)

            // Close modal after a short delay
            setTimeout(() => {
                onClose()
            }, 2000)

        } catch (err) {
            console.error('Error generating report:', err)
            const errorMessage = err?.response?.data?.error || err?.message || 'Failed to generate report'
            setError(errorMessage)
            setIsGenerating(false)
        }
    }

    if (!selectedProject) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Generate Report</h2>
                        <button className="close-button" onClick={onClose}>×</button>
                    </div>
                    <div className="modal-body">
                        <ErrorMessage message="Please select a project first to generate a report." />
                    <ButtonGroup
                        buttons={[
                            {
                                label: 'Close',
                                variant: 'primary',
                                onClick: onClose
                            }
                        ]}
                    />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content generate-report-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Generate Report</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
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
                            },
                            {
                                label: 'Cancel',
                                variant: 'secondary',
                                onClick: onClose,
                                disabled: isGenerating
                            }
                        ]}
                    />
                </div>
            </div>
        </div>
    )
}

export default GenerateReportModal

