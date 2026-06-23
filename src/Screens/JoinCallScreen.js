import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, PanResponder, Animated, AppState, BackHandler, Platform, Text} from 'react-native';
import { RTCPeerConnection, RTCView, mediaDevices, RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import PushNotification from 'react-native-push-notification';
import InCallManager from 'react-native-incall-manager';
import FloatingCallView from '../Components/FloatingCallView';

const configuration = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
};

export default function JoinCallScreen({ route, navigation }) {
  const { roomId } = route.params || {};
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
    let unsubscribeOffer, unsubscribeCandidates, unsubscribeRoom;

    const initCall = async () => {
      try {
        console.log('Callee: Joining call with roomId:', roomId);
        if (!roomId) {
          console.error('Callee: Missing roomId, navigating back');
          navigation.goBack();
          return;
        }
        const stream = await setupLocalStream();
        await joinCall(stream);
        InCallManager.start({ media: 'video' });
        InCallManager.setSpeakerphoneOn(isLoudspeaker);
      } catch (error) {
        console.error('Callee: Error joining call:', error);
        Alert.alert('Error', 'Failed to join the call.');
        navigation.goBack();
      }
    };

    initCall();

    const roomRef = firestore().collection('call').doc(roomId);
    unsubscribeRoom = roomRef.onSnapshot(snapshot => {
      if (snapshot.data()?.callEnded) {
        endCall();
      }
    });

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      if (unsubscribeOffer) unsubscribeOffer();
      if (unsubscribeCandidates) unsubscribeCandidates();
      if (unsubscribeRoom) unsubscribeRoom();
      subscription.remove();
      backHandler.remove();
      endCall();
    };
  }, [roomId]);

  const setupLocalStream = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({ audio: true, video: { facingMode: 'user' } });
      setLocalStream(stream);
      console.log('Callee: Local stream set:', stream.id);
      return stream;
    } catch (error) {
      console.error('Callee: Error setting up local stream:', error);
      throw error;
    }
  };

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
      userInfo: { screen: 'JoinCallScreen', roomId },
    });
  };

  const joinCall = async (stream) => {
    try {
      const pc = new RTCPeerConnection(configuration);
      setPeerConnection(pc);

      pc.onconnectionstatechange = () => console.log('Callee Connection State:', pc.connectionState);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.onicecandidate = event => {
        if (event.candidate) {
          firestore().collection('call').doc(roomId).collection('calleeCandidates').add(event.candidate.toJSON());
          console.log('Callee ICE candidate added');
        }
      };
      pc.ontrack = event => {
        console.log('Callee ontrack:', event.streams);
        if (event.streams && event.streams[0]) setRemoteStream(event.streams[0]);
      };

      const roomRef = firestore().collection('call').doc(roomId);
      unsubscribeOffer = roomRef.onSnapshot(async snapshot => {
        const roomData = snapshot.data();
        if (roomData?.offer && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(roomData.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await roomRef.update({ answer });
          console.log('Callee: Offer set and answer sent');
        }
      });

      unsubscribeCandidates = roomRef.collection('callerCandidates').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added') {
            await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            console.log('Callee: Caller ICE candidate added');
          }
        });
      });
    } catch (error) {
      console.error('Callee: Error in joinCall:', error);
      throw error;
    }
  };

  const endCall = async () => {
    try {
      console.log('Callee: Starting endCall');
      if (peerConnection) {
        peerConnection.close();
        console.log('Callee: PeerConnection closed');
        setPeerConnection(null);
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        console.log('Callee: Local stream stopped');
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
        console.log('Callee: Remote stream stopped');
      }
      InCallManager.stop();
      console.log('Callee: InCallManager stopped');

      const roomRef = firestore().collection('call').doc(roomId);
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
        console.log('Callee: Call document and candidates deleted');
      }
      if (Platform.OS === 'android') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('IcuBedsScreen');
      }
      console.log('Callee: endCall completed');
    } catch (error) {
      console.error('Callee: Error in endCall:', error);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('IcuBedsScreen');
      }
    }
  };

  const switchCamera = () => localStream?.getVideoTracks().forEach(track => track._switchCamera());

  const toggleLoudspeaker = () => {
    setIsLoudspeaker(prev => !prev);
    InCallManager.setSpeakerphoneOn(!isLoudspeaker);
    console.log('Callee: Loudspeaker:', !isLoudspeaker);
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
  container: { flex: 1, backgroundColor: 'black' },
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
