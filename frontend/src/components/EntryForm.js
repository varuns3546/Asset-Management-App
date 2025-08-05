import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { createEntry } from '../features/entries/entrySlice'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { loadUser } from '../features/auth/authSlice'
import { componentStyles } from '../styles'

const EntryForm = ({navigation}) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
    })
    const dispatch = useDispatch()
    useEffect(() => {
            dispatch(loadUser())
        }, [])
    const handleSubmit = () => {
        dispatch(createEntry(formData))
        setFormData({
            title: '',
            content: '',
        })
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({...prev, [field]: value}))
    }
    return(
        <View style={componentStyles.entryForm.container}>
            <Text style={componentStyles.entryForm.title}>Add New Entry</Text>
            <TextInput
                style={componentStyles.entryForm.input}
                placeholder="Title"
                value={formData.title}
                onChangeText={(value) => handleChange('title', value)}
            />  
            <TextInput
                style={componentStyles.entryForm.textArea}
                placeholder="Content"
                value={formData.content}
                onChangeText={(value) => handleChange('content', value)}
                multiline={true}
                textAlignVertical="top"
            />
            <TouchableOpacity style={componentStyles.entryForm.saveButton} onPress={handleSubmit}>
                <Text style={componentStyles.entryForm.buttonText}>Add Entry</Text>
            </TouchableOpacity>
        </View>
    )
}

export default EntryForm