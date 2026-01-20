/**
 * Bluetooth Service Module
 * Handles BLE device scanning, connection, and health data reading
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Standard BLE Health Service UUIDs
 */
export const BLE_SERVICES = {
    HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
    BLOOD_PRESSURE: '00001810-0000-1000-8000-00805f9b34fb',
    HEALTH_THERMOMETER: '00001809-0000-1000-8000-00805f9b34fb',
    PULSE_OXIMETER: '00001822-0000-1000-8000-00805f9b34fb',
    GLUCOSE: '00001808-0000-1000-8000-00805f9b34fb',
    WEIGHT_SCALE: '0000181d-0000-1000-8000-00805f9b34fb'
};

/**
 * Standard BLE Characteristic UUIDs
 */
export const BLE_CHARACTERISTICS = {
    HEART_RATE_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',
    BLOOD_PRESSURE_MEASUREMENT: '00002a35-0000-1000-8000-00805f9b34fb',
    TEMPERATURE_MEASUREMENT: '00002a1c-0000-1000-8000-00805f9b34fb',
    PULSE_OXIMETER_MEASUREMENT: '00002a5f-0000-1000-8000-00805f9b34fb',
    GLUCOSE_MEASUREMENT: '00002a18-0000-1000-8000-00805f9b34fb',
    WEIGHT_MEASUREMENT: '00002a9d-0000-1000-8000-00805f9b34fb',
    BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb'
};

/**
 * Device type mapping based on service UUID
 */
export function getDeviceType(serviceUuid) {
    const uuid = serviceUuid.toLowerCase();

    if (uuid.includes('180d')) return 'Heart Rate Monitor';
    if (uuid.includes('1810')) return 'Blood Pressure Monitor';
    if (uuid.includes('1809')) return 'Thermometer';
    if (uuid.includes('1822')) return 'Pulse Oximeter';
    if (uuid.includes('1808')) return 'Glucose Meter';
    if (uuid.includes('181d')) return 'Weight Scale';

    return 'Unknown Device';
}

/**
 * Check if Bluetooth is available
 * @returns {Promise<boolean>}
 */
export async function isBluetoothAvailable() {
    try {
        if (!window.__TAURI_INTERNALS__) {
            console.warn('Not in Tauri environment, Bluetooth not available');
            return false;
        }

        const available = await invoke('plugin:blec|is_available');
        return available;
    } catch (error) {
        console.error('Error checking Bluetooth availability:', error);
        return false;
    }
}

/**
 * Request Bluetooth permissions
 * @returns {Promise<boolean>}
 */
export async function requestBluetoothPermissions() {
    try {
        if (!window.__TAURI_INTERNALS__) {
            console.warn('Not in Tauri environment, skipping Bluetooth permission request');
            return false;
        }

        const granted = await invoke('plugin:blec|request_permissions');
        return granted;
    } catch (error) {
        console.error('Error requesting Bluetooth permissions:', error);
        return false;
    }
}

/**
 * Scan for nearby BLE devices
 * @param {number} duration - Scan duration in milliseconds
 * @returns {Promise<Array>} Array of discovered devices
 */
export async function scanForDevices(duration = 10000) {
    try {
        if (!window.__TAURI_INTERNALS__) {
            console.warn('Not in Tauri environment, returning mock devices');
            return getMockDevices();
        }

        const devices = await invoke('plugin:blec|scan', { duration });
        console.log('Discovered devices:', devices);
        return devices || [];
    } catch (error) {
        console.error('Error scanning for devices:', error);
        throw error;
    }
}

/**
 * Connect to a BLE device
 * @param {string} deviceId - Device ID to connect to
 * @returns {Promise<boolean>}
 */
export async function connectToDevice(deviceId) {
    try {
        if (!window.__TAURI_INTERNALS__) {
            console.warn('Not in Tauri environment, simulating connection');
            return true;
        }

        await invoke('plugin:blec|connect', { deviceId });
        console.log('Connected to device:', deviceId);
        return true;
    } catch (error) {
        console.error('Error connecting to device:', error);
        throw error;
    }
}

/**
 * Disconnect from a BLE device
 * @param {string} deviceId - Device ID to disconnect from
 * @returns {Promise<boolean>}
 */
export async function disconnectFromDevice(deviceId) {
    try {
        if (!window.__TAURI_INTERNALS__) {
            console.warn('Not in Tauri environment, simulating disconnection');
            return true;
        }

        await invoke('plugin:blec|disconnect', { deviceId });
        console.log('Disconnected from device:', deviceId);
        return true;
    } catch (error) {
        console.error('Error disconnecting from device:', error);
        throw error;
    }
}

/**
 * Read characteristic value from device
 * @param {string} deviceId - Device ID
 * @param {string} serviceUuid - Service UUID
 * @param {string} characteristicUuid - Characteristic UUID
 * @returns {Promise<any>} Characteristic value
 */
