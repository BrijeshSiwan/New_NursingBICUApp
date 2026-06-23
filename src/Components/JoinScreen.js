import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, Button, View } from 'react-native';

import { RTCPeerConnection, RTCView, mediaDevices, RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import firestore from '@react-native-firebase/firestore';

const configuration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function JoinScreen({ setScreen, screens, roomId }) {

  function onBackPress() {
    if (cachedLocalPC) {
      // Ensure we only remove tracks that belong to this peer connection
      localStream.getTracks().forEach(track => {
        const sender = cachedLocalPC.getSenders().find(sender => sender.track === track);
        if (sender) {
          cachedLocalPC.removeTrack(sender); // Remove the sender associated with the track
        }
      });
  
      // Close the peer connection
      cachedLocalPC.close();
    }
  
    // Clean up the streams and peer connection state
    setLocalStream(null);
    setRemoteStream(null);
    setCachedLocalPC(null);
  
    // Navigate back to the ROOM screen
    setScreen(screens.ROOM);
  }
  

  const [localStream, setLocalStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [cachedLocalPC, setCachedLocalPC] = useState();

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // startLocalStream();
  }, []);

  const startLocalStream = async () => {
    // isFront will determine if the initial camera should face user or environment
    const isFront = true;
    const devices = await mediaDevices.enumerateDevices();

    const facing = isFront ? 'front' : 'environment';
    const videoSourceId = devices.find(device => device.kind === 'videoinput' && device.facing === facing);
    const facingMode = isFront ? 'user' : 'environment';
    const constraints = {
      audio: true,
      video: {
        mandatory: {
          minWidth: 500, // Provide your own width, height and frame rate here
          minHeight: 300,
          minFrameRate: 30,
        },
        facingMode,
        optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
      },
    };
    const newStream = await mediaDevices.getUserMedia(constraints);
    setLocalStream(newStream);
  };

  const joinCall = async id => {
    const roomRef = firestore().collection('call').doc(id);
    const roomSnapshot = await roomRef.get();
  
    if (!roomSnapshot.exists) return;
    
    const localPC = new RTCPeerConnection(configuration);
  
    // Add tracks to the peer connection instead of using addStream
    localStream.getTracks().forEach(track => localPC.addTrack(track, localStream));
  
    const calleeCandidatesCollection = roomRef.collection('calleeCandidates');
    localPC.onicecandidate = e => {
      if (!e.candidate) {
        console.log('Got final candidate!');
        return;
      }
      calleeCandidatesCollection.add(e.candidate.toJSON());
    };
  
    // Use the ontrack event to handle remote streams
    localPC.ontrack = e => {
      if (e.streams[0] && remoteStream !== e.streams[0]) {
        console.log('RemotePC received the stream join', e.streams[0]);
        setRemoteStream(e.streams[0]);
      }
    };
  
    const offer = roomSnapshot.data().offer;
    await localPC.setRemoteDescription(new RTCSessionDescription(offer));
  
    const answer = await localPC.createAnswer();
    await localPC.setLocalDescription(answer);
  
    const roomWithAnswer = { answer };
    await roomRef.update(roomWithAnswer);
  
    roomRef.collection('callerCandidates').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          let data = change.doc.data();
          await localPC.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  
    setCachedLocalPC(localPC);
  };
  

  const switchCamera = () => {
    localStream.getVideoTracks().forEach(track => track._switchCamera());
  };

  // Mutes the local's outgoing audio
  const toggleMute = () => {
    if (!remoteStream) {
      return;
    }
    localStream.getAudioTracks().forEach(track => {
      // console.log(track.enabled ? 'muting' : 'unmuting', ' local track', track);
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    });
  };


  return (
    <>
      <Text style={styles.heading} >Join Screen</Text>
      <Text style={styles.heading} >Room : {roomId}</Text>

      <View style={styles.callButtons} >
        <View styles={styles.buttonContainer} >
          <Button title="Click to stop call" onPress={onBackPress} />
        </View>
        <View styles={styles.buttonContainer} >
          {!localStream && <Button title='Click to start stream' onPress={startLocalStream} />}
          {localStream && <Button title='Click to join call' onPress={() => joinCall(roomId)} disabled={!!remoteStream} />}
        </View>
      </View>

      {localStream && (
        <View style={styles.toggleButtons}>
          <Button title='Switch camera' onPress={switchCamera} />
          <Button title={`${isMuted ? 'Unmute' : 'Mute'} stream`} onPress={toggleMute} disabled={!remoteStream} />
        </View>
      )}

      <View style={{ display: 'flex', flex: 1, padding: 10 }} >
        <View style={styles.rtcview}>
          {localStream && <RTCView style={styles.rtc} streamURL={localStream && localStream.toURL()} />}
        </View>
        <View style={styles.rtcview}>
          {remoteStream && <RTCView style={styles.rtc} streamURL={remoteStream && remoteStream.toURL()} />}
        </View>
      </View>

    </>
  )
}

const styles = StyleSheet.create({
  heading: {
    alignSelf: 'center',
    fontSize: 30,
  },
  rtcview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    margin: 5,
  },
  rtc: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  toggleButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  callButtons: {
    padding: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  buttonContainer: {
    margin: 5,
  }
});
