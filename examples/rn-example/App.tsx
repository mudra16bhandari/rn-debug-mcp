import React, { useState, createContext, useContext } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { initDebugMCP } from '@rn-debug-mcp/instrumentation';

// 1. Initialize MCP in Dev mode
if (__DEV__) {
    // Android emulators use 10.0.2.2 for host localhost
    const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    initDebugMCP({
        wsUrl: `ws://${host}:4567`,
        enabled: true
    });
}

// 2. A context that triggers many updates
const HeavyContext = createContext({ count: 0, increment: () => { } });

const ContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [count, setCount] = useState(0);

    const increment = () => {
        // Manually track the trigger for better analysis
        // trackContextTrigger('HeavyContext', 'increment');
        setCount(c => c + 1);
    };

    return (
        <HeavyContext.Provider value={{ count, increment }}>
            {children}
        </HeavyContext.Provider>
    );
};

// 3. Components for Heatmap/Cascade Testing
const CascadeTrigger = () => {
    const { count, increment } = useContext(HeavyContext);
    return (
        <View style={styles.box}>
            <Text style={styles.text}>Global Count: {count}</Text>
            <Button title="Trigger Cascade" onPress={increment} />
        </View>
    );
};

const AffectedChild = ({ id }: { id: number }) => {
    const { count } = useContext(HeavyContext);
    return (
        <View style={styles.smallBox}>
            <Text style={styles.smallText}>Child {id}: {count}</Text>
        </View>
    );
};

const SlowComponent = () => {
    const start = Date.now();
    // Simulate heavy JS work
    while (Date.now() - start < 150) { }

    return (
        <View style={styles.box}>
            <Text style={styles.text}>I am a slow component (150ms)</Text>
        </View>
    );
};

export default function App() {
    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }}>
                <ContextProvider>
                    <ScrollView contentContainerStyle={styles.container}>
                        <Text style={styles.title}>RN Debug MCP Demo</Text>
                        <Text style={styles.subtitle}>Full Native Structure (iOS/Android)</Text>

                        <CascadeTrigger />

                        <View style={styles.row}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <AffectedChild key={i} id={i} />
                            ))}
                        </View>

                        <SlowComponent />
                    </ScrollView>
                </ContextProvider>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#f0f0f0' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
    box: { padding: 20, backgroundColor: 'white', borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    text: { fontSize: 18, marginBottom: 10 },
    smallBox: { padding: 15, backgroundColor: '#fff', margin: 5, borderRadius: 8, minWidth: 100, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
    smallText: { fontSize: 14, fontWeight: '500' },
    row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }
});
