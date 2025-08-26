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
import { uploadPhotos } from '../features/uploads/uploadSlice';
import * as ImagePicker from 'expo-image-picker';

const PhotoUpload = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
            return false;
        }
        return true;
    };

    const pickImages = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                selectionLimit: 10, // Allow up to 10 photos
                quality: 0.8,
                presentationStyle: ImagePicker.UIImagePickerPresentationStyle.POPOVER,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                console.log('Multiple image picker result:', {
                    canceled: result.canceled,
                    assetsCount: result.assets.length,
                    assets: result.assets.map(asset => ({
                        uri: asset.uri,
                        type: asset.type,
                        fileName: asset.fileName
                    }))
                });
                await handlePhotosUpload(result.assets);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            // Fallback to single image picker if multiple selection fails
            try {
                const fallbackResult = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsMultipleSelection: false,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                    presentationStyle: ImagePicker.UIImagePickerPresentationStyle.POPOVER,
                });

                if (!fallbackResult.canceled && fallbackResult.assets && fallbackResult.assets[0]) {
                    console.log('Single image picker result:', {
                        canceled: fallbackResult.canceled,
                        assetsCount: fallbackResult.assets.length,
                        asset: {
                            uri: fallbackResult.assets[0].uri,
                            type: fallbackResult.assets[0].type,
                            fileName: fallbackResult.assets[0].fileName
                        }
                    });
                    await handlePhotosUpload([fallbackResult.assets[0]]);
                }
            } catch (fallbackError) {
                console.error('Fallback image picker error:', fallbackError);
                Alert.alert('Error', 'Failed to pick image: ' + fallbackError.message);
            }
        }
    };

    const handlePhotosUpload = async (photoAssets) => {
        if (!user || !user.token) {
            Alert.alert('Authentication Error', 'Please log in to upload files');
            return;
        }
        
        setUploading(true);
        if (photoAssets.length > 1) {
            setUploadProgress(`Preparing ${photoAssets.length} photo(s) for upload...`);
        } else {
            setUploadProgress('Preparing photo for upload...');
        }
        
        try {
            const formData = new FormData();
            const titles = [];
            
            console.log('Photo assets received:', photoAssets);
            
            for (let i = 0; i < photoAssets.length; i++) {
                const photoAsset = photoAssets[i];
                if (photoAssets.length > 1) {
                    setUploadProgress(`Processing photo ${i + 1} of ${photoAssets.length}...`);
                }
                
                console.log(`Processing photo ${i + 1}:`, {
                    uri: photoAsset.uri,
                    type: photoAsset.type,
                    fileName: photoAsset.fileName,
                    platform: Platform.OS
                });
                
                if (Platform.OS === 'web') {
                    try {
                        const response = await fetch(photoAsset.uri);
                        const blob = await response.blob();
                        const file = new File([blob], photoAsset.fileName || `photo_${i}.jpg`, {
                            type: photoAsset.type || 'image/jpeg'
                        });
                        formData.append('photos', file);
                        console.log('Web: File appended to FormData:', file.name, file.type, file.size);
                    } catch (error) {
                        console.error('Error creating file from blob:', error);
                        formData.append('photos', {
                            uri: photoAsset.uri,
                            type: photoAsset.type || 'image/jpeg',
                            name: photoAsset.fileName || `photo_${i}.jpg`,
                        });
                        console.log('Web: Fallback object appended to FormData');
                    }
                } else {
                    formData.append('photos', {
                        uri: photoAsset.uri,
                        type: photoAsset.type || 'image/jpeg',
                        name: photoAsset.fileName || `photo_${i}.jpg`,
                    });
                    console.log('Mobile: Object appended to FormData');
                }
                
                titles.push(photoAsset.fileName || `Photo ${i + 1}`);
            }
            
            // Add titles array to formData
            titles.forEach(title => {
                formData.append('titles[]', title);
            });

            if (photoAssets.length > 1) {
                setUploadProgress('Uploading photos to server...');
            } else {
                setUploadProgress('Uploading photo to server...');
            }
            
            // Debug logging
            console.log('Uploading photos:', {
                photoAssetsCount: photoAssets.length,
                formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
                    key,
                    valueType: typeof value,
                    valueName: value?.name || value?.fileName || 'N/A'
                }))
            });
            
            await dispatch(uploadPhotos(formData)).unwrap();
            
            const successMessage = photoAssets.length === 1 
                ? 'Photo uploaded successfully!' 
                : `${photoAssets.length} photo(s) uploaded successfully!`;
            Alert.alert('Success', successMessage);
        } catch (error) {
            console.error('Photo upload error:', error);
            Alert.alert('Upload Failed', error.message || 'Failed to upload photos');
        } finally {
            setUploading(false);
            setUploadProgress('');
        }
    };

    return (
        <View style={styles.container}>
            
            {uploadProgress ? (
                <View style={styles.progressContainer}>
                    <ActivityIndicator size="small" color="#28a745" />
                    <Text style={styles.progressText}>{uploadProgress}</Text>
                </View>
            ) : (
                <TouchableOpacity
                    style={[styles.uploadButton, styles.photoButton]}
                    onPress={pickImages}
                    disabled={uploading}
                >
                    {uploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.uploadButtonText}>📷</Text>
                            <Text style={styles.uploadButtonLabel}>Upload Photos</Text>
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
        backgroundColor: '#28a745',
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
    photoButton: {
        backgroundColor: '#28a745',
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

export default PhotoUpload;
