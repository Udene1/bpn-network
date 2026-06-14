import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';

export default function InjuryFlow() {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleRequestOtp = () => {
    Alert.alert("OTP Sent", "A recovery code has been sent to your phone.");
    setStep(2);
  };

  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    // Mock verification
    setTimeout(() => {
      setIsVerifying(false);
      setStep(3);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Injury Recovery</Text>
      
      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.title}>Emergency Re-Enrollment</Text>
          <Text style={styles.desc}>
            If you've lost access to your primary fingerprint, we can verify your identity via SMS OTP.
          </Text>
          <Button title="Send SMS Code" onPress={handleRequestOtp} color="#1A237E" />
        </View>
      )}

      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.title}>Enter SMS Code</Text>
          <TextInput 
            style={styles.input}
            value={otp}
            onChangeText={setOtp}
            placeholder="6-digit code"
            keyboardType="numeric"
          />
          {isVerifying ? (
            <ActivityIndicator color="#1A237E" />
          ) : (
            <Button title="Verify and Reset" onPress={handleVerifyOtp} color="#2E7D32" />
          )}
        </View>
      )}

      {step === 3 && (
        <View style={styles.card}>
          <Text style={styles.title}>Access Reset</Text>
          <Text style={styles.desc}>
            Identity verified. You can now re-enroll a new finger or use your backup PIN at any POS.
          </Text>
          <Button title="Start Enrollment" onPress={() => {}} color="#1A237E" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FAF9F6' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#1A237E' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  desc: { fontSize: 14, color: '#666', marginBottom: 25, lineHeight: 20 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', padding: 10, fontSize: 20, marginBottom: 25, textAlign: 'center' }
});
