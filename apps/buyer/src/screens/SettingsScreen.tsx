import React, { useState } from 'react';
import { View, Text, Switch, TextInput, Button, StyleSheet, Alert } from 'react-native';

export default function SettingsScreen() {
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [dailyLimit, setDailyLimit] = useState('10000');
  const [pin, setPin] = useState('');

  const handleSave = () => {
    // Mock save operation
    Alert.alert("Settings Saved", `Auto-pay: ${autoPayEnabled ? 'ON' : 'OFF'}\nDaily Limit: ₦${dailyLimit}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Payment Settings</Text>

      <View style={styles.settingRow}>
        <View>
          <Text style={styles.settingLabel}>Auto-Pay Under ₦1,000</Text>
          <Text style={styles.settingDesc}>Skip biometric check for small amounts</Text>
        </View>
        <Switch
          value={autoPayEnabled}
          onValueChange={setAutoPayEnabled}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={autoPayEnabled ? '#2E7D32' : '#f4f3f4'}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.settingLabel}>Daily Spending Limit (₦)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={dailyLimit}
          onChangeText={setDailyLimit}
          placeholder="e.g. 10000"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.settingLabel}>Backup PIN Code (4 digits)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          secureTextEntry
          maxLength={4}
          value={pin}
          onChangeText={setPin}
          placeholder="****"
        />
      </View>

      <View style={{ marginTop: 30 }}>
        <Button title="Save Settings" onPress={handleSave} color="#1A237E" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#1A237E' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  settingLabel: { fontSize: 16, fontWeight: '600' },
  settingDesc: { fontSize: 13, color: 'gray', marginTop: 4 },
  inputGroup: { marginBottom: 20 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 10, fontSize: 18, marginTop: 10 }
});
