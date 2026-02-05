import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import RNRestart from 'react-native-restart'; // You might need to install this or simply ask user to restart

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Đã xảy ra lỗi!</Text>
                    <Text style={styles.text}>{this.state.error?.toString()}</Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => this.setState({ hasError: false })}
                    >
                        <Text style={styles.btnText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    title: {
        color: 'red',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10
    },
    text: {
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center'
    },
    button: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 5
    },
    btnText: {
        color: '#000',
        fontWeight: 'bold'
    }
});
