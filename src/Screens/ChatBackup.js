import React, { useState, useEffect } from "react";
import { View, Image, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GiftedChat, Send, Bubble, InputToolbar } from 'react-native-gifted-chat';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { useRoute } from "@react-navigation/native";
import { launchCamera } from 'react-native-image-picker';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import theme from "../assets/theme";
const { images } = theme;
import { getDataObject, getAuthToken } from "../Services/storage";
import * as FetchAPI from '../Services/fetchAPI';
import { sendNotification, getFCMNotification } from '../Services/APIManager';
import Loader from '../Components/Loader';


const ChatBackup = ({ navigation }) => {
    const [getMessages, setMessages] = useState([]);
    const [imageToSend, setImageToSend] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState(""); 
    const [getFCMUserToken, setFCMUserToken] = useState([]);
    const [uploading, setUploading] = useState(false);
    const route = useRoute();
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

    useEffect(() => {
        if (!route || !route.params || !route.params.hospitalId) {
            return;
        }

        const unsubscribe = firestore()
            .collection('chats')
            .doc(String(route.params.hospitalId))
            .collection('messages')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const allMessages = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        ...data,
                        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
                        _id: doc.id,
                    };
                });
                setMessages(allMessages);
            });

        return () => unsubscribe();
    }, [route]);

    const getFCMTokenFromAPI = async (auth_token) => {
        var getTokenAPIS = getFCMNotification + route.params.hospitalId + '/'
        FetchAPI.GetRequestwithauttoken(getTokenAPIS, auth_token, async (response) => {
            if (response.status === 200) {
                setFCMUserToken(response.fcm_token)
            } else {
                console.log('Error fetching FCM token')
            }
        })
    }

    const sendMessage = async (auth_token, message_text) => { 
        const params = { fcm_tokens: getFCMUserToken, body: message_text, title: `${firstName} ${lastName}`, hospital_id:route.params.hospitalId,message_type:'chat_msg' };
        FetchAPI.PostCommentRequest(sendNotification, auth_token, params, async (response) => {
            if (response.status === 200) {
                console.log('Message sent successfully', response)
            } else {
                console.log('Error sending message', response)
            }
        })
    }

    const openCamera = async () => {
        try {
            const cameraPermission = await check(PERMISSIONS.ANDROID.CAMERA);
            if (cameraPermission === RESULTS.GRANTED) {
                const result = await launchCamera({ mediaType: 'photo' });
                if (!result.didCancel) {
                    setImageToSend(result.assets[0].uri);
                }
            } else if (cameraPermission === RESULTS.DENIED) {
                const permissionResult = await request(PERMISSIONS.ANDROID.CAMERA);
                if (permissionResult === RESULTS.GRANTED) {
                    const result = await launchCamera({ mediaType: 'photo' });
                    if (!result.didCancel) {
                        setImageToSend(result.assets[0].uri);
                    }
                } else {
                    console.log('Camera permission denied by user.');
                }
            }
        } catch (error) {
            console.error('Error while opening camera:', error);
        }
    };

    const uploadImage = async (imageUri) => {
        try {
            setUploading(true);
            const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
            const reference = storage().ref(filename);
            await reference.putFile(imageUri);
            const url = await storage().ref(filename).getDownloadURL();
            setUploading(false);
            return url;
        } catch (error) {
            console.error('Error while uploading image:', error);
            setUploading(false);
            return null;
        }
    };

    const sendImageMessage = async () => {
        if (imageToSend) {
            const localImageUri = imageToSend;
            const newMessage = {
                _id: new Date().getTime().toString(),
               // text: '',
                createdAt: new Date(),
                user: {
                    _id: senderId,
                    name: `${firstName} ${lastName}`,
                },
                image: localImageUri,
                pending: true,
            };

            // Add message to Firestore with a pending status
            const messageRef = await firestore()
                .collection('chats')
                .doc(String(route.params.hospitalId))
                .collection('messages')
                .add({
                    ...newMessage,
                    receiverId: route.params.hospitalId,
                    createdAt: firestore.FieldValue.serverTimestamp(),
                });

            setMessages(previousMessages => GiftedChat.append(previousMessages, { ...newMessage, _id: messageRef.id }));

            const uploadedImageUrl = await uploadImage(localImageUri);
            if (uploadedImageUrl) {
                // Update the message with the image URL
                await firestore()
                    .collection('chats')
                    .doc(String(route.params.hospitalId))
                    .collection('messages')
                    .doc(messageRef.id)
                    .update({ image: uploadedImageUrl, pending: false })
                    .then(() => console.log('Image sent successfully'))
                    .catch(error => console.error('Error sending image:', error));

                getAuthToken("auth_token").then(res => {
                    sendMessage("Bearer " + res, '[Image]');
                });

                setMessages(previousMessages => {
                    return previousMessages.map(msg => {
                        if (msg._id === messageRef.id) {
                            return { ...msg, image: uploadedImageUrl, pending: false };
                        }
                        return msg;
                    });
                });
            }
            setImageToSend(null);
        }
    };

    const cancelImage = () => {
        setImageToSend(null);
    };

    const renderBubble = (props) => {
        return (
            <View style={{ marginStart: -35 }}>
                {props.position === 'left' && (
                    <Text style={{ fontWeight: 'normal', marginBottom: 5, fontSize: 12 }}>
                        {props.currentMessage.user_type}
                    </Text>
                )}
                <Bubble
                    {...props}
                    wrapperStyle={{
                        right: {
                            backgroundColor: 'orange',
                            marginBottom: 10
                        },
                        left: {
                            backgroundColor: '#EDF7F9',
                            marginBottom: 10
                        },
                    }}
                />
                {props.currentMessage.pending && (
                    <ActivityIndicator size="small" color="#0000ff" style={{ marginTop: 5 }} />
                )}
            </View>
        );
    };

    const onSend = async (messages = []) => {
        const newMessage = {
            ...messages[0],
            senderId: senderId,
            image: '',
            user_type: `${firstName} ${lastName}`,
            createdAt: new Date(),
            pending: false,
            seen: false,
            unread: false,
        };

        const messageRef = await firestore()
            .collection('chats')
            .doc(String(route.params.hospitalId))
            .collection('messages')
            .add({
                ...newMessage,
                receiverId: route.params.hospitalId,
                createdAt: firestore.FieldValue.serverTimestamp(),
            });

            getAuthToken("auth_token").then(res => {
                sendMessage("Bearer " + res, messages[0].text);  
            });

            // Update unread count for the hospital
            await firestore()
                .collection('chats')
                .doc(String(route.params.hospitalId))
                .update({
                    unreadCount: firestore.FieldValue.increment(1),
                });
        
        setMessages(previousMessages => GiftedChat.append(previousMessages, { ...newMessage, _id: messageRef.id }));
        //setMessages(previousMessages => GiftedChat.append(previousMessages, newMessage));
    };

    return (
        <SafeAreaView style={styles.mainContainer}>
            {uploading === true && <Loader visible></Loader>}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerContainer}>
                <Image source={images.back_arrow} style={{ width: 30, height: 35 }} />
                <Text style={styles.heading}>Chat</Text>
            </TouchableOpacity>
            <GiftedChat
                wrapInSafeArea={false}
                alwaysShowSend 
                renderSend={(props) => (
                    <View>
                   
                       {imageToSend === null? <View style={{ flexDirection: 'row', alignItems: 'center', height: 60 }}>
                            <TouchableOpacity onPress={openCamera}>
                                <Image source={images.icons_image} style={{ width: 24, height: 24, borderRadius: 4, marginRight: 5 }} />
                            </TouchableOpacity>
                            <Send {...props} containerStyle={{ justifyContent: 'center' }}>
                                <Image source={images.icons_send} style={{ width: 30, height: 30, marginRight: 5 }} />
                            </Send>
                        </View>:
                        <View style={{ }}>
                        </View>}

                    </View>
                )}
                messages={getMessages}
                onSend={onSend}
                user={{
                    _id: senderId,
                }}
                renderInputToolbar={(props) => (
                    <InputToolbar
                        {...props}
                        containerStyle={{ borderRadius: 5,  height:imageToSend === null?60:15 }}
                    />
                )}
                renderBubble={renderBubble}
            />
            {imageToSend && (
                <View style={styles.imagePreviewContainer}>
                    <View style={styles.imageButtons}>
                        <Image source={{ uri: imageToSend }} style={styles.imagePreview} />
                        <TouchableOpacity onPress={cancelImage} style={styles.cancelImageButton}>
                            <Image source={images.close_icon} style={{ width: 30, height: 30, marginRight: 5 }} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={sendImageMessage} style={styles.sendImageButton}>
                        <Image source={images.icons_send} style={{ width: 30, height: 30, marginRight: 5 }} />
                    </TouchableOpacity>
                </View>
            )}
            
        </SafeAreaView>
    );
};

export default ChatBackup;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    headerContainer: {
        height: 50,
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#EDF7F9',
        flexDirection: 'row'
    },
    heading: {
        marginLeft: 10,
        fontSize: 18,
        fontWeight: 'bold',
    },
    imagePreviewContainer: {
        backgroundColor: '#ffffff',
    },
    imagePreview: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginBottom: 10,
    },
    imageButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    sendImageButton: {
        paddingRight: 10,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    sendImageText: {
        color: 'white',
        fontWeight: 'bold',
    },
    cancelImageButton: {
        borderRadius: 20,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        position:'absolute',
        right:60
    },
    cancelImageText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loading: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -25,
        marginLeft: -25,
    },
});
