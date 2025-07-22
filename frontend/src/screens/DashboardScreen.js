import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { entriesAPI } from '../services/api';

const DashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user?.id) {
      console.log('Updated user:', user);
      loadEntries(); // <-- move entry loading here after user is set
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      console.log('Raw userData from storage:', userData); // Add this
      if (userData) {
        setUser(JSON.parse(userData));
        console.log('user', user)
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const loadEntries = async () => {
    try {
        const response = await entriesAPI.getEntries({userId: user.id})
        console.log(response)
        setEntries(response.entries);
    } catch (error) {
      console.log('Error loading entries:', error);
    }
  };

  const handleLogout = async () => {
    navigation.navigate('Login');
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      const fileExt = uri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `entries/${user?.id || 'anonymous'}/${fileName}`;

      const { error: uploadError } = await entriesAPI.storage
        .from('images')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload image');
      }

      // Get public URL
      const { data } = entriesAPI.storage
        .from('images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handleSaveEntry = async () => {
    console.log('handle save entry')
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    setLoading(true);
    try {
      let image_url = null;
      
      // Upload image if selected
      if (selectedImage) {
        image_url = await uploadImage(selectedImage);
      }

      const response = await entriesAPI.createEntry({
        userId: user.id,
        entryData: {
            title: title,
            description: description,
            image_url: image_url
        },        
      });     
      console.log(response)
      // Update local state
      setEntries([response.entry, ...entries]);

      // Clear form
      setTitle('');
      setDescription('');
      setSelectedImage(null);

      Alert.alert('Success', 'Entry saved successfully!');
    } catch (error) {
      console.log('Save error:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entry_id) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await entriesAPI.deleteEntry({
                user_id: user.id,
                entry_id: entry_id 
              });
              console.log('attempted delete', response);
              // Remove from local state
              setEntries(entries.filter(entry => entry.id !== entry_id));
              Alert.alert('Success', 'Entry deleted successfully!');
            } catch (error) {
              console.log('Delete error:', error);
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {(user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase()}
                </Text>
              </View>
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName}>
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.username || 'User'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* New Entry Form */}
          <View style={styles.formContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📝 Add New Entry</Text>
              <Text style={styles.sectionSubtitle}>Create a new journal entry</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter entry title"
                  placeholderTextColor="#8E8E93"
                  autoCapitalize="sentences"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What's on your mind? (optional)"
                  placeholderTextColor="#8E8E93"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Photo Section */}
            <View style={styles.photoSection}>
              <Text style={styles.label}>Photo</Text>
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Text style={styles.photoButtonIcon}>📷</Text>
                  <Text style={styles.photoButtonText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <Text style={styles.photoButtonIcon}>🖼️</Text>
                  <Text style={styles.photoButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              {selectedImage && (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Text style={styles.removeImageText}>✕ Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleSaveEntry}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : null}
              <Text style={[styles.saveButtonText, loading && { marginLeft: 8 }]}>
                {loading ? 'Saving...' : 'Save Entry'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Entries List */}
          <View style={styles.entriesContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📚 Recent Entries</Text>
              <Text style={styles.sectionSubtitle}>
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </Text>
            </View>
            
            {entries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📝</Text>
                <Text style={styles.emptyStateText}>No entries yet</Text>
                <Text style={styles.emptyStateSubtext}>Add your first entry above to get started</Text>
              </View>
            ) : (
              entries.map((entry, index) => (
                <View key={entry.id} style={[styles.entryCard, { marginBottom: index === entries.length - 1 ? 30 : 15 }]}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{entry.title}</Text>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => deleteEntry(entry.id)}
                    >
                      <Text style={styles.deleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {entry.description ? (
                    <Text style={styles.entryDescription}>{entry.description}</Text>
                  ) : null}
                  
                  {entry.image_url && (
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: entry.image_url }} style={styles.entryImage} />
                    </View>
                  )}
                  
                  <View style={styles.entryFooter}>
                    <Text style={styles.entryTimestamp}>
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })} at{' '}
                      {new Date(entry.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
    paddingBottom: 20, // Add bottom padding to prevent cutoff
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerSection: {
    paddingTop: 40, // Reduced from 50
    paddingHorizontal: 30,
    paddingBottom: 25, // Reduced from 30
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12, // Reduced from 16
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },logoIcon: {
    width: 60, // Reduced from 70
    height: 60, // Reduced from 70
    borderRadius: 30, // Reduced from 35
    backgroundColor: '#4c6ef5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10, // Reduced from 12
    shadowColor: '#4c6ef5',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 28, // Reduced from 32
    fontWeight: '700',
    color: 'white',
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 30, // Reduced from 35
    paddingBottom: 40, // Increased from 30 to ensure content isn't cut off
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    minHeight: 600, // Ensure minimum height
  },
  formHeader: {
    marginBottom: 25, // Reduced from 35
    alignItems: 'center',
  },
  title: {
    fontSize: 26, // Reduced from 28
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 6, // Reduced from 8
  },
  subtitle: {
    fontSize: 14, // Reduced from 16
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20, // Reduced from 24
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderColor: '#feb2b2',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20, // Reduced from 24
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 25, // Reduced from 32
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 16, // Reduced from 20
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6, // Reduced from 8
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    height: 48, // Reduced from 52
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
  eyeText: {
    fontSize: 18,
  },
  registerButton: {
    height: 48, // Reduced from 52
    backgroundColor: '#4c6ef5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // Reduced from 24
    shadowColor: '#4c6ef5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#adb5bd',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, // Reduced from 24
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10, // Add some bottom padding
  },
  footerText: {
    fontSize: 16,
    color: '#6c757d',
  },
  linkText: {
    fontSize: 16,
    color: '#4c6ef5',
    fontWeight: '600',
  },
  companyName: {
    fontSize: 22, // Reduced from 24
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14, // Reduced from 16
    color: '#a8a8b3',
    textAlign: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    paddingTop: 15,
  },
  photoSection: {
    marginBottom: 20,
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  photoButton: {
    flex: 0.48,
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  removeImageButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeImageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  entriesContainer: {
    margin: 20,
    marginTop: 0,
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  entryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  deleteText: {
    color: '#ff4444',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 5,
  },
  entryDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    lineHeight: 22,
  },
  entryImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  entryTimestamp: {
    fontSize: 14,
    color: '#999',
    textAlign: 'right',
  },
});

export default DashboardScreen;