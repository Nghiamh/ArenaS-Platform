import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getItem(key) {
    try {
        return await AsyncStorage.getItem(key);
    } catch (error) {
        console.warn(`[storage] Failed to read key: ${key}`, error);
        return null;
    }
}

export async function setItem(key, value) {
    try {
        await AsyncStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.warn(`[storage] Failed to write key: ${key}`, error);
        return false;
    }
}

export async function removeItem(key) {
    try {
        await AsyncStorage.removeItem(key);
        return true;
    } catch (error) {
        console.warn(`[storage] Failed to remove key: ${key}`, error);
        return false;
    }
}
