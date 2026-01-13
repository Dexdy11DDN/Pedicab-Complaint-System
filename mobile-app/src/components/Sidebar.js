import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    TouchableWithoutFeedback,
    ScrollView,
    Image
} from 'react-native';

const { width, height } = Dimensions.get('window');

const Sidebar = ({ visible, onClose, onNavigate, activeItem, userRole, userName }) => {
    const slideAnim = useRef(new Animated.Value(-300)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0.5,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -300,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!visible && slideAnim._value === -300) return null;

    const menuItems = userRole === 'enforcer' ? [
        { key: 'available', label: 'Available Investigations', icon: '🔍' },
        { key: 'myInvestigations', label: 'My Investigations', icon: '📋' },
        { key: 'myTickets', label: 'My Tickets', icon: '🎫' },
        { key: 'franchises', label: 'Franchise Database', icon: '🚲' },
    ] : [
        { key: 'newComplaint', label: 'New Complaint', icon: '📝' },
        { key: 'myComplaints', label: 'My Complaints', icon: '📂' },
        { key: 'profile', label: 'My Profile', icon: '👤' },
    ];

    return (
        <View style={[styles.container, !visible && styles.hidden]} pointerEvents={visible ? 'auto' : 'none'}>
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
            </TouchableWithoutFeedback>

            <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.header}>
                    <Text style={styles.logoIcon}>🚲</Text>
                    <View>
                        <Text style={styles.appTitle}>Pedicab System</Text>
                        {userName && <Text style={styles.userName}>Hello, {userName}</Text>}
                    </View>
                </View>

                <ScrollView style={styles.menuContainer}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            style={[
                                styles.menuItem,
                                activeItem === item.key && styles.activeMenuItem
                            ]}
                            onPress={() => {
                                onNavigate(item.key);
                                onClose();
                            }}
                        >
                            <Text style={styles.menuIcon}>{item.icon}</Text>
                            <Text style={[
                                styles.menuLabel,
                                activeItem === item.key && styles.activeMenuLabel
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Version 1.0.0</Text>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        zIndex: 1000,
        elevation: 1000,
    },
    hidden: {
        zIndex: -1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        backgroundColor: '#000',
    },
    sidebar: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 280,
        height: '100%',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        height: 120,
        backgroundColor: '#ff8c42',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingTop: 20,
        paddingHorizontal: 20,
    },
    logoIcon: {
        fontSize: 40,
        marginRight: 15,
        color: '#fff',
    },
    appTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    userName: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    menuContainer: {
        flex: 1,
        paddingTop: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 25,
    },
    activeMenuItem: {
        backgroundColor: '#fff3e0',
        borderRightWidth: 4,
        borderRightColor: '#ff8c42',
    },
    menuIcon: {
        fontSize: 20,
        marginRight: 20,
        width: 25,
        textAlign: 'center',
    },
    menuLabel: {
        fontSize: 16,
        color: '#555',
        fontWeight: '500',
    },
    activeMenuLabel: {
        color: '#ff8c42',
        fontWeight: 'bold',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
    },
});

export default Sidebar;
