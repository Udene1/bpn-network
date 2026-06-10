import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { BiometricSensor } from '../api/biometric.sensor';

/**
 * EnrollmentScreen handles the buyer's one-time enrollment process.
 */
export default function EnrollmentScreen() {
  const [step, setStep] = useState(1);
  const [bvn, setBvn] = useState('');
  const [fullName, setFullName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const nextStep = () => setStep(step + 1);

  const handleEnroll = async () => {
    // 1. Capture fingerprint signature during enrollment
    const signature = await BiometricSensor.captureFingerprint('Enroll your fingerprint to secure BPN');
    
    if (!signature) {
      Alert.alert("Enrollment Failed", "Biometric capture is required.");
      return;
    }

    // 2. Mock API call to /enroll with full user data
    const payload = {
      bvn,
      fullName,
      template: signature,
      bankAccounts: [{ bankCode, accountNumber, accountName: fullName }]
    };

    console.log('Sending enrollment payload:', payload);
    Alert.alert("Success", "Account Linked Successfully with Biometrics");
  };

  return (
    <View style={styles.container}>
      {step === 1 && (
        <View>
          <Text style={styles.title}>Step 1: Verify Identity</Text>
          <TextInput 
            placeholder="Enter 11-digit BVN" 
            style={styles.input} 
            value={bvn}
            onChangeText={setBvn}
            keyboardType="numeric"
          />
          <Button title="Verify BVN" onPress={nextStep} />
        </View>
      )}

      {step === 2 && (
        <View>
          <Text style={styles.title}>Step 2: Link Bank Account</Text>
          <TextInput 
            placeholder="Select Bank (Code)" 
            style={styles.input}
            value={bankCode}
            onChangeText={setBankCode}
          />
          <TextInput 
            placeholder="Account Number" 
            style={styles.input}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
          />
          <Button title="Continue" onPress={nextStep} />
        </View>
      )}

      {step === 3 && (
        <View style={styles.biometricContainer}>
          <Text style={styles.title}>Step 3: Capture Biometrics</Text>
          <View style={styles.fingerprintIcon}>
            <Text style={{fontSize: 50}}>👆</Text>
          </View>
          <Text style={{textAlign: 'center', marginBottom: 20}}>
            Please place your finger on the sensor on this device to link your biometric identity.
          </Text>
          <Button title="Complete Enrollment" onPress={handleEnroll} color="#2E7D32" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { borderBottomWidth: 1, marginBottom: 20, padding: 10 },
  biometricContainer: { alignItems: 'center' },
  fingerprintIcon: { width: 100, height: 100, backgroundColor: '#f0f0f0', borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }
});
