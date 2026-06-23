// Import React and Component
import React, { useState, useEffect } from 'react';
import {StyleSheet, View, Text, ScrollView, Image, TouchableOpacity,Keyboard, KeyboardAvoidingView, Platform, PermissionsAndroid,Alert,Linking} from 'react-native';
import Loader from '../Components/Loader';
import { Input, } from 'react-native-elements';
import theme from '../assets/theme';
const { images,font,colors } = theme;
import * as FetchAPI from '../Services/fetchAPI'
import { storeDataObject, storeAuthToken, setLocalLanguage} from '../Services/storage'
import { LoginApi } from '../Services/APIManager';
import NetInfo from '@react-native-community/netinfo';
import messaging from '@react-native-firebase/messaging';
import Icon from 'react-native-vector-icons/FontAwesome';
import { randomBytes } from 'react-native-randombytes';
import CryptoJS from 'crypto-js';
import Toast from 'react-native-toast-message';
import { Dropdown } from 'react-native-element-dropdown';
import i18n from '../locales/i18n';

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'हिन्दी', value: 'hi' },
  { label: 'Français', value: 'fr' },
  { label: 'Punjabi', value: 'pa' }
];

const LoginScreen = ({ navigation }) => {
  const [isloader, setLoader] = useState(false);
  const [getUserID, setUserID] = useState('');
  const [getUserPassword, setUserPassword] = useState('');
  const [getUserIDError, setUserIDError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [serverPublicKey, setServerPublicKey] = useState('bud8344icu123!@#97&03hjsbb#*&^%#');
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    i18n.changeLanguage(selectedLanguage); 
  }, [selectedLanguage]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ];
  
        const statuses = await Promise.all(
          permissions.map(permission => PermissionsAndroid.check(permission))
        );
  
        const anyDenied = statuses.some(status => !status);
  
        if (anyDenied) {
          const granted = await PermissionsAndroid.requestMultiple(permissions);
  
          console.log("Permission request results:", granted);
          
        } else {
          console.log("All permissions already granted.");
        }
      } catch (err) {
        console.warn("Error requesting permissions", err);
      }
    }else {
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (enabled) {
        console.log('Authorization status:', authStatus);
      } else {
        console.log('Notification permission denied');
      }
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const inputEmailItemHandler = (Email) => {
    setUserID(Email);
  };

  const inputPasswordItemHandler = (password) => {
    setUserPassword(password);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!isPasswordVisible);
  };

  const validateInputs = () => {
    let valid = true;
    if (getUserID.length === 0) {
      setUserIDError(i18n.t('username_is_required'));
      valid = false;
    } else {
      setUserIDError("");
    }
    if (getUserPassword.length === 0) {
      setPasswordError(i18n.t('password_is_required'));
      valid = false;
    } else {
      setPasswordError("");
    }
    return valid;
  };

  const padPKCS7 = (data) => {
    const blockSize = 16; // AES block size
    const paddingLength = blockSize - (data.length % blockSize);
    const padding = String.fromCharCode(paddingLength).repeat(paddingLength);
    return data + padding;
  };

  const generateIV = () => {
      return new Promise((resolve, reject) => {
          randomBytes(16, (err, bytes) => {
              if (err) reject(err);
              resolve(CryptoJS.enc.Hex.parse(bytes.toString('hex')));
          });
      });
  };

  const encryptMessage = async (data, secretKey) => {
    const iv = await generateIV();
    const message = JSON.stringify(data);
    const paddedMessage = padPKCS7(message);

    const key = CryptoJS.SHA256(secretKey);
    const encrypted = CryptoJS.AES.encrypt(paddedMessage, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.NoPadding
    });

      const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
      const ciphertextBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
      const ciphertextUrlSafe = ciphertextBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const finalOutput = `${ivBase64}.${ciphertextUrlSafe}`;
  
      return {
        iv: ivBase64,
        ciphertext: ciphertextUrlSafe
      };
  };

  const initiateLoginApi = async () => {
    if (!validateInputs()) return;
    setLoader(true);

    const userCredentials = {
      username: getUserID,
      password: getUserPassword
    };

    const { iv, ciphertext } = await encryptMessage(userCredentials, serverPublicKey);
    const token = await messaging().getToken();

    const paramss = {
      encrypted_json: ciphertext,
      fcm_token: token,
      iv: iv,
      lang: selectedLanguage
    };

    const params = { username: getUserID, password: getUserPassword, 'fcm_token': token };

    FetchAPI.PostRequestwithParams(LoginApi, paramss, async (response) => {
     // console.log('login response==',response);
      if (response.status === 200) {
        if(response.data.user.user_type === 'user'){
          Toast.show({type: 'success', text1: response.msg});
          await storeDataObject('user_Data', response.data);
          await storeAuthToken('auth_token', response.data.token.access);
          await storeAuthToken('refresh_token', response.data.token.refresh);
          navigation.navigate('IcuBedsScreen',{'hospital_id': String(response.data.user.hospital_id)});
          setLoader(false);
        }else{
          Toast.show({type: 'error', text1: i18n.t('please_enter_valid_id')});
          setLoader(false);
        }  
        }else if(response.status === 401){
          Toast.show({type: 'error', text1: response.msg});
            setLoader(false);
        }
        else {
          setLoader(false);
          Toast.show({type: 'error', text1: i18n.t('something_went_wrong')});
        }
    });
  }

  const renderItem = (item) => (
    <View style={styles.item}>
        <Text style={styles.itemText}>{item.label}</Text>
    </View>
  );

  return (
    <View style={styles.mainBody}>
      {isloader && <Loader visible />}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : null}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Image source={images.logo_img} style={styles.logoStyle} />
          <Text style={styles.headerText}>{i18n.t('nurse_modural')}</Text>
          <Text style={[styles.titleText,{marginTop: 20}]}>{i18n.t('select_language')}</Text>
          <Dropdown
            data={languageOptions}
            labelField="label"
            valueField="value"
            value={selectedLanguage}
            style={styles.dropdown}
            placeholder={i18n.t('select_language')}
            onChange={async (item) => {
              setSelectedLanguage(item.value);
              i18n.changeLanguage(item.value); 
              await setLocalLanguage('appLanguage', item.value);
            }}
            renderItem={renderItem}
            selectedTextStyle={styles.selectedText}
          />

          <Text style={styles.loginText}>{i18n.t('login')}</Text>

          <View style={styles.SectionStyle}>
            <Text style={styles.titleText}>{i18n.t('username')}</Text>
            <Input
              inputStyle={styles.inputTextStyl}
              value={getUserID}
              onChangeText={(text) => inputEmailItemHandler(text.replace(/\s/g, ''))}
              placeholder={i18n.t('enter_username')}
              numberOfLines={1}
              placeholderTextColor= {colors.grayColor}
              inputContainerStyle={styles.containerInputStyl}
              keyboardType="default"
              blurOnSubmit={true}
              returnKeyType="next"
              onSubmitEditing={Keyboard.dismiss}
            />
            {getUserIDError.length > 0 && <Text style={styles.errorText}>{getUserIDError}</Text>}
          </View>

          <View style={styles.SectionStyle}>
            <Text style={styles.titleText}>{i18n.t('password')}</Text>
            <Input
              inputStyle={styles.inputTextStyl}
              value={getUserPassword}
              onChangeText={(text) => inputPasswordItemHandler(text.replace(/\s/g, ''))}
              placeholder="***********"
              numberOfLines={1}
              placeholderTextColor={colors.grayColor}
              inputContainerStyle={styles.containerInputStyl}
              keyboardType="default"
              blurOnSubmit={true}
              secureTextEntry={!isPasswordVisible}
              rightIcon={
                <Icon
                  name={isPasswordVisible ? 'eye' : 'eye-slash'}
                  size={22}
                  color={colors.grayColor}
                  onPress={togglePasswordVisibility}
                />
              }
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            {passwordError.length > 0 && <Text style={styles.errorText}>{passwordError}</Text>}
          </View>

          {/* <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={{ fontSize: 12, color: colors.grayColor, marginTop: 5, textAlign: 'right', marginRight: 10, fontFamily: font.semiBold }}>Forgot password?</Text>
          </TouchableOpacity> */}

          <View style={{ flex: 1 }}></View>

          <TouchableOpacity style={styles.buttonStyle} activeOpacity={0.5} onPress={initiateLoginApi}>
            <Text style={styles.buttonTextStyle}>{i18n.t('login')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast  />
    </View>
  );
};
export default LoginScreen;