export async function readCharacteristic(deviceId, serviceUuid, characteristicUuid) {
    try {
        if (!window.__TAURI_INTERNALS__) {
            console.warn('Not in Tauri environment, returning mock data');
            return getMockCharacteristicValue(characteristicUuid);
        }

        const value = await invoke('plugin:blec|read_characteristic', {
            deviceId,
            serviceUuid,
            characteristicUuid
        });

        return value;
    } catch (error) {
        console.error('Error reading characteristic:', error);
        throw error;
    }
}

/**
 * Subscribe to characteristic notifications
 * @param {string} deviceId - Device ID
 * @param {string} serviceUuid - Service UUID
 * @param {string} characteristicUuid - Characteristic UUID
 * @param {Function} callback - Callback function for notifications
 * @returns {Promise<void>}
 */
export async function subscribeToCharacteristic(deviceId, serviceUuid, characteristicUuid, callback) {
    try {
        if (!window.__TAURI_INTERNALS__) {
            console.warn('Not in Tauri environment, simulating subscription');
            // Simulate periodic updates
            const interval = setInterval(() => {
                callback(getMockCharacteristicValue(characteristicUuid));
            }, 2000);

            return () => clearInterval(interval);
        }

        await invoke('plugin:blec|subscribe', {
            deviceId,
            serviceUuid,
            characteristicUuid
        });

        // Set up event listener for notifications
        // Note: This is a simplified version. Actual implementation depends on plugin API
        const unlisten = await window.__TAURI__.event.listen('ble-notification', (event) => {
            if (event.payload.characteristicUuid === characteristicUuid) {
                callback(event.payload.value);
            }
        });

        return unlisten;
    } catch (error) {
        console.error('Error subscribing to characteristic:', error);
        throw error;
    }
}

/**
 * Parse heart rate measurement
 * @param {ArrayBuffer} data - Raw data from heart rate characteristic
 * @returns {Object} Parsed heart rate data
 */
export function parseHeartRate(data) {
    const view = new DataView(data);
    const flags = view.getUint8(0);
    const rate = view.getUint8(1);

    return {
        heartRate: rate,
        contactDetected: (flags & 0x02) !== 0
    };
}

/**
 * Parse blood pressure measurement
 * @param {ArrayBuffer} data - Raw data from blood pressure characteristic
 * @returns {Object} Parsed blood pressure data
 */
export function parseBloodPressure(data) {
    const view = new DataView(data);
    const flags = view.getUint8(0);

    const systolic = view.getUint16(1, true);
    const diastolic = view.getUint16(3, true);
    const meanPressure = view.getUint16(5, true);

    return {
        systolic: systolic / 10,
        diastolic: diastolic / 10,
        meanPressure: meanPressure / 10,
        unit: (flags & 0x01) ? 'kPa' : 'mmHg'
    };
}

/**
 * Parse temperature measurement
 * @param {ArrayBuffer} data - Raw data from temperature characteristic
 * @returns {Object} Parsed temperature data
 */
export function parseTemperature(data) {
    const view = new DataView(data);
    const flags = view.getUint8(0);

    const tempValue = view.getUint32(1, true);
    const temperature = tempValue / 100;

    return {
        temperature,
        unit: (flags & 0x01) ? 'Fahrenheit' : 'Celsius'
    };
}

/**
 * Parse pulse oximeter measurement
 * @param {ArrayBuffer} data - Raw data from pulse oximeter characteristic
 * @returns {Object} Parsed SpO2 data
 */
export function parsePulseOximeter(data) {
    const view = new DataView(data);
    const flags = view.getUint8(0);

    const spo2 = view.getUint16(1, true);
    const pulseRate = view.getUint16(3, true);

    return {
        oxygenSaturation: spo2 / 10,
        pulseRate: pulseRate / 10
    };
}

// Mock data for testing in web environment
function getMockDevices() {
    return [
        {
            id: 'mock-hr-001',
            name: 'Heart Rate Monitor',
            rssi: -60,
            services: [BLE_SERVICES.HEART_RATE]
        },
        {
            id: 'mock-bp-001',
            name: 'Blood Pressure Monitor',
            rssi: -55,
            services: [BLE_SERVICES.BLOOD_PRESSURE]
        }
    ];
}

function getMockCharacteristicValue(characteristicUuid) {
    const uuid = characteristicUuid.toLowerCase();

    if (uuid.includes('2a37')) {
        // Heart rate
        return { heartRate: Math.floor(Math.random() * 40) + 60 };
    }

    if (uuid.includes('2a35')) {
        // Blood pressure
        return {
            systolic: Math.floor(Math.random() * 20) + 110,
            diastolic: Math.floor(Math.random() * 15) + 70
        };
    }

    if (uuid.includes('2a1c')) {
        // Temperature
        return { temperature: (Math.random() * 2 + 36).toFixed(1) };
    }

    if (uuid.includes('2a5f')) {
        // Pulse oximeter
        return {
            oxygenSaturation: Math.floor(Math.random() * 5) + 95,
            pulseRate: Math.floor(Math.random() * 40) + 60
        };
    }

    return null;
}
