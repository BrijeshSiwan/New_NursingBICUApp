import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { RTCPeerConnection, mediaDevices, RTCView,RTCSessionDescription } from 'react-native-webrtc';
import firestore from '@react-native-firebase/firestore';

const servers = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], // STUN server
};


const CallBackupCode = ({ route, navigation }) => {
  const { hospitalId } = route.params;
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [callActive, setCallActive] = useState(false);

  useEffect(() => {
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (peerConnection) peerConnection.close();
    if (localStream) localStream.getTracks().forEach(track => track.stop());
    setPeerConnection(null);
    setLocalStream(null);
    setRemoteStream(null);
    setCallActive(false);
  };

  const startCall = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({ audio: true, video: true });
      setLocalStream(stream);

      const pc = new RTCPeerConnection(servers);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = event => setRemoteStream(event.streams[0]);
      pc.onicecandidate = event => {
        if (event.candidate) {
          firestore()
            .collection('calls')
            .doc(String(hospitalId))
            .collection('iceCandidates')
            .add(event.candidate.toJSON());
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      firestore().collection('calls').doc(String(hospitalId)).set({ offer });

      firestore()
        .collection('calls')
        .doc(String(hospitalId))
        .onSnapshot(snapshot => {
          const data = snapshot.data();
          if (data?.answer) {
            pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        });

      setPeerConnection(pc);
      setCallActive(true);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const endCall = async () => {
    cleanup();
    await firestore().collection('calls').doc(String(hospitalId)).delete();
  };

  return (
    <View style={styles.container}>
      {remoteStream && <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} />}
      {localStream && <RTCView streamURL={localStream.toURL()} style={styles.localVideo} />}
      <View style={styles.controls}>
        {!callActive ? (
          <TouchableOpacity style={styles.callButton} onPress={startCall}>
            <Text style={styles.buttonText}>Start Call</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
            <Text style={styles.buttonText}>End Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  remoteVideo: { flex: 1, width: '100%', backgroundColor: 'black' },
  localVideo: { width: 150, height: 150, position: 'absolute', top: 20, right: 20 },
  controls: { position: 'absolute', bottom: 20, flexDirection: 'row' },
  callButton: { padding: 15, backgroundColor: 'green', borderRadius: 50 },
  endCallButton: { padding: 15, backgroundColor: 'red', borderRadius: 50 },
  buttonText: { color: 'white', fontSize: 16 },
});

export default CallBackupCode;
