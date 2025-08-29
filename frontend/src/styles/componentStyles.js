import { StyleSheet } from 'react-native';
import commonStyles from './commonStyles';

const componentStyles = StyleSheet.create({
  // Header component styles
  header: {
    container: {
      backgroundColor: commonStyles.colors.white,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...commonStyles.shadows.small,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: commonStyles.colors.text.primary,
    },
    subtitle: {
      fontSize: 14,
      color: commonStyles.colors.text.secondary,
      marginTop: 4,
    },
  },

  // EntryItem component styles
  entryItem: {
    container: {
      backgroundColor: commonStyles.colors.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...commonStyles.shadows.small,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: commonStyles.colors.text.primary,
      flex: 1,
    },
    date: {
      fontSize: 12,
      color: commonStyles.colors.text.light,
    },
    description: {
      fontSize: 14,
      color: commonStyles.colors.text.secondary,
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 12,
    },
    actionButton: {
      marginLeft: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    editButton: {
      backgroundColor: commonStyles.colors.primary,
    },
    deleteButton: {
      backgroundColor: commonStyles.colors.error,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: commonStyles.colors.white,
    },
  },

  // EntryForm component styles
  entryForm: {
    container: {
      backgroundColor: commonStyles.colors.white,
      borderRadius: 12,
      padding: 20,
      margin: 16,
      ...commonStyles.shadows.medium,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: commonStyles.colors.text.primary,
      marginBottom: 20,
      textAlign: 'center',
    },
    form: {
      marginBottom: 20,
    },
    input: {
      ...commonStyles.input,
      marginBottom: 16,
    },
    textArea: {
      ...commonStyles.input,
      height: 100,
      textAlignVertical: 'top',
    },
    buttons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    button: {
      flex: 1,
      marginHorizontal: 5,
    },
    cancelButton: {
      ...commonStyles.button.secondary,
    },
    saveButton: {
      ...commonStyles.button.primary,
    },
    buttonText: {
      ...commonStyles.buttonText.primary,
    },
    cancelButtonText: {
      ...commonStyles.buttonText.secondary,
    },
  },

  // MapView component styles
  mapView: {
    container: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    styleSelector: {
      position: 'absolute',
      top: 100,
      right: 20,
      backgroundColor: commonStyles.colors.white,
      borderRadius: 8,
      padding: 8,
      ...commonStyles.shadows.medium,
    },
    styleButton: {
      padding: 8,
      borderRadius: 4,
      marginBottom: 4,
    },
    styleButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: commonStyles.colors.text.primary,
    },
    selectedStyle: {
      backgroundColor: commonStyles.colors.primary,
    },
    selectedStyleText: {
      color: commonStyles.colors.white,
    },
  },

  // Spinner component styles
  spinner: {
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    spinner: {
      width: 50,
      height: 50,
    },
    text: {
      marginTop: 16,
      fontSize: 16,
      color: commonStyles.colors.white,
      fontWeight: '600',
    },
  },

  // Modal styles (shared across components)
  modal: {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      backgroundColor: commonStyles.colors.white,
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: commonStyles.colors.text.primary,
    },
    formContainer: {
      maxHeight: 400,
    },
    input: {
      borderWidth: 1,
      borderColor: '#DDDDDD',
      borderRadius: 8,
      padding: 12,
      marginBottom: 15,
      fontSize: 16,
      backgroundColor: commonStyles.colors.white,
    },
    buttons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      marginHorizontal: 5,
    },
    cancelButton: {
      backgroundColor: commonStyles.colors.gray.light,
    },
    saveButton: {
      backgroundColor: commonStyles.colors.primary,
    },
    cancelButtonText: {
      color: commonStyles.colors.text.secondary,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
    saveButtonText: {
      color: commonStyles.colors.white,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
  },

  // Button styles (reusable)
  button: {
    primary: {
      backgroundColor: commonStyles.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      ...commonStyles.shadows.small,
    },
    secondary: {
      backgroundColor: commonStyles.colors.gray.light,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    danger: {
      backgroundColor: commonStyles.colors.error,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: {
      backgroundColor: commonStyles.colors.gray.medium,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
  },

  buttonText: {
    primary: {
      color: commonStyles.colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    secondary: {
      color: commonStyles.colors.text.secondary,
      fontSize: 16,
      fontWeight: '600',
    },
    danger: {
      color: commonStyles.colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    disabled: {
      color: commonStyles.colors.text.light,
      fontSize: 16,
      fontWeight: '600',
    },
  },

  // GeoPackage Export component styles
  geopackageExport: {
    container: {
      backgroundColor: commonStyles.colors.white,
      borderRadius: 12,
      padding: 20,
      margin: 16,
      ...commonStyles.shadows.medium,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: commonStyles.colors.text.primary,
      marginBottom: 20,
      textAlign: 'center',
    },
    statsSection: {
      marginBottom: 24,
      padding: 16,
      backgroundColor: commonStyles.colors.gray.light,
      borderRadius: 8,
    },
    statsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: commonStyles.colors.text.primary,
    },
    refreshButton: {
      backgroundColor: commonStyles.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    refreshButtonText: {
      color: commonStyles.colors.white,
      fontSize: 12,
      fontWeight: '600',
    },
    statsText: {
      fontSize: 16,
      color: commonStyles.colors.text.secondary,
      marginBottom: 8,
    },
    totalText: {
      fontSize: 14,
      fontWeight: '600',
      color: commonStyles.colors.primary,
    },
    exportSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: commonStyles.colors.text.primary,
      marginBottom: 12,
    },
    description: {
      fontSize: 14,
      color: commonStyles.colors.text.secondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    exportButton: {
      backgroundColor: commonStyles.colors.primary,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 12,
    },
    disabledButton: {
      backgroundColor: commonStyles.colors.gray.medium,
    },
    exportButtonText: {
      color: commonStyles.colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    loadingText: {
      fontSize: 14,
      color: commonStyles.colors.text.secondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    infoSection: {
      padding: 16,
      backgroundColor: commonStyles.colors.gray.light,
      borderRadius: 8,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: commonStyles.colors.text.primary,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: commonStyles.colors.text.secondary,
      lineHeight: 20,
    },
  },

  // ProjectNavbar component styles
  projectNavbar: {
    container: {
      backgroundColor: commonStyles.colors.white,
      borderBottomWidth: 1,
      borderBottomColor: commonStyles.colors.gray.light,
      ...commonStyles.shadows.small,
    },
    collapsedHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    expandedContent: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderTopWidth: 1,
      borderTopColor: commonStyles.colors.gray.light,
    },
    currentProject: {
      flex: 1,
    },
    currentProjectLabel: {
      fontSize: 12,
      color: commonStyles.colors.text.light,
      marginBottom: 4,
    },
    currentProjectName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: commonStyles.colors.text.primary,
    },
    toggleButton: {
      backgroundColor: commonStyles.colors.gray.light,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      marginLeft: 12,
    },
    toggleButtonText: {
      fontSize: 16,
      color: commonStyles.colors.text.primary,
      fontWeight: '600',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    createButton: {
      flex: 1,
      backgroundColor: commonStyles.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    createButtonText: {
      color: commonStyles.colors.white,
      fontSize: 14,
      fontWeight: '600',
    },
    openButton: {
      flex: 1,
      backgroundColor: commonStyles.colors.secondary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    openButtonText: {
      color: commonStyles.colors.white,
      fontSize: 14,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: commonStyles.colors.white,
      borderRadius: 12,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: commonStyles.colors.text.primary,
      marginBottom: 20,
      textAlign: 'center',
    },
    input: {
      borderWidth: 1,
      borderColor: commonStyles.colors.gray.medium,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 16,
      backgroundColor: commonStyles.colors.white,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: commonStyles.colors.gray.medium,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: commonStyles.colors.text.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    confirmButton: {
      flex: 1,
      backgroundColor: commonStyles.colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: commonStyles.colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    projectList: {
      maxHeight: 300,
      marginBottom: 20,
    },
    projectItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderWidth: 1,
      borderColor: commonStyles.colors.gray.light,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: commonStyles.colors.white,
    },
    projectItemActive: {
      borderColor: commonStyles.colors.primary,
      backgroundColor: commonStyles.colors.primary + '10',
    },
    projectInfo: {
      flex: 1,
    },
    projectName: {
      fontSize: 16,
      fontWeight: '600',
      color: commonStyles.colors.text.primary,
      marginBottom: 4,
    },
    projectDescription: {
      fontSize: 14,
      color: commonStyles.colors.text.secondary,
      marginBottom: 4,
    },
    projectDate: {
      fontSize: 12,
      color: commonStyles.colors.text.light,
    },
    deleteButton: {
      padding: 8,
    },
    deleteButtonText: {
      fontSize: 18,
    },
    closeButton: {
      backgroundColor: commonStyles.colors.gray.medium,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    closeButtonText: {
      color: commonStyles.colors.text.primary,
      fontSize: 16,
      fontWeight: '600',
    },
  },
});

export default componentStyles; 