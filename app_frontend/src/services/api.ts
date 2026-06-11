// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({ baseURL: 'http://192.168.0.229:8000' });

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        console.log("Atenção: Nenhum token encontrado no AsyncStorage!");
    }
    
    return config;
});

export default api;