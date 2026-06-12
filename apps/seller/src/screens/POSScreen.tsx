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
  const [receipt, setReceipt] = useState<any>(null);

  const BACKEND_URL = 'http://localhost:3000'; // Change to actual network IP when testing on real device
  
  const handlePayment = async () => {
    try {
      setIsWaiting(true);
      setReceipt(null);
      setStatus('Initializing Secure Session...');

      // 1. Get session token from backend
      const invoiceRes = await fetch(`${BACKEND_URL}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: 'S-777', amount: parseFloat(amount) })
      });
      
      if (!invoiceRes.ok) {
        const errorData = await invoiceRes.json();
        throw new Error(errorData.error || 'Connection failed');
      }

      const invoiceData = await invoiceRes.json();
      setStatus(`Session [${invoiceData.token}] - Ready for Print`);
      
      // 2. Capture biometric from the sensor on the seller's phone
      const signature = await BiometricSensor.captureFingerprint(
        `Confirm payment of ₦${amount} (Token: ${invoiceData.token})`, 
        invoiceData.token
      );
      
      if (signature) {
        setStatus('Verifying Identity & Requesting Bank Transfer...');
        
        // 3. Backend Match and Pay call
        const payRes = await fetch(`${BACKEND_URL}/match-and-pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken: invoiceData.token, capturedTemplate: signature })
        });
        
        const payData = await payRes.json();

        if (payRes.ok && payData.status !== 'FAILED') {
          setReceipt({
            buyer: payData.buyerName,
            bank: payData.buyerBank,
            ref: payData.reference,
            amount: amount,
            date: new Date().toLocaleString()
          });
          setIsWaiting(false);
          setStatus('');
        } else if (payRes.status === 404) {
          throw new Error('Session Expired. Please try again.');
        } else {
          throw new Error(payData.error || 'Payment failed');
        }
      } else {
        setIsWaiting(false);
        setStatus('Biometric cancelled.');
      }
    } catch (e: any) {
      setIsWaiting(false);
      setStatus(`Error: ${e.message}`);
      Alert.alert('POS Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>BPN Seller POS</Text>
      
      {!isWaiting && !receipt && (
        <View>
          <Text style={styles.label}>Sale Amount (₦)</Text>
          <TextInput 
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="numeric"
            autoFocus
          />
          <Button title="Collect Biometric Payment" onPress={handlePayment} color="#1A237E" />
          {status !== '' && <Text style={styles.errorText}>{status}</Text>}
        </View>
      )}

      {isWaiting && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1A237E" />
          <Text style={styles.statusText}>{status}</Text>
          <Text style={styles.subStatus}>Please ask buyer to tap the sensor</Text>
        </View>
      )}

      {receipt && (
        <View style={styles.receiptBox}>
          <Text style={styles.receiptHeader}>PAYMENT SUCCESSFUL</Text>
          <View style={styles.divider} />
          <Text style={styles.receiptRow}>Amount: <Text style={styles.bold}>₦{receipt.amount}</Text></Text>
          <Text style={styles.receiptRow}>Buyer: {receipt.buyer}</Text>
          <Text style={styles.receiptRow}>Bank: {receipt.bank}</Text>
          <Text style={styles.receiptRow}>Ref: {receipt.ref}</Text>
          <Text style={styles.receiptRow}>Time: {receipt.date}</Text>
          <View style={styles.divider} />
          <Button title="Dismiss Receipt" onPress={() => { setAmount(''); setReceipt(null); }} color="#2E7D32" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FAF9F6' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 40, color: '#1A237E', textAlign: 'center' },
  label: { fontSize: 14, color: '#666', marginBottom: 5 },
  amountInput: { fontSize: 48, fontWeight: 'bold', borderBottomWidth: 2, borderColor: '#1A237E', marginBottom: 40, padding: 10, textAlign: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  statusText: { fontSize: 18, marginTop: 20, fontWeight: '600', color: '#1A237E', textAlign: 'center' },
  subStatus: { fontSize: 14, color: '#666', marginTop: 10 },
  errorText: { color: 'red', marginTop: 20, textAlign: 'center' },
  receiptBox: { backgroundColor: '#fff', padding: 20, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  receiptHeader: { fontSize: 20, fontWeight: 'bold', color: '#2E7D32', textAlign: 'center', marginBottom: 10 },
  receiptRow: { fontSize: 16, marginVertical: 5, color: '#333' },
  bold: { fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 }
});
