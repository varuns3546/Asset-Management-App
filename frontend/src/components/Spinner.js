import { View, Text, ActivityIndicator } from 'react-native'
import { componentStyles } from '../styles'

const Spinner = () => {
    return (
        <View style={componentStyles.spinner.container}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={componentStyles.spinner.text}>Loading...</Text>
        </View>
    )
}

export default Spinner