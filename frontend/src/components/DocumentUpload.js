import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { uploadDocuments } from '../features/uploads/uploadSlice';
import * as DocumentPicker from 'expo-document-picker';

const DocumentUpload = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    const pickDocuments = async () => {
        try {
            // Check if multiple selection is supported
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'text/plain'
                ],
                copyToCacheDirectory: true,
                multiple: true, // Enable multiple document selection
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                await handleDocumentsUpload(result.assets);
            }
        } catch (error) {
            console.error('Document picker error:', error);
            // Fallback to single document picker if multiple selection fails
            try {
                const fallbackResult = await DocumentPicker.getDocumentAsync({
                    type: [
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/vnd.ms-powerpoint',
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                        'text/plain'
                    ],
                    copyToCacheDirectory: true,
                });

                if (!fallbackResult.canceled && fallbackResult.assets && fallbackResult.assets[0]) {
                    await handleDocumentsUpload([fallbackResult.assets[0]]);
                }
            } catch (fallbackError) {
                console.error('Fallback document picker error:', fallbackError);
                Alert.alert('Error', 'Failed to pick document: ' + fallbackError.message);
            }
        }
    };

    const handleDocumentsUpload = async (documentAssets) => {
        if (!user || !user.token) {
            Alert.alert('Authentication Error', 'Please log in to upload files');
            return;
        }
        
        setUploading(true);
        if (documentAssets.length > 1) {
            setUploadProgress(`Preparing ${documentAssets.length} document(s) for upload...`);
        }
        
        try {
            const formData = new FormData();
            const titles = [];
            
            for (let i = 0; i < documentAssets.length; i++) {
                const documentAsset = documentAssets[i];
                if (documentAssets.length > 1) {
                    setUploadProgress(`Processing document ${i + 1} of ${documentAssets.length}...`);
                }
                
                if (Platform.OS === 'web') {
                    try {
                        const response = await fetch(documentAsset.uri);
                        const blob = await response.blob();
                        const file = new File([blob], documentAsset.name, {
                            type: documentAsset.mimeType
                        });
                        formData.append('documents', file);
                    } catch (error) {
                        console.error('Error creating file from blob:', error);
                        formData.append('documents', {
                            uri: documentAsset.uri,
                            type: documentAsset.mimeType,
                            name: documentAsset.name,
                        });
                    }
                } else {
                    formData.append('documents', {
                        uri: documentAsset.uri,
                        type: documentAsset.mimeType,
                        name: documentAsset.name,
                    });
                }
                
                titles.push(documentAsset.name);
            }
            
            // Add titles array to formData
            titles.forEach(title => {
                formData.append('titles[]', title);
            });

            if (documentAssets.length > 1) {
                setUploadProgress('Uploading documents to server...');
            }
            await dispatch(uploadDocuments(formData)).unwrap();
            
            const successMessage = documentAssets.length === 1 
                ? 'Document uploaded successfully!' 
                : `${documentAssets.length} document(s) uploaded successfully!`;
            Alert.alert('Success', successMessage);
        } catch (error) {
            console.error('Document upload error:', error);
            Alert.alert('Upload Failed', error.message || 'Failed to upload documents');
        } finally {
            setUploading(false);
            setUploadProgress('');
        }
    };

    return (
        <View style={styles.container}>            
            {uploadProgress ? (
                <View style={styles.progressContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.progressText}>{uploadProgress}</Text>
                </View>
            ) : (
                <TouchableOpacity
                    style={[styles.uploadButton, styles.documentButton]}
                    onPress={pickDocuments}
                    disabled={uploading}
                >
                    {uploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.uploadButtonText}>📄</Text>
                            <Text style={styles.uploadButtonLabel}>Upload Documents</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginBottom: 30,
    },
    uploadButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        flex: 1,
        maxHeight: 100,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    documentButton: {
        backgroundColor: '#007AFF',
    },
    uploadButtonText: {
        fontSize: 24,
        marginBottom: 8,
    },
    uploadButtonLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    progressContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    progressText: {
        marginTop: 10,
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
    },
});

export default DocumentUpload;
