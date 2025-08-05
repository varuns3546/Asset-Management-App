import { View, Text, TouchableOpacity } from 'react-native'
import { useDispatch } from 'react-redux'
import { logout } from '../features/auth/authSlice'
import { componentStyles } from '../styles'

const Header = ({ user, navigation }) => {
    const dispatch = useDispatch()

    const handleLogout = () => {
        dispatch(logout())
        navigation.navigate('Login')
    }

    return (
        <View style={componentStyles.header.container}>
            <View style={componentStyles.header.headerContent}>
                <View>
                    <Text style={componentStyles.header.subtitle}>Welcome back,</Text>
                    <Text style={componentStyles.header.title}>{user && user.firstName}</Text>
                </View>
                <TouchableOpacity style={componentStyles.button.danger} onPress={handleLogout}>
                    <Text style={componentStyles.buttonText.danger}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default Header 