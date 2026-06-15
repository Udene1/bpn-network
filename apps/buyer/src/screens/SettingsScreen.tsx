import React, { useState } from 'react';
import { View, Text, Switch, TextInput, Button, StyleSheet, Alert } from 'react-native';

export default function SettingsScreen() {
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [dailyLimit, setDailyLimit] = useState('10000');
  const [pin, setPin] = useState('');
  const [paymentMode, setPaymentMode] = useState<'STANDARD' | 'STRICT'>('STANDARD');
  const [recoveryPhone, setRecoveryPhone] = useState('+2348000000001');

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

      <View style={styles.settingRow}>
        <View>
          <Text style={styles.settingLabel}>Strict Biometric Mode</Text>
          <Text style={styles.settingDesc}>Require match for ALL transactions</Text>
        </View>
        <Switch
          value={paymentMode === 'STRICT'}
          onValueChange={(val) => setPaymentMode(val ? 'STRICT' : 'STANDARD')}
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
        <Text style={styles.settingLabel}>Recovery Phone Number</Text>
        <TextInput
          style={styles.input}
          value={recoveryPhone}
          onChangeText={setRecoveryPhone}
        />
      </View>

      <Text style={[styles.header, { fontSize: 18, marginTop: 20 }]}>Recovery & Safety</Text>
      
      <View style={styles.inputGroup}>
         <Button 
          title="Injury: Re-Enroll Fingerprint" 
          onPress={() => Alert.alert("Injury Flow", `This will trigger an OTP to ${recoveryPhone}. Proceed?`)} 
          color="#D32F2F" 
         />
         <Text style={styles.settingDesc}>Use this if you cannot use your registered finger.</Text>
      </View>

      <View style={styles.inputGroup}>
         <Button 
          title="View Transaction History" 
          onPress={() => Alert.alert("History", "Opening secure history log...")} 
          color="#666" 
         />
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title="Save All Settings" onPress={handleSave} color="#1A237E" />
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
