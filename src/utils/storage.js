/**
 * Storage Utility
 * Uses Tauri Store plugin for Android/Desktop and localStorage for web
 */

import { Store } from '@tauri-apps/plugin-store';

let store = null;

// Initialize store for Tauri environments
async function getStore() {
    if (store) return store;

    if (window.__TAURI_INTERNALS__) {
        try {
            store = await Store.load('medbeacon.dat');
            console.log('✅ Tauri Store initialized');
            return store;
        } catch (error) {
            console.error('Failed to initialize Tauri Store:', error);
            return null;
        }
    }

    return null;
}

/**
 * Set item in storage
 * @param {string} key 
 * @param {string} value 
 */
export async function setItem(key, value) {
    try {
        const tauriStore = await getStore();

        if (tauriStore) {
            // Use Tauri Store for Android/Desktop
            await tauriStore.set(key, value);
            await tauriStore.save();
            console.log(`✅ Saved to Tauri Store: ${key}`);
        } else {
            // Fallback to localStorage for web
            localStorage.setItem(key, value);
            console.log(`✅ Saved to localStorage: ${key}`);
        }
    } catch (error) {
        console.error(`Failed to set item ${key}:`, error);
        // Fallback to localStorage on error
        localStorage.setItem(key, value);
    }
}

/**
 * Get item from storage
 * @param {string} key 
 * @returns {Promise<string|null>}
 */
export async function getItem(key) {
    try {
        const tauriStore = await getStore();

        if (tauriStore) {
            // Use Tauri Store for Android/Desktop
            const value = await tauriStore.get(key);
            console.log(`✅ Retrieved from Tauri Store: ${key} = ${value ? '***' : 'null'}`);
            return value;
        } else {
            // Fallback to localStorage for web
            const value = localStorage.getItem(key);
            console.log(`✅ Retrieved from localStorage: ${key} = ${value ? '***' : 'null'}`);
            return value;
        }
    } catch (error) {
        console.error(`Failed to get item ${key}:`, error);
        // Fallback to localStorage on error
        return localStorage.getItem(key);
    }
}

/**
 * Remove item from storage
 * @param {string} key 
 */
export async function removeItem(key) {
    try {
        const tauriStore = await getStore();

        if (tauriStore) {
            // Use Tauri Store for Android/Desktop
            await tauriStore.delete(key);
            await tauriStore.save();
            console.log(`✅ Removed from Tauri Store: ${key}`);
        } else {
            // Fallback to localStorage for web
            localStorage.removeItem(key);
            console.log(`✅ Removed from localStorage: ${key}`);
        }
    } catch (error) {
        console.error(`Failed to remove item ${key}:`, error);
        // Fallback to localStorage on error
        localStorage.removeItem(key);
    }
}

/**
 * Get item synchronously (for initialization)
 * Only works with localStorage, returns null for Tauri
 * @param {string} key 
 * @returns {string|null}
 */
export function getItemSync(key) {
    if (typeof window === 'undefined') return null;

    // For Tauri, we can't get synchronously, return null
    // The async version will be called during initialization
    if (window.__TAURI_INTERNALS__) {
        return null;
    }

    return localStorage.getItem(key);
}
