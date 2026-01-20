import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Bluetooth, Activity, Heart, Thermometer, Droplet, Scale, Zap, CheckCircle, XCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useBluetoothContext } from "@/context/BluetoothContext";

export default function BluetoothTest() {
    const {
        isAvailable,
        hasPermission,
        isScanning,
        discoveredDevices,
        pairedDevices,
        connectedDevices,
        healthData,
        requestPermission,
        startScan,
        stopScan,
        pairDevice,
        unpairDevice,
        connectDevice,
        disconnectDevice,
        getAllHealthData
    } = useBluetoothContext();

    const [testResults, setTestResults] = useState({
        availability: null,
        permission: null,
        scanning: null,
        pairing: null,
        connection: null,
        dataSync: null
    });

    const [selectedDevice, setSelectedDevice] = useState(null);

    // Check if running in Tauri
    const isTauri = window.__TAURI_INTERNALS__ !== undefined;

    useEffect(() => {
        // Update test results based on context state
        setTestResults(prev => ({
            ...prev,
            availability: isAvailable ? 'pass' : 'fail',
            permission: hasPermission ? 'pass' : hasPermission === false ? 'fail' : null
        }));
    }, [isAvailable, hasPermission]);

    const runFullTest = async () => {
        console.log('🧪 Starting Bluetooth Full Test...');

        // Test 1: Check Availability
        setTestResults(prev => ({ ...prev, availability: isAvailable ? 'pass' : 'fail' }));

        // Test 2: Request Permission
        if (!hasPermission) {
            const granted = await requestPermission();
            setTestResults(prev => ({ ...prev, permission: granted ? 'pass' : 'fail' }));
            if (!granted) return;
        } else {
            setTestResults(prev => ({ ...prev, permission: 'pass' }));
        }

        // Test 3: Scan for Devices
        setTestResults(prev => ({ ...prev, scanning: 'running' }));
        await startScan();
        setTimeout(() => {
            stopScan();
            setTestResults(prev => ({
                ...prev,
                scanning: discoveredDevices.length > 0 ? 'pass' : 'warning'
            }));
        }, 5000);
    };

    const testPairing = async (device) => {
        setTestResults(prev => ({ ...prev, pairing: 'running' }));
        setSelectedDevice(device);

        try {
            await pairDevice(device);
            setTestResults(prev => ({ ...prev, pairing: 'pass' }));
        } catch (error) {
            console.error('Pairing failed:', error);
            setTestResults(prev => ({ ...prev, pairing: 'fail' }));
        }
    };

    const testConnection = async (device) => {
        setTestResults(prev => ({ ...prev, connection: 'running' }));

        try {
            await connectDevice(device.id);
            setTestResults(prev => ({ ...prev, connection: 'pass' }));

            // Test data sync
            setTimeout(() => {
                const data = getAllHealthData();
                setTestResults(prev => ({
                    ...prev,
                    dataSync: Object.keys(data).length > 0 ? 'pass' : 'warning'
                }));
            }, 2000);
        } catch (error) {
            console.error('Connection failed:', error);
            setTestResults(prev => ({ ...prev, connection: 'fail' }));
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pass':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'fail':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-600" />;
            case 'running':
                return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
            default:
                return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pass':
                return 'Passed';
            case 'fail':
                return 'Failed';
            case 'warning':
                return 'Warning';
            case 'running':
                return 'Running...';
            default:
                return 'Not Tested';
        }
    };

    if (!isTauri) {
        return (
            <DashboardLayout>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <Bluetooth className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bluetooth Testing Unavailable</h2>
                        <p className="text-gray-600 mb-4">
                            This page is only available in the Android APK or Windows EXE builds.
                        </p>
                        <p className="text-sm text-gray-500">
                            Build the app using <code className="bg-gray-100 px-2 py-1 rounded">npm run tauri:android</code> or <code className="bg-gray-100 px-2 py-1 rounded">npm run tauri build</code>
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader
                    title="Bluetooth Testing"
                    subtitle="Test Bluetooth functionality and device connectivity"
                    showSearch={false}
                    rightContent={
                        <button
                            onClick={runFullTest}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors text-sm font-medium"
                        >
                            <Zap size={18} />
                            <span className="hidden sm:inline">Run Full Test</span>
                        </button>
                    }
                />

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">

                        {/* Test Results */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                <TestResultRow
                                    label="Bluetooth Availability"
                                    status={testResults.availability}
                                    getStatusIcon={getStatusIcon}
                                    getStatusText={getStatusText}
                                />
                                <TestResultRow
                                    label="Permission Granted"
                                    status={testResults.permission}
                                    getStatusIcon={getStatusIcon}
                                    getStatusText={getStatusText}
                                    action={!hasPermission && (
                                        <button
                                            onClick={requestPermission}
                                            className="text-sm text-blue-600 font-medium hover:text-blue-700"
                                        >
                                            Request
                                        </button>
                                    )}
                                />
                                <TestResultRow
                                    label="Device Scanning"
                                    status={testResults.scanning}
                                    getStatusIcon={getStatusIcon}
                                    getStatusText={getStatusText}
                                    action={
                                        <button
                                            onClick={isScanning ? stopScan : startScan}
                                            className="text-sm text-blue-600 font-medium hover:text-blue-700"
                                        >
                                            {isScanning ? 'Stop' : 'Start'} Scan
                                        </button>
                                    }
                                />
                                <TestResultRow
                                    label="Device Pairing"
                                    status={testResults.pairing}
                                    getStatusIcon={getStatusIcon}
                                    getStatusText={getStatusText}
                                />
                                <TestResultRow
                                    label="Device Connection"
                                    status={testResults.connection}
                                    getStatusIcon={getStatusIcon}
                                    getStatusText={getStatusText}
                                />
                                <TestResultRow
                                    label="Data Synchronization"
                                    status={testResults.dataSync}
                                    getStatusIcon={getStatusIcon}
                                    getStatusText={getStatusText}
                                />
                            </div>
                        </div>

                        {/* Discovered Devices */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Discovered Devices</h3>
                                    <p className="text-sm text-gray-500">{discoveredDevices.length} device(s) found</p>
                                </div>
                                {isScanning && (
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm font-medium">Scanning...</span>
                                    </div>
                                )}
                            </div>
                            <div className="divide-y divide-gray-100">
                                {discoveredDevices.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <Bluetooth className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No devices found. Start scanning to discover nearby BLE devices.</p>
                                    </div>
                                ) : (
                                    discoveredDevices.map((device) => (
                                        <DeviceRow
                                            key={device.id}
                                            device={device}
                                            onPair={() => testPairing(device)}
                                            isPaired={pairedDevices.some(d => d.id === device.id)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Paired Devices */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Paired Devices</h3>
                                <p className="text-sm text-gray-500">{pairedDevices.length} device(s) paired</p>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {pairedDevices.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <Bluetooth className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No paired devices. Pair a device from the discovered list above.</p>
                                    </div>
                                ) : (
                                    pairedDevices.map((device) => {
                                        const isConnected = connectedDevices.some(d => d.id === device.id);
                                        return (
                                            <PairedDeviceRow
                                                key={device.id}
                                                device={device}
                                                isConnected={isConnected}
                                                onConnect={() => testConnection(device)}
                                                onDisconnect={() => disconnectDevice(device.id)}
                                                onUnpair={() => unpairDevice(device.id)}
                                            />
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Health Data */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Real-time Health Data</h3>
                                <p className="text-sm text-gray-500">Data from connected devices</p>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <HealthDataCard
                                        icon={<Heart className="w-6 h-6" />}
                                        label="Heart Rate"
                                        value={healthData.heartRate}
                                        unit="bpm"
                                        color="red"
                                    />
                                    <HealthDataCard
                                        icon={<Activity className="w-6 h-6" />}
                                        label="Blood Pressure"
                                        value={healthData.bloodPressure ? `${healthData.bloodPressure.systolic}/${healthData.bloodPressure.diastolic}` : null}
                                        unit="mmHg"
                                        color="blue"
                                    />
                                    <HealthDataCard
                                        icon={<Thermometer className="w-6 h-6" />}
                                        label="Temperature"
                                        value={healthData.temperature}
                                        unit="°C"
                                        color="orange"
                                    />
                                    <HealthDataCard
                                        icon={<Droplet className="w-6 h-6" />}
                                        label="SpO2"
                                        value={healthData.oxygenSaturation}
                                        unit="%"
                                        color="purple"
                                    />
                                    <HealthDataCard
                                        icon={<Scale className="w-6 h-6" />}
                                        label="Weight"
                                        value={healthData.weight}
                                        unit="kg"
                                        color="green"
                                    />
                                    <HealthDataCard
                                        icon={<Droplet className="w-6 h-6" />}
                                        label="Glucose"
                                        value={healthData.glucose}
                                        unit="mg/dL"
                                        color="yellow"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Helper Components
function TestResultRow({ label, status, getStatusIcon, getStatusText, action }) {
    return (
        <div className="p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <div className="flex items-center gap-3">
                {action}
                <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="text-sm text-gray-600">{getStatusText(status)}</span>
                </div>
            </div>
        </div>
    );
}

function DeviceRow({ device, onPair, isPaired }) {
    return (
        <div className="p-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bluetooth className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <div className="font-medium text-gray-900">{device.name || 'Unknown Device'}</div>
                    <div className="text-xs text-gray-500">{device.id}</div>
                </div>
            </div>
            <button
                onClick={onPair}
                disabled={isPaired}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isPaired
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
            >
                {isPaired ? 'Paired' : 'Pair'}
            </button>
        </div>
    );
}

function PairedDeviceRow({ device, isConnected, onConnect, onDisconnect, onUnpair }) {
    return (
        <div className="p-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isConnected ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                    {isConnected ? (
                        <Wifi className="w-5 h-5 text-green-600" />
                    ) : (
                        <WifiOff className="w-5 h-5 text-gray-400" />
                    )}
                </div>
                <div>
                    <div className="font-medium text-gray-900">{device.name || 'Unknown Device'}</div>
                    <div className="text-xs text-gray-500">
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={isConnected ? onDisconnect : onConnect}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isConnected
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                >
                    {isConnected ? 'Disconnect' : 'Connect'}
                </button>
                <button
                    onClick={onUnpair}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                >
                    Unpair
                </button>
            </div>
        </div>
    );
}

function HealthDataCard({ icon, label, value, unit, color }) {
    const colorClasses = {
        red: 'bg-red-100 text-red-600',
        blue: 'bg-blue-100 text-blue-600',
        orange: 'bg-orange-100 text-orange-600',
        purple: 'bg-purple-100 text-purple-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-600'
    };

    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
                <span className="text-sm font-medium text-gray-600">{label}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                    {value || '--'}
                </span>
                {value && <span className="text-sm text-gray-500">{unit}</span>}
            </div>
        </div>
    );
}
