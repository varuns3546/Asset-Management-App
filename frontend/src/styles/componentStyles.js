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
});

export default componentStyles; 