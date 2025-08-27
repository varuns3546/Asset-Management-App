import React, { useEffect } from 'react';
import { ScrollView, SafeAreaView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import GeoPackageExport from '../components/GeoPackageExport';
import Header from '../components/Header';
import { loadUser } from '../features/auth/authSlice';
import { screenStyles } from '../styles';

const GeoPackageScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
  }, [user, navigation]);

  return (
    <SafeAreaView style={screenStyles.geopackageScreen.container}>
      <Header user={user} navigation={navigation} />
      
      <ScrollView 
        style={screenStyles.geopackageScreen.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={screenStyles.geopackageScreen.content}
      >
        <GeoPackageExport />
      </ScrollView>
    </SafeAreaView>
  );
};

export default GeoPackageScreen;
