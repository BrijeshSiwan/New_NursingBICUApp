/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';


AppRegistry.registerComponent(appName, () => App);
// Configure Push Notification
PushNotification.configure({
    // (optional) Called when Token is generated (iOS and Android)
    onRegister: function (token) {
        console.log('Token:', token);
        // You can send the token to your server here if needed
    },

    // (required) Called when a remote or local notification is opened or received
    onNotification: function (notification) {
        console.log('Notification:', notification);
        const { screen, roomId } = notification.userInfo || {};
        if (screen && roomId) {
          navigation.navigate(screen, { roomId });
        }
        // (required) Called when a remote is received or opened, or local notification is opened
        notification.finish(PushNotificationIOS.FetchResult.NoData);
    },

    // (optional) Called when Action is clicked (Android)
    onAction: function (notification) {
        console.log('Action:', notification.action);
        console.log('Notification:', notification);
    },

    // (optional) Called when a remote is received or opened, or local notification is opened
    onRegistrationError: function(err) {
        console.error(err.message, err);
    },

    // IOS only
    permissions: {
        alert: true,
        badge: true,
        sound: true,
    },

    popInitialNotification: true,

    requestPermissions: true,
});



