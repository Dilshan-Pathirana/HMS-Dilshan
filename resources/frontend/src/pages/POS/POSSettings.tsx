import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Settings, Bell, Eye, Moon, Sun, Volume2, VolumeX,
    CheckCircle, AlertCircle, Save, RefreshCw
} from 'lucide-react';

interface SettingsData {
    notifications: {
        email_notifications: boolean;
        push_notifications: boolean;
        sms_notifications: boolean;
        transaction_alerts: boolean;
        low_stock_alerts: boolean;
        eod_reminders: boolean;
    };
    display: {
        theme: 'light' | 'dark' | 'auto';
        compact_mode: boolean;
        show_animations: boolean;
    };
    sound: {
        transaction_sound: boolean;
        alert_sound: boolean;
        volume: number;
    };
}

const POSSettings: React.FC = () => {
    const [settings, setSettings] = useState<SettingsData>({
        notifications: {
            email_notifications: true,
            push_notifications: true,
            sms_notifications: false,
            transaction_alerts: true,
            low_stock_alerts: true,
            eod_reminders: true,
        },
        display: {
            theme: 'light',
            compact_mode: false,
            show_animations: true,
        },
        sound: {
            transaction_sound: true,
            alert_sound: true,
            volume: 50,
        },
    });
    
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = () => {
        // Load from localStorage for now
        const savedSettings = localStorage.getItem('pos_settings');
        if (savedSettings) {
            try {
                setSettings(JSON.parse(savedSettings));
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }
        setLoading(false);
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            // Save to localStorage for now
            localStorage.setItem('pos_settings', JSON.stringify(settings));
            
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleResetSettings = () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            const defaultSettings: SettingsData = {
                notifications: {
                    email_notifications: true,
                    push_notifications: true,
                    sms_notifications: false,
                    transaction_alerts: true,
                    low_stock_alerts: true,
                    eod_reminders: true,
                },
                display: {
                    theme: 'light',
                    compact_mode: false,
                    show_animations: true,
                },
                sound: {
                    transaction_sound: true,
                    alert_sound: true,
                    volume: 50,
                },
            };
            setSettings(defaultSettings);
            localStorage.setItem('pos_settings', JSON.stringify(defaultSettings));
            setMessage({ type: 'success', text: 'Settings reset to default!' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const updateNotification = (key: keyof SettingsData['notifications'], value: boolean) => {
        setSettings({
            ...settings,
            notifications: { ...settings.notifications, [key]: value }
        });
    };

    const updateDisplay = (key: keyof SettingsData['display'], value: any) => {
        setSettings({
            ...settings,
            display: { ...settings.display, [key]: value }
        });
    };

    const updateSound = (key: keyof SettingsData['sound'], value: any) => {
        setSettings({
            ...settings,
            sound: { ...settings.sound, [key]: value }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Settings className="w-8 h-8 text-emerald-600" />
                        Settings
                    </h1>
                    <p className="text-gray-600 mt-1">Customize your POS experience</p>
                </div>
                <button
                    onClick={handleResetSettings}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Reset to Default
                </button>
            </div>

            {/* Success/Error Message */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Notification Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Bell className="w-6 h-6 text-emerald-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                            <p className="text-sm text-gray-600">Manage how you receive alerts and updates</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <ToggleSetting
                        label="Email Notifications"
                        description="Receive updates via email"
                        checked={settings.notifications.email_notifications}
                        onChange={(val) => updateNotification('email_notifications', val)}
                    />
                    <ToggleSetting
                        label="Push Notifications"
                        description="Get real-time push notifications"
                        checked={settings.notifications.push_notifications}
                        onChange={(val) => updateNotification('push_notifications', val)}
                    />
                    <ToggleSetting
                        label="SMS Notifications"
                        description="Receive critical alerts via SMS"
                        checked={settings.notifications.sms_notifications}
                        onChange={(val) => updateNotification('sms_notifications', val)}
                    />
                    <ToggleSetting
                        label="Transaction Alerts"
                        description="Notify on successful transactions"
                        checked={settings.notifications.transaction_alerts}
                        onChange={(val) => updateNotification('transaction_alerts', val)}
                    />
                    <ToggleSetting
                        label="Low Stock Alerts"
                        description="Alert when inventory is low"
                        checked={settings.notifications.low_stock_alerts}
                        onChange={(val) => updateNotification('low_stock_alerts', val)}
                    />
                    <ToggleSetting
                        label="End of Day Reminders"
                        description="Remind to complete EOD process"
                        checked={settings.notifications.eod_reminders}
                        onChange={(val) => updateNotification('eod_reminders', val)}
                    />
                </div>
            </div>

            {/* Display Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Eye className="w-6 h-6 text-blue-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Display</h2>
                            <p className="text-sm text-gray-600">Customize the appearance of your POS</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Theme</label>
                        <div className="flex gap-3">
                            <ThemeButton
                                icon={<Sun className="w-5 h-5" />}
                                label="Light"
                                active={settings.display.theme === 'light'}
                                onClick={() => updateDisplay('theme', 'light')}
                            />
                            <ThemeButton
                                icon={<Moon className="w-5 h-5" />}
                                label="Dark"
                                active={settings.display.theme === 'dark'}
                                onClick={() => updateDisplay('theme', 'dark')}
                            />
                            <ThemeButton
                                icon={<Settings className="w-5 h-5" />}
                                label="Auto"
                                active={settings.display.theme === 'auto'}
                                onClick={() => updateDisplay('theme', 'auto')}
                            />
                        </div>
                    </div>
                    <ToggleSetting
                        label="Compact Mode"
                        description="Reduce spacing for more content"
                        checked={settings.display.compact_mode}
                        onChange={(val) => updateDisplay('compact_mode', val)}
                    />
                    <ToggleSetting
                        label="Show Animations"
                        description="Enable smooth transitions and effects"
                        checked={settings.display.show_animations}
                        onChange={(val) => updateDisplay('show_animations', val)}
                    />
                </div>
            </div>

            {/* Sound Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Volume2 className="w-6 h-6 text-purple-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Sound</h2>
                            <p className="text-sm text-gray-600">Configure audio feedback</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <ToggleSetting
                        label="Transaction Sound"
                        description="Play sound on successful transactions"
                        checked={settings.sound.transaction_sound}
                        onChange={(val) => updateSound('transaction_sound', val)}
                    />
                    <ToggleSetting
                        label="Alert Sound"
                        description="Play sound for important alerts"
                        checked={settings.sound.alert_sound}
                        onChange={(val) => updateSound('alert_sound', val)}
                    />
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Volume: {settings.sound.volume}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={settings.sound.volume}
                            onChange={(e) => updateSound('volume', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Settings
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// Toggle Setting Component
interface ToggleSettingProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}

const ToggleSetting: React.FC<ToggleSettingProps> = ({ label, description, checked, onChange }) => {
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex-1">
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-600">{description}</div>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    checked ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        checked ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </button>
        </div>
    );
};

// Theme Button Component
interface ThemeButtonProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const ThemeButton: React.FC<ThemeButtonProps> = ({ icon, label, active, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                active
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );
};

export default POSSettings;
