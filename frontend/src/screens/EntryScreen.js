import { useEffect } from 'react'
import {ScrollView, View, Text, SafeAreaView} from 'react-native'
import {useSelector, useDispatch} from 'react-redux'
import EntryForm from '../components/EntryForm'
import EntryItem from '../components/EntryItem'
import Spinner from '../components/Spinner'
import Header from '../components/Header'
import { getEntries, reset } from '../features/entries/entrySlice'
import { loadUser } from '../features/auth/authSlice'
import { screenStyles, commonStyles } from '../styles'

const EntryScreen = ({navigation}) => {
    const dispatch = useDispatch()
    const {entries, isError, isLoading, message} = useSelector((state) => state.entries)
    
    useEffect(() => {
        dispatch(loadUser())
    }, [])
    
    const {user} = useSelector((state) => state.auth)
    
    useEffect(() => {
        if (!user) {
            navigation.navigate('Login')
            return
        }
        dispatch(getEntries())
        return () => {
            dispatch(reset())
        }
    }, [user, dispatch])

    useEffect(() => {
        if (isError) {
            console.log('Error:', message)
        }
    }, [isError, message])

    return(
        <SafeAreaView style={screenStyles.entryScreen.container}>
            <Header user={user} navigation={navigation} />

            <ScrollView style={screenStyles.entryScreen.scrollView} showsVerticalScrollIndicator={false}>
                <View style={screenStyles.entryScreen.content}>

                    {/* Entry Form */}
                    <View style={screenStyles.entryScreen.section}>
                        <Text style={screenStyles.entryScreen.sectionTitle}>Create New Entry</Text>
                        <View style={screenStyles.entryScreen.formContainer}>
                            <EntryForm />
                        </View> 
                    </View>
                    
                    {/* Entries List */}
                    <View style={screenStyles.entryScreen.section}>
                        <View style={screenStyles.entryScreen.sectionHeader}>
                            <Text style={screenStyles.entryScreen.sectionTitle}>Entries</Text>
                            {entries?.length > 0 && (
                                <Text style={screenStyles.entryScreen.entryCount}>{entries.length} entries</Text>
                            )}
                        </View>
                        
                       {entries?.length > 0 ? (
                            <View style={screenStyles.entryScreen.entriesContainer}>
                                {entries.slice().reverse().map((entry, index) => (
                                    <EntryItem key={index} entry={entry} />
                                ))}
                          </View>
                          
                        ) : (
                            <View style={screenStyles.entryScreen.emptyContainer}>
                                <Text style={screenStyles.entryScreen.emptyText}>No entries yet</Text>
                                <Text style={screenStyles.entryScreen.emptySubtext}>Create your first entry to get started</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default EntryScreen
