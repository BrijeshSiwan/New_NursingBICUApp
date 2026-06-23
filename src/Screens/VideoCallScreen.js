import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, PanResponder, Animated, AppState, BackHandler, Platform,Text } from 'react-native';
import { RTCPeerConnection, RTCView, mediaDevices, RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import PushNotification from 'react-native-push-notification';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import InCallManager from 'react-native-incall-manager';
import FloatingCallView from '../Components/FloatingCallView';
import * as FetchAPI from '../Services/fetchAPI';
import { getAuthToken } from "../Services/storage";
import { videoCallNotification, getFCMNotification } from '../Services/APIManager';

const configuration = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
};

export default function VideoCallScreen({ navigation, route }) {
  const { roomId, userName } = route.params;
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [localStreamPosition, setLocalStreamPosition] = useState({ x: 10, y: 10 });
  const [scale] = useState(new Animated.Value(1));
  const [isFloating, setIsFloating] = useState(false);
  const [isLoudspeaker, setIsLoudspeaker] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      setLocalStreamPosition({ x: gestureState.moveX - 50, y: gestureState.moveY - 75 });
    },
  });

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: scale } }],
    { useNativeDriver: false, listener: ({ nativeEvent }) => scale.setValue(Math.max(1, Math.min(nativeEvent.scale, 3))) }
  );

  const onPinchStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start();
    }
  };

  useEffect(() => {
    let unsubscribeAnswer, unsubscribeCandidates, unsubscribeRoom;

    const initCall = async () => {
      try {
        console.log('Caller: Initializing call with roomId:', roomId);
        const stream = await setupLocalStream();
        await startCall(stream);
        InCallManager.start({ media: 'video' });
        InCallManager.setSpeakerphoneOn(isLoudspeaker);
      } catch (error) {
        console.error('Caller: Error initializing call:', error);
        Alert.alert('Error', 'Failed to initialize call.');
        navigation.goBack();
      }
    };

    initCall();

    getAuthToken("auth_token").then(res => getFCMTokenFromAPI("Bearer " + res));

    const roomRef = firestore().collection('call').doc(String(roomId));
    unsubscribeRoom = roomRef.onSnapshot(snapshot => {
      if (snapshot.data()?.callEnded) {
        endCall();
      }
    });

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      if (unsubscribeAnswer) unsubscribeAnswer();
      if (unsubscribeCandidates) unsubscribeCandidates();
      if (unsubscribeRoom) unsubscribeRoom();
      subscription.remove();
      backHandler.remove();
      endCall();
    };
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') setIsFloating(true);
    else if (nextAppState === 'active') setIsFloating(false);
  };

  const handleBackPress = () => {
    setIsFloating(true);
    showCallNotification();
    navigation.navigate('ChatActivity', { hospitalId: roomId });
    return true;
  };

  const showCallNotification = () => {
    PushNotification.localNotification({
      title: 'Ongoing Video Call',
      message: 'Tap to return to the call',
      channelId: 'call-channel',
      userInfo: { screen: 'VideoCallScreen', roomId },
    });
  };

  const getFCMTokenFromAPI = async (auth_token) => {
    const getTokenAPIS = getFCMNotification + roomId + '/';
    try {
      FetchAPI.GetRequestwithauttoken(getTokenAPIS, auth_token, async (response) => {
        if (response.status === 200) {
          sendCallNotification(response.fcm_token);
        } else {
          console.error('Caller: Error fetching FCM token:', response);
        }
      });
    } catch (error) {
      console.error('Caller: Error in getFCMTokenFromAPI:', error);
    }
  };

  const sendCallNotification = async (fcm_token) => {
    const params = { 
    registration_ids: fcm_token, 
    caller_name: userName,
    call_type : "VIDEO_CALL", 
    hospital_id : roomId,
    icu_id : " " };
    FetchAPI.PostRequestwithParams(videoCallNotification, params, async (response) => {
      console.log('call send notification',response)
      if (response.status === 200) {
        console.log('send notification',response)
      } else {
        console.log('Error fetching FCM token')
      }
    });
  };

  const setupLocalStream = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({ audio: true, video: { facingMode: 'user' } });
      setLocalStream(stream);
      console.log('Caller: Local stream set:', stream.id);
      return stream;
    } catch (error) {
      console.error('Caller: Error setting up local stream:', error);
      throw error;
    }
  };

  const startCall = async (stream) => {
    try {
      const pc = new RTCPeerConnection(configuration);
      setPeerConnection(pc);

      pc.onconnectionstatechange = () => console.log('Caller Connection State:', pc.connectionState);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await firestore().collection('call').doc(String(roomId)).collection('callerCandidates').add(event.candidate.toJSON());
          console.log('Caller ICE candidate added');
        }
      };
      pc.ontrack = event => {
        console.log('Caller ontrack:', event.streams);
        if (event.streams && event.streams[0]) setRemoteStream(event.streams[0]);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const roomRef = firestore().collection('call').doc(String(roomId));
      await roomRef.set({ offer, callEnded: false }, { merge: true });
      console.log('Caller: Offer set in Firestore');

      unsubscribeAnswer = roomRef.onSnapshot(async snapshot => {
        const data = snapshot.data();
        if (data?.answer && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log('Caller: Answer set successfully');
        }
      });

      unsubscribeCandidates = roomRef.collection('calleeCandidates').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added') {
            await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            console.log('Caller: Callee ICE candidate added');
          }
        });
      });
    } catch (error) {
      console.error('Caller: Error in startCall:', error);
      throw error;
    }
  };

  const endCall = async () => {
    try {
      console.log('Caller: Starting endCall');
      if (peerConnection) {
        peerConnection.close();
        console.log('Caller: PeerConnection closed');
        setPeerConnection(null);
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        console.log('Caller: Local stream stopped');
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
        console.log('Caller: Remote stream stopped');
      }
      InCallManager.stop();
      console.log('Caller: InCallManager stopped');

      const roomRef = firestore().collection('call').doc(String(roomId));
      const doc = await roomRef.get();
      if (doc.exists) {
        await roomRef.update({ callEnded: true });
        await Promise.all([
          roomRef.collection('callerCandidates').get().then(querySnapshot => 
            Promise.all(querySnapshot.docs.map(doc => doc.ref.delete()))
          ),
          roomRef.collection('calleeCandidates').get().then(querySnapshot => 
            Promise.all(querySnapshot.docs.map(doc => doc.ref.delete()))
          ),
        ]);
        await roomRef.delete();
        console.log('Caller: Call document and candidates deleted');
      }
      if (Platform.OS === 'android') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      navigation.goBack();
      console.log('Caller: endCall completed');
    } catch (error) {
      console.error('Caller: Error in endCall:', error);
      navigation.goBack();
    }
  };

  const switchCamera = () => localStream?.getVideoTracks().forEach(track => track._switchCamera());

  const toggleLoudspeaker = () => {
    setIsLoudspeaker(prev => !prev);
    InCallManager.setSpeakerphoneOn(!isLoudspeaker);
    console.log('Caller: Loudspeaker:', !isLoudspeaker);
  };

  return (
    <>
      {!isFloating ? (
        <View style={styles.container}>
          {remoteStream ? (
            <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
              <Animated.View style={{ flex: 1, transform: [{ scale: scale }], backgroundColor: '#000' }}>
                <RTCView style={styles.remoteStream} streamURL={remoteStream.toURL()} objectFit="cover" />
              </Animated.View>
            </PinchGestureHandler>
          ) : (
            <View style={styles.remoteStream}><Text style={styles.noStreamText}>Waiting for remote stream...</Text></View>
          )}
          {localStream && (
            <View style={[styles.localStreamContainer, { top: localStreamPosition.y, left: localStreamPosition.x }]} {...panResponder.panHandlers}>
              <RTCView style={styles.localStream} streamURL={localStream.toURL()} objectFit="cover" />
            </View>
          )}
          <View style={styles.controls}>
            <TouchableOpacity onPress={switchCamera} style={styles.controlButton}>
              <Icon name="switch-camera" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleLoudspeaker} style={styles.controlButton}>
              <Icon name={isLoudspeaker ? "volume-up" : "volume-off"} size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={endCall} style={[styles.controlButton, styles.endButton]}>
              <Icon name="call-end" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FloatingCallView remoteStream={remoteStream} onExpand={() => setIsFloating(false)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', position: 'relative' },
  remoteStream: { flex: 1 },
  noStreamText: { color: 'white', textAlign: 'center', marginTop: 20 },
  localStreamContainer: {
    position: 'absolute',
    width: 120,
    height: 180,
    zIndex: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 10,
    backgroundColor: 'black',
    overflow: 'hidden',
  },
  localStream: { width: 120, height: 180, borderRadius: 10 },
  controls: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  controlButton: {
    width: 60,
    height: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  endButton: { backgroundColor: '#f44336' },
});