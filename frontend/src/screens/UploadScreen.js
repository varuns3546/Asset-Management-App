import React, { useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    ScrollView, 
    TouchableOpacity, 
    Alert,
    ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { 
    getPhotos, 
    getDocuments, 
    deletePhoto,
    deleteDocument,
    reset
} from '../features/uploads/uploadSlice';
import { loadUser } from '../features/auth/authSlice';
import Header from '../components/Header';
import PhotoUpload from '../components/PhotoUpload';
import DocumentUpload from '../components/DocumentUpload';

const UploadScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { photos = [], documents = [], isError, isLoading, isLoadingPhotos, isLoadingDocuments, message, isSuccess } = useSelector((state) => state.uploads || {});
    
    const { user } = useSelector((state) => state.auth);
    const errorShownRef = useRef(false);

    useEffect(() => {
        dispatch(loadUser())
    }, [])

    useEffect(() => {
        if (!user) {
            navigation.navigate('Login')
            return
        }
        dispatch(getPhotos())
        dispatch(getDocuments())
    }, [user, dispatch])

    useEffect(() => {
        return () => {
            dispatch(reset())
        }
    }, [dispatch])

    useEffect(() => {
        if (isError) {
            console.log('Error:', message)
            Alert.alert('Error', message);
        }
        if (isSuccess) {
            // Don't refresh both lists - let the individual upload/delete functions handle their own state
            // The upload slice will automatically update the state when upload/delete is successful
        }
    }, [isError, isSuccess, message, dispatch])

    const handleDeletePhoto = async (fileName) => {
        console.log('handleDeletePhoto called with fileName:', fileName);
        try {
            console.log('Deleting photo:', fileName);
            await dispatch(deletePhoto(fileName)).unwrap();
            Alert.alert('Success', 'Photo deleted successfully!');

        } catch (error) {
            console.error('Delete photo error:', error);
            Alert.alert('Error', 'Failed to delete photo: ' + error.message);
        }
    };

    const handleDeleteDocument = async (fileName) => {
        console.log('handleDeleteDocument called with fileName:', fileName);
        try {
            console.log('Deleting document:', fileName);
            await dispatch(deleteDocument(fileName)).unwrap();
            Alert.alert('Success', 'Document deleted successfully!');

        } catch (error) {
            console.error('Delete document error:', error);
            Alert.alert('Error', 'Failed to delete document: ' + error.message);
        }
    };

    const renderFileItem = (file, type, onDelete, index) => (
        <View key={file.id || `${type}-${index}`} style={styles.fileItem}>
            <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                </Text>
                <Text style={styles.fileSize}>
                    {file.sizeFormatted || 'Unknown size'}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDelete(file.name)}
            >
                <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header user={user} navigation={navigation} />
            
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* Upload Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Upload Assets</Text>
                        <View style={styles.uploadContainer}>
                            <PhotoUpload /> 
                            <DocumentUpload />
                        </View>
                    </View>

                    {/* Photos Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Photos ({photos.length})</Text>
                        {isLoadingPhotos ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#007AFF" />
                                <Text style={styles.loadingText}>Loading photos...</Text>
                            </View>
                        ) : photos.length > 0 ? (
                            <View style={styles.filesContainer}>
                                {Array.isArray(photos) &&
                                photos.map((photo, index) =>
                                renderFileItem(photo, 'photo', handleDeletePhoto, index)
                                )}
                            </View>

                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No photos uploaded yet</Text>
                                <Text style={styles.emptySubtext}>Upload photos using the button above</Text>
                            </View>
                        )}
                    </View>

                    {/* Documents Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Documents ({documents.length})</Text>
                        {isLoadingDocuments ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#007AFF" />
                                <Text style={styles.loadingText}>Loading documents...</Text>
                            </View>
                        ) : documents.length > 0 ? (
                            <View style={styles.filesContainer}>
                                {documents.map((document, index) => renderFileItem(document, 'document', handleDeleteDocument, index))}
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No documents uploaded yet</Text>
                                <Text style={styles.emptySubtext}>Upload documents using the button above</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#212529',
        marginBottom: 15,
    },
    uploadContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    filesContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    fileItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    fileInfo: {
        flex: 1,
        marginRight: 15,
    },
    fileName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#212529',
        marginBottom: 4,
    },
    fileSize: {
        fontSize: 12,
        color: '#6c757d',
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    loadingContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 40,
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
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#6c757d',
    },
    emptyContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 40,
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
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6c757d',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#adb5bd',
        textAlign: 'center',
    },
});

export default UploadScreen;
