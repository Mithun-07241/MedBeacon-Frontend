import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import {
    Bluetooth,
    Activity,
    Heart,
    Thermometer,
    Droplet,
    Scale,
    Zap,
    CheckCircle,
    XCircle,
    AlertCircle,
    Wifi,
    WifiOff,
    RefreshCw,
    Trash2,
    Link,
    Unlink
} from 'lucide-react';
import { useBluetoothContext } from "@/context/BluetoothContext";
import { useToast } from "@/hooks/use-toast";

export default function BluetoothDevices() {
    const {
        isBluetoothSupported,
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

    const { toast } = useToast();
    const [developerMode, setDeveloperMode] = useState(() => {
        return localStorage.getItem('bluetooth_dev_mode') === 'true';
    });
    const [tapCount, setTapCount] = useState(0);
    const [testResults, setTestResults] = useState({
        availability: null,
        permission: null,
        scanning: null,
        pairing: null,
        connection: null,
        dataSync: null
    });

    // Handle version tap for developer mode
    const handleVersionTap = () => {
        const newCount = tapCount + 1;
        setTapCount(newCount);

        if (newCount === 7) {
            const newMode = !developerMode;
            setDeveloperMode(newMode);
            localStorage.setItem('bluetooth_dev_mode', newMode.toString());
            toast({
                title: newMode ? "🔓 Developer Mode Enabled" : "🔒 Developer Mode Disabled",
                description: newMode
                    ? "Advanced testing features unlocked!"
                    : "Developer features hidden",
            });
            setTapCount(0);
        } else if (newCount > 3 && newCount < 7) {
            toast({
                title: `${7 - newCount} more taps...`,
                description: "Keep tapping to unlock developer mode",
                duration: 1000,
            });
        }

        // Reset tap count after 2 seconds
        setTimeout(() => setTapCount(0), 2000);
    };

    useEffect(() => {
        setTestResults(prev => ({
            ...prev,
            availability: isAvailable ? 'pass' : 'fail',
            permission: hasPermission ? 'pass' : hasPermission === false ? 'fail' : null
        }));
    }, [isAvailable, hasPermission]);

    const runFullTest = async () => {
        console.log('🧪 Starting Bluetooth Full Test...');

        setTestResults(prev => ({ ...prev, availability: isAvailable ? 'pass' : 'fail' }));

        if (!hasPermission) {
            const granted = await requestPermission();
            setTestResults(prev => ({ ...prev, permission: granted ? 'pass' : 'fail' }));
            if (!granted) return;
        } else {
            setTestResults(prev => ({ ...prev, permission: 'pass' }));
        }

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
        try {
            await pairDevice(device);
            setTestResults(prev => ({ ...prev, pairing: 'pass' }));
            toast({ title: "Device Paired", description: `${device.name} paired successfully` });
        } catch (error) {
            setTestResults(prev => ({ ...prev, pairing: 'fail' }));
            toast({ title: "Pairing Failed", description: error.message, variant: "destructive" });
        }
    };

    const testConnection = async (device) => {
        setTestResults(prev => ({ ...prev, connection: 'running' }));
        try {
            await connectDevice(device.id);
            setTestResults(prev => ({ ...prev, connection: 'pass' }));
            setTimeout(() => {
                const data = getAllHealthData();
                setTestResults(prev => ({
                    ...prev,
                    dataSync: Object.keys(data).length > 0 ? 'pass' : 'warning'
                }));
            }, 2000);
        } catch (error) {
            setTestResults(prev => ({ ...prev, connection: 'fail' }));
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pass': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'fail': return <XCircle className="w-5 h-5 text-red-600" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
            case 'running': return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
            default: return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pass': return 'Passed';
            case 'fail': return 'Failed';
            case 'warning': return 'Warning';
            case 'running': return 'Running...';
            default: return 'Not Tested';
        }
    };

    return (
        <DashboardLayout>
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader
                    title="Bluetooth Devices"
                    subtitle="Manage your health monitoring devices"
                    showSearch={false}
                    rightContent={
                        <div className="flex gap-2">
                            {developerMode && (
                                <button
                                    onClick={runFullTest}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors text-sm font-medium"
                                >
                                    <Zap size={18} />
                                    <span className="hidden sm:inline">Run Tests</span>
                                </button>
                            )}
                            <button
                                onClick={isScanning ? stopScan : startScan}
                                disabled={!hasPermission}
                                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw size={18} className={isScanning ? 'animate-spin' : ''} />
                                <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Scan'}</span>
                            </button>
                        </div>
                    }
                />

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">

                        {/* Platform Not Supported Message */}
                        {!isBluetoothSupported && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Bluetooth className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                                            Bluetooth Not Available on Web
                                        </h3>
                                        <p className="text-yellow-800 mb-3">
                                            Bluetooth health device connectivity is only available on:
                                        </p>
                                        <ul className="list-disc list-inside text-yellow-800 space-y-1 mb-4">
                                            <li><strong>Android App</strong> - Download and install the MedBeacon Android app</li>
                                            <li><strong>Windows Desktop</strong> - Download and install the MedBeacon desktop application</li>
                                        </ul>
                                        <p className="text-sm text-yellow-700">
                                            💡 <strong>Tip:</strong> Use the native app to connect your Bluetooth health monitoring devices like heart rate monitors, blood pressure cuffs, and thermometers.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Status Banner */}
                        {isBluetoothSupported && (
                            <div className={`rounded-xl p-4 border ${!isAvailable ? 'bg-red-50 border-red-200' :
                                !hasPermission ? 'bg-yellow-50 border-yellow-200' :
                                    'bg-blue-50 border-blue-200'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Bluetooth className={`w-5 h-5 ${!isAvailable ? 'text-red-600' :
                                            !hasPermission ? 'text-yellow-600' :
                                                'text-blue-600'
                                            }`} />
                                        <div>
                                            <p className={`font-medium ${!isAvailable ? 'text-red-900' :
                                                !hasPermission ? 'text-yellow-900' :
                                                    'text-blue-900'
                                                }`}>
                                                {!isAvailable ? 'Bluetooth Unavailable' :
                                                    !hasPermission ? 'Permission Required' :
                                                        `${connectedDevices.length} of ${pairedDevices.length} device(s) connected`}
                                            </p>
                                            <p className={`text-sm ${!isAvailable ? 'text-red-700' :
                                                !hasPermission ? 'text-yellow-700' :
                                                    'text-blue-700'
                                                }`}>
                                                {!isAvailable ? 'Bluetooth is not available on this device' :
                                                    !hasPermission ? 'Grant Bluetooth permissions to scan for devices' :
                                                        'Auto-syncing health data from connected devices'}
                                            </p>
                                        </div>
                                    </div>
                                    {!hasPermission && isAvailable && (
                                        <button
                                            onClick={requestPermission}
                                            className="text-sm text-yellow-600 font-medium hover:text-yellow-700 underline"
                                        >
                                            Grant Permission
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Developer Mode - Test Results */}
                        {developerMode && (
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-purple-100 bg-purple-100/50">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-purple-600" />
                                        <h3 className="text-lg font-semibold text-purple-900">Developer Mode - Test Results</h3>
                                    </div>
                                </div>
                                <div className="divide-y divide-purple-100">
                                    <TestResultRow label="Bluetooth Availability" status={testResults.availability} getStatusIcon={getStatusIcon} getStatusText={getStatusText} />
                                    <TestResultRow label="Permission Granted" status={testResults.permission} getStatusIcon={getStatusIcon} getStatusText={getStatusText} />
                                    <TestResultRow label="Device Scanning" status={testResults.scanning} getStatusIcon={getStatusIcon} getStatusText={getStatusText} />
                                    <TestResultRow label="Device Pairing" status={testResults.pairing} getStatusIcon={getStatusIcon} getStatusText={getStatusText} />
                                    <TestResultRow label="Device Connection" status={testResults.connection} getStatusIcon={getStatusIcon} getStatusText={getStatusText} />
                                    <TestResultRow label="Data Synchronization" status={testResults.dataSync} getStatusIcon={getStatusIcon} getStatusText={getStatusText} />
                                </div>
                            </div>
                        )}

                        {/* Discovered Devices */}
                        {isBluetoothSupported && (
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
                                            <p>No devices found. {hasPermission ? 'Tap "Scan" to discover nearby BLE devices.' : 'Grant permission to scan.'}</p>
                                        </div>
                                    ) : (
                                        discoveredDevices.map((device) => (
                                            <DeviceRow
                                                key={device.id}
                                                device={device}
                                                onPair={() => developerMode ? testPairing(device) : pairDevice(device)}
                                                isPaired={pairedDevices.some(d => d.id === device.id)}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Paired Devices */}
                        {isBluetoothSupported && (
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
                                                    onConnect={() => developerMode ? testConnection(device) : connectDevice(device.id)}
                                                    onDisconnect={() => disconnectDevice(device.id)}
                                                    onUnpair={() => unpairDevice(device.id)}
                                                />
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Developer Mode - Real-time Health Data */}
                        {developerMode && (
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-green-100 bg-green-100/50">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-green-600" />
                                        <h3 className="text-lg font-semibold text-green-900">Real-time Health Data</h3>
                                    </div>
                                    <p className="text-sm text-green-700 mt-1">Live data from connected devices</p>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <HealthDataCard icon={<Heart className="w-6 h-6" />} label="Heart Rate" value={healthData.heartRate} unit="bpm" color="red" />
                                        <HealthDataCard icon={<Activity className="w-6 h-6" />} label="Blood Pressure" value={healthData.bloodPressure ? `${healthData.bloodPressure.systolic}/${healthData.bloodPressure.diastolic}` : null} unit="mmHg" color="blue" />
                                        <HealthDataCard icon={<Thermometer className="w-6 h-6" />} label="Temperature" value={healthData.temperature} unit="°C" color="orange" />
                                        <HealthDataCard icon={<Droplet className="w-6 h-6" />} label="SpO2" value={healthData.oxygenSaturation} unit="%" color="purple" />
                                        <HealthDataCard icon={<Scale className="w-6 h-6" />} label="Weight" value={healthData.weight} unit="kg" color="green" />
                                        <HealthDataCard icon={<Droplet className="w-6 h-6" />} label="Glucose" value={healthData.glucose} unit="mg/dL" color="yellow" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Version Info - Tap 7 times to unlock developer mode */}
                        <div className="text-center py-4">
                            <button
                                onClick={handleVersionTap}
                                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                MedBeacon Bluetooth v2.0.0
                                {developerMode && <span className="ml-2 text-purple-600 font-semibold">• Developer Mode</span>}
                            </button>
                        </div>

                    </div>
                </div >
            </div >
        </DashboardLayout >
    );
}

// Helper Components
function TestResultRow({ label, status, getStatusIcon, getStatusText }) {
    return (
        <div className="p-4 flex items-center justify-between bg-white/50">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <span className="text-sm text-gray-600">{getStatusText(status)}</span>
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
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isConnected
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                >
                    {isConnected ? <Unlink size={16} /> : <Link size={16} />}
                    <span className="hidden sm:inline">{isConnected ? 'Disconnect' : 'Connect'}</span>
                </button>
                <button
                    onClick={onUnpair}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">Unpair</span>
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
        <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
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
