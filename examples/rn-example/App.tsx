import React, { useState, createContext, useContext, useMemo, memo } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { initDebugMCP } from '@rn-debug-mcp/instrumentation';

// 1. Initialize MCP in Dev mode
if (__DEV__) {
    // For Android, run: adb reverse tcp:4567 tcp:4567
    // This allows using 'localhost' on both platforms.
    const host = 'localhost';
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
        setCount(c => c + 1);
    };

    // Optimization: Memoize the context value to prevent unnecessary re-renders of all consumers
    const value = useMemo(() => ({ count, increment }), [count]);

    return (
        <HeavyContext.Provider value={value}>
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

// Optimization: Use memo to prevent re-renders when props/context haven't changed meaningfully
const AffectedChild = memo(({ id }: { id: number }) => {
    const { count } = useContext(HeavyContext);
    return (
        <View style={styles.smallBox}>
            <Text style={styles.smallText}>Child {id}: {count}</Text>
        </View>
    );
});

const SlowComponent = () => {
    // FIXED: Removed the blocking while(150ms) loop.
    // Heavy work should usually be handled via useMemo or interaction manager.

    return (
        <View style={styles.box}>
            <Text style={styles.text}>I am now a fast component! (0ms delay)</Text>
        </View>
    );
};

const NativeLogTester = () => {
    const logTrace = (level: 'log' | 'warn' | 'error') => {
        const marker = `[MCP-TEST-${level.toUpperCase()}]`;
        const message = `${marker} This is a test log at ${new Date().toISOString()}`;
        console[level](message);
    };

    return (
        <View style={styles.box}>
            <Text style={styles.text}>Native Log Testing</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Button title="Log INFO" onPress={() => logTrace('log')} />
                <Button title="Log WARN" color="orange" onPress={() => logTrace('warn')} />
                <Button title="Log ERROR" color="red" onPress={() => logTrace('error')} />
            </View>
            <Text style={styles.smallTextAlt}>
                Tapping these will output logs visible to `readNativeLogs`.
                Use filter "MCP-TEST" to find them.
            </Text>
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

                        <NativeLogTester />
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
    smallTextAlt: { fontSize: 12, color: '#666', marginTop: 10, fontStyle: 'italic' },
    row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }
});
