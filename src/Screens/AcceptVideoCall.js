import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PushNotification from 'react-native-push-notification';
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

const AcceptVideoCall = ({ route, navigation }) => {
  const { roomId, userName } = route.params || {};
  let ringtone;

  useEffect(() => {
    console.log('AcceptVideoCall: Mounted with params:', { roomId, userName });
    if (!roomId) {
      console.error('AcceptVideoCall: Missing roomId, navigating back');
      navigation.goBack();
      return;
    }
    playRingtone();
    return () => stopRingtone();
  }, []);

  const playRingtone = () => {
    ringtone = new Sound('videocalltone.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error('AcceptVideoCall: Failed to load ringtone:', error);
        Alert.alert('Error', 'Failed to load ringtone.');
        return;
      }
      ringtone.setNumberOfLoops(-1);
      ringtone.play();
      console.log('AcceptVideoCall: Ringtone playing');
    });
  };

  const stopRingtone = () => {
    if (ringtone && ringtone.isLoaded()) {
      ringtone.stop(() => {
        ringtone.release();
        console.log('AcceptVideoCall: Ringtone stopped');
      });
    }
  };

  const handleAccept = () => {
    try {
      stopRingtone();
      PushNotification.removeAllDeliveredNotifications();
      console.log('AcceptVideoCall: Accepting call, navigating to JoinCallScreen with roomId:', roomId);
      navigation.replace('JoinCallScreen', { roomId, userName });
    } catch (error) {
      console.error('AcceptVideoCall: Error in handleAccept:', error);
      Alert.alert('Error', 'Failed to join call.');
      navigation.goBack();
    }
  };

  const handleReject = () => {
    try {
      stopRingtone();
      PushNotification.removeAllDeliveredNotifications();
      console.log('AcceptVideoCall: Call rejected');
      navigation.goBack();
    } catch (error) {
      console.error('AcceptVideoCall: Error in handleReject:', error);
      Alert.alert('Error', 'Failed to reject call.');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <Image
        source={{ uri: 'https://via.placeholder.com/500' }}
        style={styles.backgroundImage}
        blurRadius={10}
      />
      <View style={styles.infoContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/150' }}
          style={styles.profilePicture}
        />
        <Text style={styles.callerName}>{userName || 'Unknown'}</Text>
        <Text style={styles.callingText}>Video Calling...</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
          <Icon name="call-end" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
          <Icon name="call" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  callerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  callingText: {
    fontSize: 18,
    color: '#d3d3d3',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
    marginBottom: 40,
  },
  rejectButton: {
    backgroundColor: '#ff4d4d',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AcceptVideoCall;