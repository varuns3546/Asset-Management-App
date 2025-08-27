import { StyleSheet, Platform } from 'react-native';
import commonStyles from './commonStyles';

const screenStyles = StyleSheet.create({
  // MapScreen styles
  mapScreen: {
    container: {
      flex: 1,
    },
    mapSelector: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: commonStyles.colors.white,
      padding: 15,
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: commonStyles.colors.gray.light,
      zIndex: 100,
    },
    mapSelectorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flex: 1,
    },
    mapSelectorTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: commonStyles.colors.text.primary,
      marginRight: 10,
    },
    createMapButton: {
      backgroundColor: commonStyles.colors.primary,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
    },
    createMapButtonText: {
      color: commonStyles.colors.white,
      fontSize: 14,
      fontWeight: '600',
    },
    mapOptionsContainer: {
      flex: 1,
      marginHorizontal: 10,
    },
    noMapsText: {
      fontSize: 14,
      color: commonStyles.colors.text.secondary,
      textAlign: 'center',
      flex: 1,
      marginHorizontal: 10,
    },
    mapOption: {
      backgroundColor: commonStyles.colors.gray.light,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 10,
    },
    selectedMapOption: {
      backgroundColor: commonStyles.colors.primary,
    },
    mapOptionText: {
      fontSize: 14,
      color: commonStyles.colors.text.secondary,
    },
    selectedMapOptionText: {
      color: commonStyles.colors.white,
      fontWeight: 'bold',
    },
    map: {
      flex: 1,
      marginTop: Platform.OS === 'ios' ? 120 : 90,
    },
    statsContainer: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 220 : 190,
      left: 20,
      backgroundColor: commonStyles.colors.white,
      padding: 15,
      borderRadius: 10,
      ...commonStyles.shadows.medium,
      minWidth: 150,
      zIndex: 100,
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
      color: commonStyles.colors.text.primary,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
    },
    statsLabel: {
      fontSize: 14,
      color: commonStyles.colors.text.secondary,
    },
    statsValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: commonStyles.colors.primary,
    },
    addButton: {
      position: 'absolute',
      bottom: 30,
      right: 20,
      backgroundColor: commonStyles.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      ...commonStyles.shadows.medium,
    },
    addButtonText: {
      color: commonStyles.colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    debugContainer: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 170 : 140,
      left: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      padding: 10,
      borderRadius: 8,
      ...commonStyles.shadows.small,
      zIndex: 99,
    },
    debugText: {
      fontSize: 14,
      color: commonStyles.colors.text.primary,
    },
  },

  // EntryScreen styles
  entryScreen: {
    container: {
      flex: 1,
      backgroundColor: commonStyles.colors.background,
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
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    sectionHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: commonStyles.colors.text.primary,
      marginBottom: 15,
    },
    entryCount: {
      fontSize: 14,
      color: commonStyles.colors.text.secondary,
      fontWeight: '500',
    },
    exportButton: {
      backgroundColor: commonStyles.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    exportButtonText: {
      color: commonStyles.colors.white,
      fontSize: 12,
      fontWeight: '600',
    },
    formContainer: {
      backgroundColor: commonStyles.colors.white,
      borderRadius: 12,
      padding: 20,
      ...commonStyles.shadows.medium,
    },
    entriesContainer: {
      backgroundColor: commonStyles.colors.white,
      borderRadius: 12,
      overflow: 'hidden',
      ...commonStyles.shadows.medium,
    },
    emptyContainer: {
      backgroundColor: commonStyles.colors.white,
      borderRadius: 12,
      padding: 40,
      alignItems: 'center',
      ...commonStyles.shadows.medium,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: commonStyles.colors.text.primary,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: commonStyles.colors.text.secondary,
      textAlign: 'center',
    },
  },

  // LoginScreen styles
  loginScreen: {
    container: {
      flex: 1,
      backgroundColor: commonStyles.colors.white,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 20,
      justifyContent: 'center',
    },
    heading: {
      alignItems: 'center',
      marginBottom: 40,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginLeft: 10,
      color: commonStyles.colors.text.primary,
    },
    form: {
      width: '100%',
    },
    formGroup: {
      marginBottom: 20,
    },
    input: {
      backgroundColor: '#f9f9f9',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 16,
      flex: 1,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f9f9f9',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
    },
    eyeIcon: {
      paddingHorizontal: 15,
      paddingVertical: 12,
    },
    eyeIconText: {
      fontSize: 20,
      color: commonStyles.colors.text.secondary,
    },
    button: {
      backgroundColor: commonStyles.colors.primary,
      borderRadius: 8,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 10,
    },
    buttonText: {
      color: commonStyles.colors.white,
      fontSize: 18,
      fontWeight: 'bold',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 30,
    },
    footerText: {
      fontSize: 16,
      color: commonStyles.colors.text.secondary,
    },
    linkText: {
      fontSize: 16,
      color: commonStyles.colors.primary,
      fontWeight: '600',
    },
  },

  // RegisterScreen styles
  registerScreen: {
    container: {
      flex: 1,
      backgroundColor: commonStyles.colors.white,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 20,
      justifyContent: 'center',
    },
    heading: {
      alignItems: 'center',
      marginBottom: 40,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginLeft: 10,
      color: commonStyles.colors.text.primary,
    },
    subtitle: {
      fontSize: 16,
      color: commonStyles.colors.text.secondary,
    },
    form: {
      width: '100%',
    },
    formGroup: {
      marginBottom: 20,
    },
    input: {
      backgroundColor: '#f9f9f9',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 16,
      flex: 1,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f9f9f9',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
    },
    eyeIcon: {
      paddingHorizontal: 15,
      paddingVertical: 12,
    },
    eyeIconText: {
      fontSize: 20,
      color: commonStyles.colors.text.secondary,
    },
    button: {
      backgroundColor: commonStyles.colors.primary,
      borderRadius: 8,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 10,
    },
    buttonText: {
      color: commonStyles.colors.white,
      fontSize: 18,
      fontWeight: 'bold',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 30,
    },
    footerText: {
      fontSize: 16,
      color: commonStyles.colors.text.secondary,
    },
    linkText: {
      fontSize: 16,
      color: commonStyles.colors.primary,
      fontWeight: '600',
    },
  },

  // UploadScreen styles
  uploadScreen: {
    container: {
      flex: 1,
      backgroundColor: commonStyles.colors.background,
    },
    header: {
      backgroundColor: commonStyles.colors.white,
      padding: 16,
      ...commonStyles.shadows.small,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: commonStyles.colors.text.primary,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    uploadArea: {
      backgroundColor: commonStyles.colors.white,
      borderRadius: 12,
      padding: 24,
      marginBottom: 16,
      alignItems: 'center',
      ...commonStyles.shadows.medium,
    },
    uploadIcon: {
      fontSize: 48,
      color: commonStyles.colors.primary,
      marginBottom: 16,
    },
    uploadText: {
      fontSize: 16,
      color: commonStyles.colors.text.primary,
      textAlign: 'center',
      marginBottom: 8,
    },
    uploadSubtext: {
      fontSize: 14,
      color: commonStyles.colors.text.secondary,
      textAlign: 'center',
    },
    button: {
      ...commonStyles.button.primary,
      marginTop: 16,
    },
    buttonText: {
      ...commonStyles.buttonText.primary,
    },
  },

  // GeoPackageScreen styles
  geopackageScreen: {
    container: {
      flex: 1,
      backgroundColor: commonStyles.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingBottom: 20,
    },
  },
});

export default screenStyles; 