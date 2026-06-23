import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';

const FloatingCallView = ({ remoteStream, onExpand }) => (
  <TouchableOpacity style={styles.floatingContainer} onPress={onExpand}>
    {remoteStream && (
      <RTCView style={styles.floatingStream} streamURL={remoteStream.toURL()} objectFit="cover" />
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 10,
    backgroundColor: 'black',
    zIndex: 100,
  },
  floatingStream: {
    width: 100,
    height: 150,
    borderRadius: 10,
  },
});

export default FloatingCallView;