import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Switch, ActivityIndicator } from 'react-native';
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
  const [consent, setConsent] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const nextStep = () => {
    if (step === 1 && bvn.length !== 11) {
      Alert.alert('Validation Error', 'BVN must be exactly 11 digits.');
      return;
    }
    setStep(step + 1);
  };

  const handleEnroll = async () => {
    if (!consent) {
      Alert.alert("Consent Required", "You must provide NDPR consent to enroll biometrics.");
      return;
    }

    // 1. Capture fingerprint signature during enrollment
    const signature = await BiometricSensor.captureFingerprint('Enroll your fingerprint to secure BPN');
    
    if (!signature) {
      Alert.alert("Enrollment Failed", "Biometric capture is required.");
      return;
    }

    setIsEnrolling(true);

    try {
      // 2. API call to /enroll with full user data
      const payload = {
        bvn,
        fullName: 'Buyer User', // Hardcoded mock since no input is provided
        phoneNumber: '08012345678', // Hardcoded mock
        template: signature,
        bankAccounts: [{ bankCode, accountNumber, accountName: 'Buyer User' }]
      };

      const res = await fetch('http://localhost:3000/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setIsEnrolling(false);

      if (res.ok && data.status === 'SUCCESS') {
        Alert.alert("Success", "Account Linked Successfully with Biometrics");
        // E.g., navigation.navigate('Settings');
      } else {
        Alert.alert("Error", data.error || "Failed to enroll");
      }
    } catch (e: any) {
      setIsEnrolling(false);
      Alert.alert("Error", e.message);
    }
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

          <View style={styles.consentRow}>
            <Switch value={consent} onValueChange={setConsent} />
            <Text style={styles.consentText}>
              I consent to the capture and encrypted storage of my biometric template under the NDPR.
            </Text>
          </View>

          {isEnrolling ? (
            <ActivityIndicator size="large" color="#2E7D32" />
          ) : (
            <Button title="Complete Enrollment" onPress={handleEnroll} color="#2E7D32" />
          )}
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
  fingerprintIcon: { width: 100, height: 100, backgroundColor: '#f0f0f0', borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  consentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, paddingHorizontal: 10 },
  consentText: { marginLeft: 10, flex: 1, fontSize: 13, color: '#444' }
});
