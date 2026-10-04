import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from '../config';

type Mode = 'ENROLL' | 'IDENTIFY' | 'MERCHANT_ASSISTED';

export default function BiometricCaptureScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('ENROLL');
  const [userId, setUserId] = useState('bpn-test-user-001');
  const [fullName, setFullName] = useState('');
  const [bvn, setBvn] = useState('');
  const [bankCode, setBankCode] = useState('044');
  const [accountNumber, setAccountNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [engineUrl, setEngineUrl] = useState(process.env.EXPO_PUBLIC_BPN_BIOMETRIC_ENGINE_URL || Constants.BIOMETRIC_ENGINE_URL || '');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  const capture = async () => {
    if (!cameraRef.current || busy) return;
    if (!engineUrl.trim()) {
      Alert.alert('Engine URL required', 'Set EXPO_PUBLIC_BPN_BIOMETRIC_ENGINE_URL to the reachable BPN biometric-engine URL.');
      return;
    }
    try {
      setBusy(true); setResult(null);
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 1, skipProcessing: false });
      if (!photo?.base64) throw new Error('Camera did not return an image payload.');
      let url: string;
      let body: any;
      if (mode === 'MERCHANT_ASSISTED') {
        if (!fullName.trim() || bvn.length !== 11 || accountNumber.length !== 10 || !consent) {
          throw new Error('Enter name, 11-digit BVN, 10-digit account number and explicit biometric consent.');
        }
        url = Constants.API_URL.replace(/\/$/, '') + '/merchant-assisted-enroll';
        body = { fullName: fullName.trim(), bvn, consent, bankAccounts: [{ bankCode, accountNumber, accountName: fullName.trim() }], capture: { imageBase64: photo.base64, imageMime: 'image/jpeg' }, merchantId: 'CURRENT_MERCHANT' };
      } else {
        const endpoint = mode === 'ENROLL' ? '/v1/enroll' : '/v1/identify';
        url = engineUrl.replace(/\/$/, '') + endpoint;
        body = mode === 'ENROLL' ? { user_id: userId.trim(), image_base64: photo.base64, image_mime: 'image/jpeg' } : { image_base64: photo.base64, image_mime: 'image/jpeg', threshold: 40 };
      }
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.error || `Engine returned HTTP ${response.status}`);
      setResult(data);
    } catch (error: any) { setResult({ error: error.message }); }
    finally { setBusy(false); }
  };

  if (!permission) return <View style={styles.center}><Text>Checking camera permission…</Text></View>;
  if (!permission.granted) return <View style={styles.center}><Text style={styles.title}>BPN Fingerprint Capture</Text><Text style={styles.note}>Experimental real-camera capture. This is not Android BiometricPrompt.</Text><TouchableOpacity style={styles.button} onPress={requestPermission}><Text style={styles.buttonText}>Allow Camera</Text></TouchableOpacity></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BPN Biometric Capture</Text>
      <Text style={styles.warning}>EXPERIMENTAL — real camera capture, no mock match.</Text>
      <View style={styles.modeRow}>
        <TouchableOpacity style={[styles.mode, mode === 'ENROLL' && styles.modeActive]} onPress={() => setMode('ENROLL')}><Text>Enroll</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.mode, mode === 'IDENTIFY' && styles.modeActive]} onPress={() => setMode('IDENTIFY')}><Text>Identify</Text></TouchableOpacity><TouchableOpacity style={[styles.mode, mode === 'MERCHANT_ASSISTED' && styles.modeActive]} onPress={() => setMode('MERCHANT_ASSISTED')}><Text>Assisted</Text></TouchableOpacity>
      </View>
      {mode === 'ENROLL' && <TextInput style={styles.input} value={userId} onChangeText={setUserId} placeholder="BPN test identity" autoCapitalize="none" />}
      {mode === 'MERCHANT_ASSISTED' && <><TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Buyer full name" /><TextInput style={styles.input} value={bvn} onChangeText={setBvn} placeholder="11-digit BVN" keyboardType="numeric" maxLength={11} /><TextInput style={styles.input} value={bankCode} onChangeText={setBankCode} placeholder="Bank code" keyboardType="numeric" /><TextInput style={styles.input} value={accountNumber} onChangeText={setAccountNumber} placeholder="10-digit account number" keyboardType="numeric" maxLength={10} /><TouchableOpacity style={styles.consent} onPress={() => setConsent(!consent)}><Text>{consent ? '☑' : '☐'} Buyer explicitly consents to merchant-assisted biometric enrollment</Text></TouchableOpacity></>}
      {mode !== 'MERCHANT_ASSISTED' && <TextInput style={styles.input} value={engineUrl} onChangeText={setEngineUrl} placeholder="http://PHONE-REACHABLE-ENGINE:8000" autoCapitalize="none" autoCorrect={false} />}
      <View style={styles.cameraWrap}><CameraView ref={cameraRef} style={styles.camera} facing="back"><View style={styles.guide}><Text style={styles.guideText}>Place one fingertip inside the guide</Text></View></CameraView></View>
      <TouchableOpacity style={[styles.captureButton, busy && styles.disabled]} onPress={capture} disabled={busy}><Text style={styles.buttonText}>{busy ? 'Processing…' : `Capture & ${mode === 'ENROLL' ? 'Enroll' : 'Identify'}`}</Text></TouchableOpacity>
      {result && <View style={styles.result}><Text style={styles.resultTitle}>Engine result</Text><Text selectable>{JSON.stringify(result, null, 2)}</Text></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FAF9F6' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A237E', marginBottom: 8 }, note: { color: '#666', textAlign: 'center', marginBottom: 20 }, warning: { color: '#8A5A00', marginBottom: 12, fontWeight: '600' },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 }, mode: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#EEE', borderRadius: 8 }, modeActive: { backgroundColor: '#D7D9FF' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, marginBottom: 10 }, cameraWrap: { height: 330, overflow: 'hidden', borderRadius: 14, backgroundColor: '#111', marginTop: 4 }, camera: { flex: 1 },
  guide: { flex: 1, alignItems: 'center', justifyContent: 'center' }, guideText: { color: '#FFF', backgroundColor: 'rgba(0,0,0,0.55)', padding: 10, borderRadius: 8 },
  captureButton: { marginTop: 12, padding: 15, borderRadius: 10, backgroundColor: '#1A237E', alignItems: 'center' }, disabled: { opacity: 0.6 }, button: { padding: 14, borderRadius: 10, backgroundColor: '#1A237E' }, buttonText: { color: '#FFF', fontWeight: '700' },
  consent: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 10 },
  result: { marginTop: 12, backgroundColor: '#FFF', padding: 12, borderRadius: 10, maxHeight: 180 }, resultTitle: { fontWeight: '700', marginBottom: 6 },
});