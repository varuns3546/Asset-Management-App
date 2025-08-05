import { useDispatch } from 'react-redux'
import { deleteEntry } from '../features/entries/entrySlice'
import { View, Text, TouchableOpacity } from 'react-native' 
import { componentStyles } from '../styles'

const EntryItem = ({entry}) => {
    const dispatch = useDispatch()

    const handleDelete = () => {
        dispatch(deleteEntry(entry.id))
    }
    return(
        <View style={componentStyles.entryItem.container}>
            <View style={componentStyles.entryItem.header}>
                <Text style={componentStyles.entryItem.title}>{entry.title}</Text>
                <Text style={componentStyles.entryItem.date}>
                    {new Date(entry.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <Text style={componentStyles.entryItem.description}>{entry.content}</Text>
            <View style={componentStyles.entryItem.actions}>
                <TouchableOpacity 
                    style={[componentStyles.entryItem.actionButton, componentStyles.entryItem.deleteButton]} 
                    onPress={handleDelete}
                >
                    <Text style={componentStyles.entryItem.actionButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default EntryItem