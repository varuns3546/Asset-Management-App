import { useState, useEffect } from 'react';
import surveyService from '../../services/surveyService';
import ErrorMessage from '../forms/ErrorMessage';
import '../../styles/dataViewScreen.css';

const PhotosDataSection = ({ projectId, user }) => {
    const [photosByAsset, setPhotosByAsset] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    useEffect(() => {
        const fetchPhotos = async () => {
            if (!projectId || !user?.token) return;
            
            setLoading(true);
            setError('');
            try {
                const result = await surveyService.getProjectResponses(projectId, user.token);
                if (result.success) {
                    const responses = result.data || [];
                    const photosMap = {};
                    
                    // Group photos by asset
                    for (const response of responses) {
                        if (response.response_metadata && response.response_metadata.photos) {
                            const photos = Array.isArray(response.response_metadata.photos) 
                                ? response.response_metadata.photos 
                                : [];
                            
                            if (photos.length > 0) {
                                const assetId = response.asset_id;
                                const assetName = response.assets?.title || 'Unknown Asset';
                                
                                if (!photosMap[assetId]) {
                                    photosMap[assetId] = {
                                        assetName,
                                        photos: []
                                    };
                                }
                                
                                // Process photos - use existing URL or construct from path
                                const processedPhotos = photos.map((photo) => {
                                    let photoUrl = photo.url;
                                    const filePath = photo.path;
                                    
                                    // If no URL but we have a path, try to construct public URL
                                    if (!photoUrl && filePath) {
                                        // Photos are stored in project-files bucket
                                        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
                                        const bucket = 'project-files';
                                        if (supabaseUrl) {
                                            photoUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
                                        }
                                    }
                                    
                                    return {
                                        ...photo,
                                        url: photoUrl,
                                        path: filePath,
                                        attributeTitle: response.attribute_title
                                    };
                                });
                                
                                photosMap[assetId].photos.push(...processedPhotos);
                            }
                        }
                    }
                    
                    setPhotosByAsset(photosMap);
                } else {
                    setError(result.error || 'Failed to load photos');
                }
            } catch (err) {
                setError(err.response?.data?.error || err.message || 'Failed to load photos');
            } finally {
                setLoading(false);
            }
        };

        fetchPhotos();
    }, [projectId, user]);

    const handlePhotoClick = (photo) => {
        setSelectedPhoto(photo);
    };

    const closeLightbox = () => {
        setSelectedPhoto(null);
    };

    if (loading) {
        return <div className="section-loading">Loading photos...</div>;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    // Flatten photos into a single array for table display
    const allPhotos = [];
    Object.keys(photosByAsset).forEach(assetId => {
        const assetData = photosByAsset[assetId];
        assetData.photos.forEach((photo, index) => {
            allPhotos.push({
                ...photo,
                assetId,
                assetName: assetData.assetName,
                photoIndex: index
            });
        });
    });

    if (allPhotos.length === 0) {
        return <div className="section-empty">No photos found.</div>;
    }

    return (
        <div className="photos-data-section">
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Asset Name</th>
                            <th>Attribute</th>
                            <th>Photo</th>
                            <th>File Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allPhotos.map((photo, index) => (
                            <tr key={`${photo.assetId}-${photo.photoIndex}`}>
                                <td>{photo.assetName}</td>
                                <td>{photo.attributeTitle || 'N/A'}</td>
                                <td>
                                    <div className="photo-table-thumbnail">
                                        <img 
                                            src={photo.url || '/placeholder-image.png'} 
                                            alt={photo.fileName || `Photo ${index + 1}`}
                                            onError={(e) => {
                                                e.target.src = '/placeholder-image.png';
                                            }}
                                        />
                                    </div>
                                </td>
                                <td>{photo.fileName || 'N/A'}</td>
                                <td>
                                    <button 
                                        className="btn btn-primary btn-small"
                                        onClick={() => handlePhotoClick(photo)}
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {selectedPhoto && (
                <div className="photo-lightbox" onClick={closeLightbox}>
                    <div className="photo-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="photo-lightbox-close" onClick={closeLightbox}>×</button>
                        <img 
                            src={selectedPhoto.url || '/placeholder-image.png'} 
                            alt={selectedPhoto.fileName || 'Photo'}
                        />
                        <div className="photo-lightbox-info">
                            <p><strong>Asset:</strong> {selectedPhoto.assetName}</p>
                            <p><strong>Attribute:</strong> {selectedPhoto.attributeTitle}</p>
                            {selectedPhoto.fileName && <p><strong>File:</strong> {selectedPhoto.fileName}</p>}
                        </div>
                    </div>
                </div>
            )}
            
            <div className="data-summary">
                <p>Total Photos: {allPhotos.length}</p>
                <p>Assets with Photos: {Object.keys(photosByAsset).length}</p>
            </div>
        </div>
    );
};

export default PhotosDataSection;

