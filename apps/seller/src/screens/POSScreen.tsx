import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { BiometricSensor } from '../biometric/sensor';
import Constants from '../config';

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

      const invoiceRes = await fetch(`${Constants.API_URL}/invoice`, {
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

  const [attempts, setAttempts] = useState(0);
  const [mode, setMode] = useState<'BIOMETRIC' | 'LOOKUP' | 'PIN'>('BIOMETRIC');
  const [lookupValue, setLookupValue] = useState('');
  const [matchedBuyer, setMatchedBuyer] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [scrambledNumbers, setScrambledNumbers] = useState<number[]>([]);

  const scrambleKeypad = () => {
    const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    setScrambledNumbers(nums);
  };

  const triggerBiometric = async (token: string) => {
    try {
      setStatus(`Session [${token}] - Waiting for Biometric...`);
      
      const signature = await BiometricSensor.captureFingerprint(
        `Confirm payment of ₦${amount} (Token: ${token})`, 
        token
      );
      
      if (signature) {
        setStatus('Verifying Identity...');
        
        const payRes = await fetch(`${Constants.API_URL}/match-and-pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken: token, capturedTemplate: signature })
        });
        
        const payData = await payRes.json();

        if (payRes.ok && payData.status !== 'FAILED') {
          handleSuccess(payData);
        } else {
          setAttempts(prev => prev + 1);
          if (attempts + 1 >= 3) {
             setMode('LOOKUP');
             setStatus('3 Failures. Switching to Manual Lookup.');
          } else {
             throw new Error(payData.error || payData.message || 'Match failed. Try again.');
          }
        }
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const handleLookup = async () => {
    try {
      setStatus('Looking up buyer...');
      const res = await fetch(`${Constants.API_URL}/lookup-buyer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: lookupValue })
      });
      const data = await res.json();
      if (res.ok) {
        setMatchedBuyer(data.buyer);
        scrambleKeypad();
        setMode('PIN');
        setStatus('');
      } else {
        Alert.alert('Lookup Failed', data.error || 'User not found');
      }
    } catch (e: any) {
      setStatus('Lookup Failed');
      Alert.alert('Network Error', 'Could not connect to the BPN network.');
    }
  };

  const handlePinPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        submitPin(newPin);
      }
    }
  };

  const submitPin = async (finalPin: string) => {
    try {
      setStatus('Verifying PIN...');
      const res = await fetch(`${Constants.API_URL}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: currentToken, pin: finalPin, phoneNumber: lookupValue })
      });
      const data = await res.json();
      if (res.ok) {
        handleSuccess(data);
      } else {
        setPin(''); // Reset PIN on failure
        Alert.alert('Payment Failed', data.error || 'Incorrect PIN');
      }
    } catch (e: any) {
      setStatus('Verification Failed');
    }
  };

  const handleSuccess = (payData: any) => {
    setReceipt({
      buyer: payData.buyerName || matchedBuyer?.maskedName,
      bank: payData.buyerBank || matchedBuyer?.bankName,
      ref: payData.reference,
      amount: amount,
      date: new Date().toLocaleString()
    });
    setIsWaiting(false);
    setTimer(0);
    setAttempts(0);
    setPin('');
    setMode('BIOMETRIC');
    setStatus('');
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
          {mode === 'BIOMETRIC' && (
            <>
              <View style={styles.timerCircle}>
                 <Text style={styles.timerText}>{timer}s</Text>
              </View>
              <ActivityIndicator size="large" color="#1A237E" />
              <Text style={styles.statusText}>{status}</Text>
              <Text style={styles.subStatus}>Ask buyer to tap the sensor on this device</Text>
              
              {!status.includes('Verifying') && timer > 0 && (
                <View style={{marginTop: 30}}>
                  <Button title="Retry Biometric Scan" onPress={retryScan} color="#1A237E" />
                  <TouchableOpacity onPress={() => setMode('LOOKUP')} style={{marginTop: 15}}>
                     <Text style={{color: '#1A237E', textDecorationLine: 'underline'}}>Having trouble? Use Manual Lookup</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {mode === 'LOOKUP' && (
            <View style={styles.lookupBox}>
               <Text style={styles.lookupTitle}>Manual Identity Lookup</Text>
               <Text style={styles.label}>Phone Number or Last 6 BVN Digits</Text>
               <TextInput 
                 style={styles.lookupInput}
                 value={lookupValue}
                 onChangeText={setLookupValue}
                 placeholder="080... or last 6 digits"
                 keyboardType="numeric"
                 autoFocus
               />
               <Button title="Find Buyer Profile" onPress={handleLookup} color="#1A237E" />
               <TouchableOpacity onPress={() => setMode('BIOMETRIC')} style={{marginTop: 15}}>
                  <Text style={{color: '#666'}}>Back to Fingerprint</Text>
               </TouchableOpacity>
            </View>
          )}

          {mode === 'PIN' && (
            <View style={styles.pinBox}>
               <Text style={styles.pinTitle}>Authorize with PIN</Text>
               <Text style={styles.maskedBuyer}>Confirm Identity: {matchedBuyer?.maskedName} ({matchedBuyer?.bankName})</Text>
               <View style={styles.pinDisplay}>
                  <Text style={styles.pinDot}>{pin.length >= 1 ? '●' : '○'}</Text>
                  <Text style={styles.pinDot}>{pin.length >= 2 ? '●' : '○'}</Text>
                  <Text style={styles.pinDot}>{pin.length >= 3 ? '●' : '○'}</Text>
                  <Text style={styles.pinDot}>{pin.length >= 4 ? '●' : '○'}</Text>
               </View>
               
               <View style={styles.pinGrid}>
                  {scrambledNumbers.map(num => (
                    <TouchableOpacity key={num} style={styles.pinBtn} onPress={() => handlePinPress(num.toString())}>
                       <Text style={styles.pinBtnText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.pinBtn} onPress={() => setPin('')}>
                       <Text style={[styles.pinBtnText, {color: 'red', fontSize: 14}]}>Clear</Text>
                  </TouchableOpacity>
               </View>
               <Text style={styles.pinHint}>Keypad order changes for your security</Text>
            </View>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsWaiting(false); setTimer(0); setMode('BIOMETRIC'); }}>
            <Text style={{color: 'red'}}>Cancel Transaction</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isWaiting && !receipt && amount !== '' && (
        <View style={styles.qrContainer}>
           <Text style={styles.qrText}>Or Buy with QR Fallback</Text>
           <View style={styles.qrPlaceholder}>
              <Text style={{color: '#999'}}>QR: BPN-INV-{currentToken}</Text>
           </View>
           <Text style={styles.subStatus}>Buyer can scan this with the BPN App</Text>
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
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  lookupBox: { width: '100%', padding: 20, backgroundColor: '#fff', borderRadius: 10, elevation: 2 },
  lookupTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1A237E' },
  lookupInput: { fontSize: 24, padding: 10, borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 20 },
  pinBox: { width: '100%', alignItems: 'center' },
  pinTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A237E' },
  maskedBuyer: { fontSize: 14, color: '#666', marginVertical: 10 },
  pinLabel: { fontSize: 12, color: '#999', marginBottom: 20 },
  pinGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 280, justifyContent: 'center' },
  pinBtn: { width: 80, height: 60, backgroundColor: '#fff', margin: 5, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  pinBtnText: { fontSize: 20, fontWeight: 'bold', color: '#1A237E' },
  pinHint: { fontSize: 11, color: '#999', marginTop: 15 },
  pinDisplay: { flexDirection: 'row', marginBottom: 20 },
  pinDot: { fontSize: 30, marginHorizontal: 10, color: '#1A237E' },
  qrContainer: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderColor: '#eee', paddingTop: 30 },
  qrText: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 15 },
  qrPlaceholder: { width: 140, height: 140, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginBottom: 10 }
});
