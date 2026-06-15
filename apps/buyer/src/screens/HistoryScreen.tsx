import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const MOCK_HISTORY = [
  { id: '1', merchant: 'Grand Square', amount: '4,500', date: 'Oct 12, 14:30', status: 'COMPLETED' },
  { id: '2', merchant: 'Maitama Groceries', amount: '12,200', date: 'Oct 11, 09:15', status: 'COMPLETED' },
  { id: '3', merchant: 'Zenith Fuel', amount: '25,000', date: 'Oct 10, 18:45', status: 'COMPLETED' },
  { id: '4', merchant: 'Wuse Market POS 4', amount: '1,200', date: 'Oct 08, 11:20', status: 'COMPLETED' },
];

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Payment History</Text>
      <FlatList
        data={MOCK_HISTORY}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <View>
              <Text style={styles.merchant}>{item.merchant}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
               <Text style={styles.amount}>₦{item.amount}</Text>
               <Text style={styles.status}>{item.status}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FAF9F6' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 25, color: '#1A237E' },
  historyItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    marginBottom: 12,
    elevation: 1
  },
  merchant: { fontSize: 16, fontWeight: '700', color: '#333' },
  date: { fontSize: 12, color: '#888', marginTop: 4 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#1A237E' },
  status: { fontSize: 10, color: '#2E7D32', fontWeight: 'bold', marginTop: 4 }
});
