import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
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
  const [timer, setTimer] = useState<number>(0);
  const [currentToken, setCurrentToken] = useState<string>('');

  const BACKEND_URL = 'http://localhost:3000'; 

  // Session Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isWaiting && currentToken) {
      setIsWaiting(false);
      setStatus('Session Expired');
      Alert.alert('Session Timeout', 'The payment session has expired. Please create a new invoice.');
    }
    return () => clearInterval(interval);
  }, [timer, isWaiting, currentToken]);
  
  const handlePayment = async () => {
    try {
      setIsWaiting(true);
      setReceipt(null);
      setStatus('Initializing Secure Session...');
      setTimer(120); // Start 120s countdown

      const invoiceRes = await fetch(`${BACKEND_URL}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: 'S-777', amount: parseFloat(amount) })
      });
      
      if (!invoiceRes.ok) {
        setTimer(0);
        const errorData = await invoiceRes.json();
        throw new Error(errorData.error || 'Connection failed');
      }

      const invoiceData = await invoiceRes.json();
      setCurrentToken(invoiceData.token);
      triggerBiometric(invoiceData.token);
      
    } catch (e: any) {
      setIsWaiting(false);
      setTimer(0);
      setStatus(`Error: ${e.message}`);
      Alert.alert('POS Error', e.message);
    }
  };

  const triggerBiometric = async (token: string) => {
    try {
      setStatus(`Session [${token}] - Waiting for Biometric...`);
      
      const signature = await BiometricSensor.captureFingerprint(
        `Confirm payment of ₦${amount} (Token: ${token})`, 
        token
      );
      
      if (signature) {
        setStatus('Verifying Identity & Requesting Bank Transfer...');
        
        const payRes = await fetch(`${BACKEND_URL}/match-and-pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken: token, capturedTemplate: signature })
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
          setTimer(0);
          setStatus('');
        } else {
          throw new Error(payData.error || 'Payment rejected by bank');
        }
      } else {
        setStatus('Authentication Cancelled. You can retry below.');
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const retryScan = () => {
    if (currentToken && timer > 0) {
      triggerBiometric(currentToken);
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
          <View style={styles.timerCircle}>
             <Text style={styles.timerText}>{timer}s</Text>
          </View>
          <ActivityIndicator size="large" color="#1A237E" />
          <Text style={styles.statusText}>{status}</Text>
          <Text style={styles.subStatus}>Ask buyer to tap the sensor on this device</Text>
          
          {!status.includes('Verifying') && timer > 0 && (
            <View style={{marginTop: 30}}>
              <Button title="Retry Biometric Scan" onPress={retryScan} color="#1A237E" />
            </View>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsWaiting(false); setTimer(0); }}>
            <Text style={{color: 'red'}}>Cancel Transaction</Text>
          </TouchableOpacity>
        </View>
      )}

      {receipt && (
        <View style={styles.receiptBox}>
          <Text style={styles.receiptHeader}>PAYMENT SUCCESSFUL</Text>
          <View style={styles.divider} />
          <Text style={styles.receiptRow}>Amount: <Text style={styles.bold}>₦{receipt.amount}</Text></Text>
          <Text style={styles.receiptRow}>Buyer: <Text style={styles.bold}>{receipt.buyer}</Text></Text>
          <Text style={styles.receiptRow}>Bank: {receipt.bank}</Text>
          <Text style={styles.receiptRow}>Ref: {receipt.ref}</Text>
          <Text style={styles.divider} />
          <Button title="New Transaction" onPress={() => { setAmount(''); setReceipt(null); setStatus(''); }} color="#2E7D32" />
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
  center: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  timerCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#1A237E', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  timerText: { fontSize: 18, color: '#1A237E', fontWeight: 'bold' },
  statusText: { fontSize: 16, marginTop: 20, color: '#1A237E', textAlign: 'center', paddingHorizontal: 20 },
  subStatus: { fontSize: 13, color: '#666', marginTop: 10 },
  errorText: { color: 'red', marginTop: 20, textAlign: 'center' },
  cancelBtn: { marginTop: 40 },
  receiptBox: { backgroundColor: '#fff', padding: 25, borderRadius: 15, elevation: 5 },
  receiptHeader: { fontSize: 20, fontWeight: 'bold', color: '#2E7D32', textAlign: 'center', marginBottom: 15 },
  receiptRow: { fontSize: 16, marginVertical: 6, color: '#444' },
  bold: { fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 }
});
