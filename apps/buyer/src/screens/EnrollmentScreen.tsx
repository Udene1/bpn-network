import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Switch, ActivityIndicator } from 'react-native';
import { BiometricSensor } from '../api/biometric.sensor';

/**
 * EnrollmentScreen handles the buyer's one-time enrollment process.
 */
const NIGERIAN_BANKS = [
  { label: 'Access Bank', value: '044' },
  { label: 'First Bank', value: '011' },
  { label: 'GTBank', value: '058' },
  { label: 'UBA', value: '033' },
  { label: 'Zenith Bank', value: '057' },
];

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
    if (step === 2 && (bankCode === '' || accountNumber.length !== 10)) {
      Alert.alert('Validation Error', 'Please select a bank and enter a 10-digit account number.');
      return;
    }
    setStep(step + 1);
  };

  const handleEnroll = async () => {
    if (!consent) {
      Alert.alert("Consent Required", "You must provide NDPR consent to enroll biometrics.");
      return;
    }

    const signature = await BiometricSensor.captureFingerprint('Enroll your fingerprint to secure BPN');
    
    if (!signature) {
      Alert.alert("Enrollment Failed", "Biometric capture is required.");
      return;
    }

    setIsEnrolling(true);

    try {
      const payload = {
        bvn,
        fullName: fullName || 'New User',
        phoneNumber: '080' + Math.floor(Math.random() * 100000000), // Mock phone
        template: signature,
        bankAccounts: [{ bankCode, accountNumber, accountName: fullName || 'New User' }]
      };

      const res = await fetch('http://localhost:3000/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setIsEnrolling(false);

      if (res.ok && data.status === 'SUCCESS') {
        Alert.alert("Enrollment Complete", "Your biometric identity is now securely linked to your bank account.", [
          { text: "Go to Settings", onPress: () => setStep(1) } // Mock redirect
        ]);
      } else {
        throw new Error(data.error || "Enrollment failed");
      }
    } catch (e: any) {
      setIsEnrolling(false);
      Alert.alert("Technical Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>BPN Enrollment</Text>

      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>1. Identity Verification</Text>
          <Text style={styles.label}>Bank Verification Number (BVN)</Text>
          <TextInput 
            placeholder="00000000000" 
            style={styles.input} 
            value={bvn}
            onChangeText={setBvn}
            keyboardType="numeric"
            maxLength={11}
          />
          <Text style={styles.helper}>We use this to verify your legal identity with NIBSS.</Text>
          <Button title="Verify Identity" onPress={nextStep} color="#1A237E" />
        </View>
      )}

      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>2. Link Bank Account</Text>
          <Text style={styles.label}>Select your Bank</Text>
          <View style={styles.bankPicker}>
             {NIGERIAN_BANKS.map(bank => (
               <Button 
                key={bank.value} 
                title={bank.label} 
                onPress={() => setBankCode(bank.value)} 
                color={bankCode === bank.value ? '#1A237E' : '#ccc'} 
               />
             ))}
          </View>
          
          <Text style={styles.label}>Account Number</Text>
          <TextInput 
            placeholder="0011223344" 
            style={styles.input}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
            maxLength={10}
          />
          <Button title="Continue to Biometrics" onPress={nextStep} color="#1A237E" />
        </View>
      )}

      {step === 3 && (
        <View style={styles.biometricContainer}>
          <Text style={styles.stepTitle}>3. Secure Biometric Link</Text>
          <View style={styles.fingerprintIcon}>
             <Text style={{fontSize: 60}}>🧬</Text>
          </View>
          <Text style={styles.instruction}>
            Place your thumb on the sensor to create your unique payment signature.
          </Text>

          <View style={styles.consentRow}>
            <Switch value={consent} onValueChange={setConsent} trackColor={{true: '#1A237E'}} />
            <Text style={styles.consentText}>
              I authorize BPN to store an encrypted hash of my biometric for payment authorization (NDPR Compliant).
            </Text>
          </View>

          {isEnrolling ? (
            <ActivityIndicator size="large" color="#1A237E" />
          ) : (
            <Button title="Create Secure Identity" onPress={handleEnroll} color="#2E7D32" />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FAF9F6', justifyContent: 'center' },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, color: '#1A237E', textAlign: 'center' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  stepTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20, color: '#333' },
  label: { fontSize: 13, color: '#666', marginBottom: 8, marginTop: 10 },
  input: { borderBottomWidth: 1, borderColor: '#eee', marginBottom: 15, padding: 12, fontSize: 18, fontWeight: '600' },
  helper: { fontSize: 12, color: '#999', marginBottom: 20 },
  bankPicker: { marginBottom: 20 },
  biometricContainer: { alignItems: 'center', backgroundColor: '#fff', padding: 30, borderRadius: 12 },
  fingerprintIcon: { width: 120, height: 120, backgroundColor: '#f5f5f5', borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  instruction: { textAlign: 'center', marginBottom: 30, color: '#555', lineHeight: 20 },
  consentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, paddingHorizontal: 5 },
  consentText: { marginLeft: 12, flex: 1, fontSize: 12, color: '#777' }
});
