import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, AppState, Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import Sound from 'react-native-sound';
import messaging from '@react-native-firebase/messaging';
import { getAuthToken } from "../Services/storage";
import Tts from 'react-native-tts';

Sound.setCategory('Playback');

const SplashScreen = ({ navigation }) => {
  const [appState, setAppState] = useState(AppState.currentState);
  let ringtone;

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => setAppState(nextAppState);
    const appStateListener = AppState.addEventListener('change', handleAppStateChange);
    return () => appStateListener.remove();
  }, []);

  useEffect(() => {
    const redirectTimeout = setTimeout(async () => {
      try {
        const authToken = await getAuthToken("auth_token");
        if (!authToken) {
          navigation.replace('Auth');
        } else {
          navigation.replace('IcuBedsScreen');
        }
      } catch (error) {
        console.error("Error redirecting:", error);
        navigation.replace('Auth');
      }
    }, 4000);

    return () => clearTimeout(redirectTimeout);
  }, [navigation]);

  useEffect(() => {
    Tts.getInitStatus()
      .then(() => {
        Tts.setDefaultLanguage('en-US');
        Tts.setDefaultRate(0.5);
        Tts.setDefaultPitch(1.0);
        console.log('TTS initialized');
      })
      .catch(error => console.error("Error initializing TTS:", error));
  }, []);

  const playReminderSound = () => {
    const sound = new Sound('reminder_audio.wav', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error('Failed to load reminder sound:', error);
        return;
      }
      sound.play(() => sound.release());
    });
  };

  const playRingtone = () => {
    ringtone = new Sound('videocalltone.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error('Failed to load ringtone:', error);
        return;
      }
      ringtone.setNumberOfLoops(-1);
      ringtone.play();
      console.log('Ringtone playing');
    });
  };

  const stopRingtone = () => {
    if (ringtone && ringtone.isLoaded()) {
      ringtone.stop(() => {
        ringtone.release();
        console.log('Ringtone stopped');
      });
    }
  };

  const handleNotification = async (notification) => {
    try {
      console.log('Handling notification:', notification);
      const authToken = await getAuthToken("auth_token");
      if (!authToken) {
        console.log('No auth token, redirecting to Auth');
        navigation.replace('Auth');
        return;
      }

      const data = notification.data || notification || {};
      const type = data.type || data.action;
      const hospital_id = data.hospital_id || data.roomId;
      const caller_name = data.caller_name || 'Unknown';
      const title = notification.title || 'Incoming Notification';

      if (!hospital_id) {
        console.error('Missing hospital_id/roomId in notification:', data);
        return;
      }

      switch (type) {
        case 'reminder':
          playReminderSound();
          navigation.navigate('IcuBedsScreen', { reminderTitle: title });
          break;
        case 'chat_msg':
          Tts.speak('Budget ICU message from ' + title);
          navigation.navigate('ChatActivity', { hospitalId: hospital_id });
          break;
        case 'approve':
          Tts.speak(`Budget ICU ${title}`);
          navigation.replace('IcuBedsScreen');
          break;
        case 'suggestion':
          Tts.speak(`Budget ICU suggestion from ${title}`);
          navigation.replace('IcuBedsScreen');
          break;
        case 'VIDEO_CALL':
          playRingtone();
          navigation.navigate('AcceptVideoCall', { roomId: hospital_id, userName: caller_name });
          setTimeout(() => stopRingtone(), 1000);
          break;
        default:
          console.log('Unknown notification type:', type);
          break;
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  useEffect(() => {
    PushNotification.configure({
      onRegister: (token) => console.log("Device Token:", token),
      onNotification: (notification) => {
        console.log("NOTIFICATION RECEIVED:", notification);
        handleNotification(notification);
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },
      permissions: { alert: true, badge: true, sound: true },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    messaging().onMessage(async (remoteMessage) => {
      console.log("Foreground notification received:", remoteMessage);
      handleNotification(remoteMessage);
    });

    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("Notification opened from background:", remoteMessage);
      handleNotification(remoteMessage);
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("Background message received:", remoteMessage);
      handleNotification(remoteMessage.data);
    });

    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('Notification caused app to open from quit state:', remoteMessage);
        handleNotification(remoteMessage);
      }
    });

    return () => stopRingtone();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image style={styles.logo} source={require('../assets/images/logo.png')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF7F4',
    justifyContent: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 280,
    height: 50,
    alignSelf: 'center',
  },
});

export default SplashScreen;