const styles = StyleSheet.create({
  mainBody: {
    flex: 1,
    backgroundColor: colors.backgroundScreen,
    padding: 20,
    justifyContent:'center',
  },
  logoStyle: {
    width: '55%',
    height: 40,
    resizeMode: 'contain',
    marginTop: 60,
    alignSelf: 'center'
  },
  headerText: {
    fontFamily: font.semiBold,
    fontSize: 12,
    color: colors.headingText,
    alignSelf: 'center',
    marginTop: 10
  },
  loginText: {
    fontFamily: font.semiBold,
    fontSize: 24,
    color: colors.grayColor,
    marginTop: 80,
    marginStart: 10,
    marginBottom: 10,
  },
  titleText: {
    fontSize: 14,
    color: colors.grayColorTwo,
    fontFamily: font.regular,
    marginBottom: 10,
    marginStart: 10,
    marginTop: -10,
  },
  SectionStyle: {
    flexDirection: 'column',
    marginTop: 20,
  },
  inputTextStyl: {
    color: colors.grayColor,
    textAlign: 'left',
    fontSize: 16,
    fontFamily: font.regular,
    backgroundColor: colors.white,
    paddingHorizontal:10
  },
  containerInputStyl: {
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    overflow: 'hidden',
    borderColor: colors.borderColor,
  },
  buttonStyle: {
    marginVertical: 20,
    width: '92%',
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: colors.orangeColor
  },
  buttonTextStyle: {
    color: colors.white,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: font.bold
  },
  inputStyle: {
    height: 50,
    color: '#ffffff',
    paddingLeft: 20,
    paddingRight: 20,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#ffffff',
    backgroundColor: '#ffffff',
    fontFamily: font.regular
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    fontFamily: font.regular,
    fontStyle: 'italic',
    fontWeight: '400',
    marginStart: 10,
    marginTop: -20
  },
  dropdown: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  item: {
    padding: 10, // Adjust padding as needed
},
itemText: {
    color: colors.grayColor, // Set your desired text color here
    backgroundColor: colors.white
},
selectedText: {
    color: '#000', // Change this to your desired selected text color
},
});
