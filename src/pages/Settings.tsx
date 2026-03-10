import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Shield, Database, Wifi, Moon, Sun, Save, Loader2, MessageSquare, Phone, Send } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationSettings {
  browser_push: boolean;
  email_alerts: boolean;
  sms_alerts: boolean;
  viber_alerts: boolean;
  telegram_alerts: boolean;
  sound_alerts: boolean;
  phone_number: string;
  viber_number: string;
  telegram_username: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  browser_push: true,
  email_alerts: true,
  sms_alerts: false,
  viber_alerts: false,
  telegram_alerts: false,
  sound_alerts: false,
  phone_number: '',
  viber_number: '',
  telegram_username: '',
};

const Settings = () => {
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data, error } = await (supabase as any)
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setNotifications({
          browser_push: data.browser_push,
          email_alerts: data.email_alerts,
          sms_alerts: data.sms_alerts,
          viber_alerts: data.viber_alerts,
          telegram_alerts: data.telegram_alerts,
          sound_alerts: data.sound_alerts,
          phone_number: data.phone_number || '',
          viber_number: data.viber_number || '',
          telegram_username: data.telegram_username || '',
        });
      }
    } catch (err) {
      console.error('Failed to load notification settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Трябва да сте влезли в системата'); return; }

      const { error } = await (supabase as any)
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          ...notifications,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Настройките са запазени');
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Грешка при запазване');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean | string) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const NOTIFICATION_CHANNELS = [
    { key: 'browser_push' as const, label: 'Browser Push', desc: 'Получавайте известия в браузъра', icon: Bell },
    { key: 'email_alerts' as const, label: 'Email', desc: 'Критични известия по имейл', icon: Send },
    { key: 'sms_alerts' as const, label: 'SMS', desc: 'Известия чрез SMS съобщения', icon: Phone },
    { key: 'viber_alerts' as const, label: 'Viber', desc: 'Известия чрез Viber', icon: MessageSquare },
    { key: 'telegram_alerts' as const, label: 'Telegram', desc: 'Известия чрез Telegram бот', icon: Send },
    { key: 'sound_alerts' as const, label: 'Звукови известия', desc: 'Звуков сигнал при нови известия', icon: Bell },
  ];

  return (
    <DashboardLayout 
      title="Settings" 
      subtitle="Configure your IoT dashboard"
    >
      <div className="max-w-4xl space-y-8">
        {/* MQTT Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card rounded-xl shadow-card border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wifi className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">MQTT / Flespi Configuration</h3>
              <p className="text-sm text-muted-foreground">Connect to your IoT data broker</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="broker">Broker URL</Label>
              <Input id="broker" placeholder="wss://mqtt.flespi.io" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="token">API Token</Label>
                <Input id="token" type="password" placeholder="FlespiToken ..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="channel">Channel ID</Label>
                <Input id="channel" placeholder="123456" />
              </div>
            </div>
            <Button className="w-fit">Test Connection</Button>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card rounded-xl shadow-card border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Bell className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Канали за известия</h3>
                <p className="text-sm text-muted-foreground">Изберете как да получавате известия</p>
              </div>
            </div>
            {hasChanges && (
              <Button onClick={saveSettings} disabled={isSaving} size="sm" className="gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Запази
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {NOTIFICATION_CHANNELS.map((channel, idx) => (
              <div key={channel.key}>
                {idx > 0 && <Separator className="mb-4" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <channel.icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label>{channel.label}</Label>
                      <p className="text-sm text-muted-foreground">{channel.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications[channel.key] as boolean}
                    onCheckedChange={(checked) => updateSetting(channel.key, checked)}
                    disabled={isLoading}
                  />
                </div>
                {channel.key === 'sms_alerts' && notifications.sms_alerts && (
                  <div className="mt-3 ml-7">
                    <Label htmlFor="phone_number">Телефонен номер (SMS)</Label>
                    <Input
                      id="phone_number"
                      placeholder="+359 888 123 456"
                      value={notifications.phone_number}
                      onChange={(e) => updateSetting('phone_number', e.target.value)}
                      className="mt-1 max-w-xs"
                    />
                  </div>
                )}
                {channel.key === 'viber_alerts' && notifications.viber_alerts && (
                  <div className="mt-3 ml-7">
                    <Label htmlFor="viber_number">Viber номер</Label>
                    <Input
                      id="viber_number"
                      placeholder="+359 888 123 456"
                      value={notifications.viber_number}
                      onChange={(e) => updateSetting('viber_number', e.target.value)}
                      className="mt-1 max-w-xs"
                    />
                  </div>
                )}
                {channel.key === 'telegram_alerts' && notifications.telegram_alerts && (
                  <div className="mt-3 ml-7">
                    <Label htmlFor="telegram_username">Telegram потребител</Label>
                    <Input
                      id="telegram_username"
                      placeholder="@username"
                      value={notifications.telegram_username}
                      onChange={(e) => updateSetting('telegram_username', e.target.value)}
                      className="mt-1 max-w-xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card rounded-xl shadow-card border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-status-ok/10">
              <Shield className="w-5 h-5 text-status-ok" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Security</h3>
              <p className="text-sm text-muted-foreground">Manage security settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card rounded-xl shadow-card border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-muted">
              <Database className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Data Management</h3>
              <p className="text-sm text-muted-foreground">Manage stored data and logs</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline">Export All Data</Button>
            <Button variant="outline">Clear Cache</Button>
            <Button variant="destructive">Reset Settings</Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
