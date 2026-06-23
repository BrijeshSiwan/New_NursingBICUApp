import AsyncStorage from '@react-native-async-storage/async-storage';


export const storeCaptureDocuments = async (key,value) => {
  try {
    await  AsyncStorage.setItem(key,value)
  } catch (e) {
    console.log(e);
  }
}

export const getCaptureDocument = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key)
    if (value !== null) {
      return value;
    } else {
      return false;
    }
  } catch (e) {
    console.log(e);
  }
}

export const storeAuthToken = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value)
  } catch (e) {
    console.log(e);
  }
}

export const getAuthToken = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key)
    if (value !== null) {
      return value;
    } else {
      return false;
    }
  } catch (e) {
    console.log(e);
  }
}

export const storeDataObject = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value)
    await AsyncStorage.setItem(key, jsonValue)
  } catch (e) {
    console.log(e);
  }
}

export const getDataObject = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key)
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.log(e);
  }
}

export const setFCMToken = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value)
    await AsyncStorage.setItem(key, jsonValue)
  } catch (e) {
    console.log(e);
  }
}

export const getFCMToken = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key)
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.log(e);
  }
}

export const setLocalLanguage = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value)
    await AsyncStorage.setItem(key, jsonValue)
  } catch (e) {
    console.log(e);
  }
}

export const getLocalLanguage = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key)
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.log(e);
  }
}

export const removeDataValue = async () => {
  try {
    return await AsyncStorage.clear();
  } catch (e) {
    console.log(e);
  }
}

