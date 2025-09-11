import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getHierarchies, createHierarchy, updateHierarchy, deleteHierarchy, reset } from '../features/hierarchies/hierarchySlice';
import { loadUser } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
const HierarchyScreen = () => {
    const { hierarchies, isLoading, isError, message } = useSelector((state) => state.hierarchies);
    const dispatch = useDispatch();
    const navigate = useNavigate()  
    useEffect(() => {
        dispatch(loadUser())
    }, [])
    
    const {user} = useSelector((state) => state.auth)

    useEffect(() => {
        if (!user) {
            navigate('/')
            return
        }
        dispatch(getHierarchies(user.token))
        return () => {
            dispatch(reset())
        }
    }, [user, dispatch])

    useEffect(() => {
        if (isError) {
            console.log('Error:', message)
        }
    }, [isError, message])

}

export default HierarchyScreen;