import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text, ActivityIndicator, Platform, Linking } from 'react-native';
import { GiftedChat, Send, InputToolbar, Bubble,Avatar } from 'react-native-gifted-chat';
import { SafeAreaView } from "react-native-safe-area-context";
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import { getDataObject, getAuthToken } from "../Services/storage";
import { sendNotification, getFCMNotification } from '../Services/APIManager';
import * as FetchAPI from '../Services/fetchAPI';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import theme from "../assets/theme";
const { images } = theme;
import i18n from '../locales/i18n';

const ChatActivity = ({ route, navigation}) => {
  const { hospitalId } = route.params;
  const [messages, setMessages] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState(""); 
  const [getFCMUserToken, setFCMUserToken] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null); // Track selected file
  const [uploading, setUploading] = useState(false); // Track upload progress
  const [progress, setProgress] = useState(0); // Progress bar for uploads
  const [textInput, setTextInput] = useState(''); // Added missing state for text input

  const senderId = 'nurse1234';

  useEffect(() => {   
    getAuthToken("auth_token").then(res => {
      getFCMTokenFromAPI("Bearer " + res);  
    });

    getDataObject("user_Data").then(response => {
      setFirstName(response.user.first_name);
      setLastName(response.user.last_name);
    }).catch(error => {
      console.error('Error fetching user data:', error);
    });
  }, []);

  const requestCameraPermission = async () => {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;
  
    const result = await request(permission);
  
    if (result === RESULTS.GRANTED) {
      pickCamera();
    } else {
      console.log('Camera permission denied');
    }
  };

  const getFCMTokenFromAPI = async (auth_token) => {
    var getTokenAPIS = getFCMNotification + hospitalId + '/'
    FetchAPI.GetRequestwithauttoken(getTokenAPIS, auth_token, async (response) => {
      if (response.status === 200) {
        setFCMUserToken(response.fcm_token)
       // console.log('token=====',response.fcm_token)
      } else {
        console.log('Error fetching FCM token')
      }
    })
  };

  const sendMessage = async (auth_token, message_text) => { 
    const params = {fcm_tokens: getFCMUserToken,  body: message_text,  title: `${firstName} ${lastName}`,  hospital_id: hospitalId, message_type: 'chat_msg', document_id: '0', icu_id: ''};
    FetchAPI.PostCommentRequest(sendNotification, auth_token, params, async (response) => {
      if (response.status === 200) {
        console.log('Message sent successfully', response)
      } else {
        console.log('Error sending message', response)
      }
    })
  };

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('chats')
      .doc(String(hospitalId))
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const loadedMessages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            _id: doc.id,
            text: data.text || '',
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
            user: data.user,
            image: data.image || null,
            video: data.video || null,
            file: data.file || null,
            fileName: data.fileName || null, // Ensure file name is stored
            audio: data.audio || null,
            user_type: data.user_type,
          };
        });
        setMessages(loadedMessages);
      });

    return () => unsubscribe();
  }, [hospitalId]);

  const onSend = useCallback((messages = []) => {
    const message = messages[0];
    const messageData = {
      _id: message._id,
      text: message.text || null,
      createdAt: firestore.FieldValue.serverTimestamp(),
      user: message.user,
      image: selectedFile?.image || null,
      video: selectedFile?.video || null,
      file: selectedFile?.file || null,
      fileName: selectedFile?.fileName || null, // Add fileName to the message data
      audio: selectedFile?.audio || null,
      user_type: `${firstName} ${lastName}` || 'default',
      seen: false,
      unread: false,
    };

    // Allow sending just a file without text
    if (selectedFile || message.text) {
      if (selectedFile) {
        handleFileUpload(selectedFile, messageData);
      } else {
        // Add text message to Firestore
        firestore()
          .collection('chats')
          .doc(String(hospitalId))
          .collection('messages')
          .add(messageData);

          // Update unread count for the hospital
        firestore()
          .collection('chats')
          .doc(String(route.params.hospitalId))
          .update({
              unreadCount: firestore.FieldValue.increment(1),
          });

        // Send FCM notification if it's a text message
        if (message.text) {
          getAuthToken("auth_token").then(res => {
            sendMessage("Bearer " + res, message.text);  
          });
        }
      }
    }

    setSelectedFile(null); // Reset after sending
    setTextInput(''); // Reset text input
  }, [hospitalId, firstName, lastName, selectedFile,getFCMUserToken]);

  const handleFileUpload = async (file, messageData) => {
    setUploading(true);
    const storageRef = storage().ref(file.path);
    const uploadTask = storageRef.putFile(file.uri);
  
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progress);
      },
      (error) => {
        console.error('Error uploading file:', error);
        setUploading(false);
      },
      async () => {
        // Get the download URL once upload is complete
        const downloadUrl = await storageRef.getDownloadURL();
  
        // Update the messageData object based on the file type
        if (file.type === 'image') {
          messageData.image = downloadUrl;
        } else if (file.type === 'video') {
          messageData.video = downloadUrl;
        } else {
          messageData.file = downloadUrl;
          messageData.fileName = file.fileName;
        }
  
        // Add the message to Firestore after the file is uploaded
        firestore()
          .collection('chats')
          .doc(String(hospitalId))
          .collection('messages')
          .add(messageData);
  
        setUploading(false);
        setProgress(0);
      }
    );
  };

  const user = {
    _id: senderId,
    name: `${firstName} ${lastName}`,
  };

  const pickImage = async () => {
    launchImageLibrary({ mediaType: 'photo' }, async (response) => {
      if (response.didCancel || response.errorCode) return;

      const { uri, fileName } = response.assets[0];
      setSelectedFile({ uri, path: `images/${fileName}`, type: 'image' });
    });
  };

  const pickCamera = async () => {
    launchCamera({ mediaType: 'photo' }, async (response) => {
      if (response.didCancel || response.errorCode) return;
  
      const { uri, fileName } = response.assets[0];
      setSelectedFile({ uri, path: `images/${fileName}`, type: 'image' });
    });
  };

  const pickVideo = async () => {
    launchImageLibrary({ mediaType: 'video' }, async response => {
      if (!response.didCancel && !response.errorCode) {
        const { uri, fileName } = response.assets[0];
        setSelectedFile({ uri, path: `videos/${fileName}`, type: 'video' });
      }
    });
  };

  const renderUploadProgress = () => {
    return uploading ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
        <ActivityIndicator size="small" color="#075E54" />
        <Text style={{ marginLeft: 10 }}>
          Uploading {Math.floor(progress)}%
        </Text>
      </View>
    ) : null;
  };

  const renderSend = (props) => {
    return (
      <Send {...props}>
        <View style={styles.sendingContainer}>
          <Icon name="send" size={28} color="#075E54" />
        </View>
      </Send>
    );
  };

  const renderBubble = (props) => {
    const isSameUser = (currentMessage, previousMessage) => {
      return (
        previousMessage &&
        previousMessage.user &&
        currentMessage.user &&
        previousMessage.user._id === currentMessage.user._id
      );
    };
  
    const previousMessage = props.previousMessage;
    const showUserType = !isSameUser(props.currentMessage, previousMessage);
  
    return (
      <View >
        {/* Show the user_type only if it's the first message in the group */}
        {props.position === 'left' && showUserType && (
          <Text style={{ fontWeight: '600',  fontSize: 12, color: '#075E54' }}>
            {props.currentMessage.user_type}
          </Text>
        )}
        <Bubble
          {...props}
          wrapperStyle={{
            right: {
              backgroundColor: '#075E54',
            },
            left: {
              backgroundColor: '#ffffff',
            },
          }}
          textStyle={{
            right: {
              color: '#fff',
            },
            left: {
              color: '#000',
            },
          }}
        />
      </View>
    );
  };
  
  

  // Render the file with an enhanced UI similar to WhatsApp
  const renderFileMessage = (props) => {
    if (props.currentMessage.file) {
      return (
        <TouchableOpacity
          onPress={() => Linking.openURL(props.currentMessage.file)}
          style={{ marginTop: 5, padding: 5, backgroundColor: '#f1f1f1', borderRadius: 10, paddingHorizontal: 15 }}
        >
          <Text style={{ color: '#075E54', fontWeight: 'bold' }}>
            {props.currentMessage.fileName || 'Download File'}
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderPendingMessage = () => {
    if (selectedFile) {
      return (
        <View style={styles.pendingMessage}>
          {selectedFile.type === 'image' && (
            <Image source={{ uri: selectedFile.uri }} style={{ width: 150, height: 100 }} />
          )}
          {selectedFile.type === 'video' && (
            <Video source={{ uri: selectedFile.uri }} style={{ width: 150, height: 100 }} paused={true} />
          )}
          {selectedFile.type === 'file' && (
            <Text>{selectedFile.fileName}</Text>
          )}
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
        <View style ={{flexDirection:'row', justifyContent:'space-between',backgroundColor: '#EDF7F9',}}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerContainer}>
            <Image source={images.back_arrow} style={{ width: 30, height: 35 }} />
            {renderUploadProgress()}
            <Text style={{fontWeight:'600'}}>{i18n.t('chat')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.videoCallButton}
          onPress={() => navigation.navigate('VideoCallScreen',{'roomId':hospitalId,'userName':firstName+' '+lastName})}
        >
          <Icon name="video-call" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <GiftedChat
        wrapInSafeArea={false}
        alwaysShowSend 
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={user}
        onInputTextChanged={(text) => setTextInput(text)} // Properly set input text
        renderInputToolbar={(props) => (
          <InputToolbar {...props} 
          containerStyle={styles.inputToolbar} 
          primaryStyle={{ alignItems: 'center' }}
          textInputProps={{
            style: {backgroundColor: '#fff', color: '#333', fontSize: 16, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', flex: 1},
            placeholderTextColor: '#999', // Set placeholder text color
          }}
          />
        )}
        renderSend={renderSend}
        renderBubble={renderBubble}
        renderMessageVideo={(props) => (
          <Video
            {...props}
            source={{ uri: props.currentMessage.video }}
            style={{ width: 240, height: 180 }}
            paused={true}  // Ensure video is not paused when rendered
            controls
            fullscreen={false}  // Enable fullscreen mode
            resizeMode="contain"  // Adjust the video to fit within the container
            onFullscreenPlayerWillPresent={() => console.log('Entering fullscreen')}
            onFullscreenPlayerDidDismiss={() => console.log('Exited fullscreen')}
          />
        )}
        renderCustomView={renderFileMessage} // Render file messages with clickable download
        renderChatFooter={renderPendingMessage}
        renderAvatar={null}
      />

      <View style={styles.actionContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.iconStyle}>
          <Icon name="image" size={28} color="#075E54" />
        </TouchableOpacity>
        <TouchableOpacity onPress={pickVideo} style={styles.iconStyle}>
          <Icon name="videocam" size={28} color="#075E54" />
        </TouchableOpacity>
        <TouchableOpacity onPress={ Platform.OS === 'ios'?pickCamera:requestCameraPermission }  style={styles.iconStyle}>
          <Icon name="camera-alt" size={28} color="#075E54" />
        </TouchableOpacity>
      </View>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  progressContainer: {marginVertical: 10, padding: 10},
  headerContainer: {height: 50, alignItems: 'center', padding: 10, backgroundColor: '#EDF7F9', flexDirection: 'row'},
  sendingContainer: {justifyContent: 'center', alignItems: 'center', marginRight: 10, marginBottom: 5},
  inputToolbar: {borderTopWidth: 1.5, borderTopColor: '#eee', backgroundColor: '#f9f9f9', paddingVertical: 4, paddingHorizontal: 10},
  actionContainer: {flexDirection: 'row', justifyContent: 'space-around', padding: 10},
  iconStyle: {padding: 10},
  pendingMessage: {padding: 10, backgroundColor: '#f8f8f8', borderRadius: 10, marginBottom: 10},
  videoCallButton: {position: 'absolute', bottom: 5, right: 20, backgroundColor: 'blue', borderRadius: 50, padding: 10},
});

export default ChatActivity;
