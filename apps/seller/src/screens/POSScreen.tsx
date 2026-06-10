import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { BiometricSensor } from '../biometric/sensor';

/**
 * POSScreen handles the seller's checkout process.
 */
export default function POSScreen() {
  const [amount, setAmount] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [status, setStatus] = useState('');

  const [showConfirm, setShowConfirm] = useState(false);
  const [buyerName, setBuyerName] = useState('');

  const handlePayment = async () => {
    setIsWaiting(true);
    setStatus('Ready for Buyer Fingerprint...');
    
    // 1. Capture biometric from the sensor on the seller's phone
    const signature = await BiometricSensor.captureFingerprint(`Confirm payment of ₦${amount}`);
    
    if (signature) {
      setStatus('Identifying Buyer...');
      
      // 2. Mock Backend Match call
      // In reality: const { buyerName } = await api.post('/pay', { capturedTemplate: signature, ... })
      setTimeout(() => {
        setBuyerName('John Doe'); // Mocked result from backend
        setShowConfirm(true);
        setIsWaiting(false);
        setStatus('');
      }, 1500);
    } else {
      setIsWaiting(false);
      setStatus('Biometric verification cancelled or failed.');
    }
  };

  const confirmTransfer = async () => {
    setIsWaiting(true);
    setStatus('Processing Bank Transfer via Anchor...');
    
    setTimeout(() => {
      setIsWaiting(false);
      setShowConfirm(false);
      setStatus('Payment Successful! ₦' + amount + ' received.');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>BPN Seller POS</Text>
      
      {!isWaiting && !status.includes('Successful') && !showConfirm && (
        <View>
          <Text style={styles.label}>Enter Sale Amount (₦)</Text>
          <TextInput 
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="numeric"
          />
          <Button title="Process Biometric Payment" onPress={handlePayment} />
        </View>
      )}

      {showConfirm && (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>Confirm Payment</Text>
          <Text style={styles.confirmText}>Pay ₦{amount} from {buyerName}?</Text>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
            <Button title="Cancel" onPress={() => setShowConfirm(false)} color="red" />
            <Button title="Confirm & Transfer" onPress={confirmTransfer} color="#2E7D32" />
          </View>
        </View>
      )}

      {isWaiting && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.statusText}>{status}</Text>
          <Text style={{color: 'gray'}}>Buyer: Please tap the sensor on this phone</Text>
        </View>
      )}

      {status.includes('Successful') && (
        <View style={styles.center}>
          <Text style={{fontSize: 40}}>✅</Text>
          <Text style={styles.successText}>{status}</Text>
          <Button title="New Transaction" onPress={() => { setAmount(''); setStatus(''); }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, color: '#1A237E' },
  label: { fontSize: 16, marginBottom: 10 },
  amountInput: { fontSize: 32, borderBottomWidth: 2, borderColor: '#1A237E', marginBottom: 40, padding: 10 },
  center: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  statusText: { fontSize: 18, marginTop: 20, fontWeight: '500' },
  successText: { fontSize: 20, color: '#2E7D32', fontWeight: 'bold', marginVertical: 20 }
});
