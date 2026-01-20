import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    isBluetoothAvailable,
    requestBluetoothPermissions,
    scanForDevices,
    connectToDevice,
    disconnectFromDevice,
    readCharacteristic,
    subscribeToCharacteristic,
    BLE_SERVICES,
    BLE_CHARACTERISTICS,
    getDeviceType,
    parseHeartRate,
    parseBloodPressure,
    parseTemperature,
    parsePulseOximeter
} from '@/services/bluetoothService';
import { useAuthContext } from './AuthContext';
import { isAndroid, getPlatform } from '@/utils/platform';

const BluetoothContext = createContext();

export const useBluetoothContext = () => {
    const context = useContext(BluetoothContext);
    if (!context) {
        throw new Error('useBluetoothContext must be used within BluetoothProvider');
    }
    return context;
};

export const BluetoothProvider = ({ children }) => {
    const { user } = useAuthContext();

    // Check if Bluetooth is supported on this platform
    const platform = getPlatform();
    const isBluetoothSupported = platform === 'android' || platform === 'desktop';

    const [isAvailable, setIsAvailable] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [discoveredDevices, setDiscoveredDevices] = useState([]);
    const [pairedDevices, setPairedDevices] = useState([]);
    const [connectedDevices, setConnectedDevices] = useState([]);
    const [healthData, setHealthData] = useState({});

    // Check Bluetooth availability on mount (only on supported platforms)
    useEffect(() => {
        if (isBluetoothSupported) {
            console.log(`🔵 Bluetooth enabled on ${platform} platform`);
            checkBluetoothAvailability();
            loadPairedDevices();
        } else {
            console.log(`⚠️ Bluetooth not supported on ${platform} platform`);
        }
    }, [isBluetoothSupported, platform]);

    const checkBluetoothAvailability = async () => {
        try {
            const available = await isBluetoothAvailable();
            setIsAvailable(available);
        } catch (error) {
            console.error('Error checking Bluetooth availability:', error);
            setIsAvailable(false);
        }
    };

    const requestPermissions = async () => {
        try {
            const granted = await requestBluetoothPermissions();
            setHasPermission(granted);
            return granted;
        } catch (error) {
            console.error('Error requesting Bluetooth permissions:', error);
            return false;
        }
    };

    const startScan = async (duration = 10000) => {
        try {
            if (!hasPermission) {
                const granted = await requestPermissions();
                if (!granted) {
                    throw new Error('Bluetooth permission not granted');
                }
            }

            setIsScanning(true);
            setDiscoveredDevices([]);

            const devices = await scanForDevices(duration);

            // Filter for health devices only
            const healthDevices = devices.filter(device => {
                return device.services?.some(service =>
                    Object.values(BLE_SERVICES).includes(service.toLowerCase())
                );
            });

            setDiscoveredDevices(healthDevices);
            setIsScanning(false);

            return healthDevices;
        } catch (error) {
            console.error('Error scanning for devices:', error);
            setIsScanning(false);
            throw error;
        }
    };

    const stopScan = () => {
        setIsScanning(false);
    };

    const pairDevice = async (device) => {
        try {
            await connectToDevice(device.id);

            // Add to paired devices
            const newDevice = {
                ...device,
                pairedAt: new Date().toISOString(),
                userId: user?.id
            };

            const updatedPaired = [...pairedDevices, newDevice];
            setPairedDevices(updatedPaired);
            setConnectedDevices([...connectedDevices, device.id]);

            // Save to localStorage
            savePairedDevices(updatedPaired);

            // Start reading health data
            startHealthDataSync(device);

            return true;
        } catch (error) {
            console.error('Error pairing device:', error);
            throw error;
        }
    };

    const unpairDevice = async (deviceId) => {
        try {
            await disconnectFromDevice(deviceId);

            const updatedPaired = pairedDevices.filter(d => d.id !== deviceId);
            setPairedDevices(updatedPaired);
            setConnectedDevices(connectedDevices.filter(id => id !== deviceId));

            // Remove health data for this device
            const updatedHealthData = { ...healthData };
            delete updatedHealthData[deviceId];
            setHealthData(updatedHealthData);

            savePairedDevices(updatedPaired);

            return true;
        } catch (error) {
            console.error('Error unpairing device:', error);
            throw error;
        }
    };

    const reconnectDevice = async (device) => {
        try {
            await connectToDevice(device.id);
            setConnectedDevices([...connectedDevices, device.id]);
            startHealthDataSync(device);
            return true;
        } catch (error) {
            console.error('Error reconnecting device:', error);
            throw error;
        }
    };

    const startHealthDataSync = async (device) => {
        try {
            const deviceType = getDeviceType(device.services[0]);

            // Determine which characteristic to read based on device type
            let serviceUuid, characteristicUuid, parser;

            if (deviceType.includes('Heart Rate')) {
                serviceUuid = BLE_SERVICES.HEART_RATE;
                characteristicUuid = BLE_CHARACTERISTICS.HEART_RATE_MEASUREMENT;
                parser = parseHeartRate;
            } else if (deviceType.includes('Blood Pressure')) {
                serviceUuid = BLE_SERVICES.BLOOD_PRESSURE;
                characteristicUuid = BLE_CHARACTERISTICS.BLOOD_PRESSURE_MEASUREMENT;
                parser = parseBloodPressure;
            } else if (deviceType.includes('Thermometer')) {
                serviceUuid = BLE_SERVICES.HEALTH_THERMOMETER;
                characteristicUuid = BLE_CHARACTERISTICS.TEMPERATURE_MEASUREMENT;
                parser = parseTemperature;
            } else if (deviceType.includes('Pulse Oximeter')) {
                serviceUuid = BLE_SERVICES.PULSE_OXIMETER;
                characteristicUuid = BLE_CHARACTERISTICS.PULSE_OXIMETER_MEASUREMENT;
                parser = parsePulseOximeter;
            } else {
                console.warn('Unknown device type:', deviceType);
                return;
            }

            // Subscribe to characteristic notifications
            const unlisten = await subscribeToCharacteristic(
                device.id,
                serviceUuid,
                characteristicUuid,
                (rawData) => {
                    const parsedData = parser(rawData);
                    updateHealthData(device.id, deviceType, parsedData);
                }
            );

            // Store unlisten function for cleanup
            device.unlisten = unlisten;

        } catch (error) {
            console.error('Error starting health data sync:', error);
        }
    };

    const updateHealthData = (deviceId, deviceType, data) => {
        setHealthData(prev => ({
            ...prev,
            [deviceId]: {
                deviceType,
                data,
                timestamp: new Date().toISOString()
            }
        }));
    };

    const getLatestHealthData = (deviceId) => {
        return healthData[deviceId];
    };

    const getAllHealthData = () => {
        return Object.values(healthData);
    };

    // LocalStorage helpers
    const savePairedDevices = (devices) => {
        try {
            localStorage.setItem('pairedBluetoothDevices', JSON.stringify(devices));
        } catch (error) {
            console.error('Error saving paired devices:', error);
        }
    };

    const loadPairedDevices = () => {
        try {
            const saved = localStorage.getItem('pairedBluetoothDevices');
            if (saved) {
                const devices = JSON.parse(saved);
                // Filter devices for current user
                const userDevices = user?.id
                    ? devices.filter(d => d.userId === user.id)
                    : devices;
                setPairedDevices(userDevices);
            }
        } catch (error) {
            console.error('Error loading paired devices:', error);
        }
    };

    const value = {
        isBluetoothSupported,
        isAvailable,
        hasPermission,
        isScanning,
        discoveredDevices,
        pairedDevices,
        connectedDevices,
        healthData,
        requestPermissions,
        startScan,
        stopScan,
        pairDevice,
        unpairDevice,
        reconnectDevice,
        getLatestHealthData,
        getAllHealthData
    };

    return (
        <BluetoothContext.Provider value={value}>
            {children}
        </BluetoothContext.Provider>
    );
};
