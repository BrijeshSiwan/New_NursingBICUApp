import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, FlatList, AppState, Alert, Linking,TouchableOpacity,Platform } from "react-native";
import Loader from '../Components/Loader';
import * as FetchAPI from '../Services/fetchAPI'
import { getAuthToken, getDataObject,removeDataValue } from "../Services/storage";
import { GetICUByHospital, checkAppUpdateVersion } from '../Services/APIManager';
import theme from '../assets/theme';
const { colors, images, font } = theme;
import Modal from "react-native-modal";


const ChooseYourICUName = ({ navigation }) => {
  const [isloader, setLoader] = useState(false)
  const [getName, setName] = useState('');
  const [getIcuName, setIcuName] = useState('');
  const [getHospitalId, setHospitalId] = useState('');
  const [getICUListData, setICUListData] = useState([]);
  const [getUpdateUrl, setUpdateUrl] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [getUnreadCount, setUnreadCount] = useState('');

  const currentAppVersion = '2';

  var hospitalId = ""
  useEffect(() => {
    getDataObject("user_Data").then(response => {
      hospitalId = response.user.hospital_id
      setHospitalId(response.user.hospital_id)
      setName(response.user.first_name + ' ' + response.user.last_name);
    });


    getAuthToken("auth_token").then(res => {
      getListOfICUData("Bearer " + res)
      checkForUpdates("Bearer " + res);
    });

  }, []);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const checkForUpdates = async (auth_token) => {
    setLoader(true);
    FetchAPI.GetRequestwithauttoken(checkAppUpdateVersion, auth_token, async (response) => {
      if (response.status == 200) {
        try {
          setUpdateUrl(response.data.update_url)
          if (response.data.version !== currentAppVersion) {
            showAlertForUpdate();
          }
          setLoader(false);
        } catch (e) {
          console.log(e);
          setLoader(false);
        }
      } else {

      }

    });
  };

  const showAlertForUpdate = () => {
    Alert.alert(
      'Update Available',
      'A new version of the app is available. Please update to the latest version.',
      [
        {
          //  text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: () => {
            Linking.openURL(getUpdateUrl);
          },
        },
      ],
      { cancelable: false }
    );
  };


  // call list of IcU api
  const getListOfICUData = async (auth_token) => {
    setLoader(true)
    FetchAPI.GetRequestwithauttoken(GetICUByHospital + hospitalId + '/', auth_token, async (response) => {
      console.log("ICU data", response)
      try {
        setICUListData(response.data.icus);
        const bedsdata = response.data.icus;
        for (let i = 0; i < bedsdata.length; i++) {
          if (bedsdata[i] != null) {
            setIcuName(bedsdata[i].name);
          }
        };
        setLoader(false)
      } catch (e) {
        console.log(e);
        setLoader(false)
      }
    })
  };

  const renderICUListData = ({ item }) => {
    return (
      <View style={styles.icuItemContainer}>
        <View style={styles.icuItemsStyle}>
          <TouchableOpacity onPress={() => {
            navigation.navigate('ChooseYourBedName', { "icuID": item.icu_id, 'hospitalId': item.hospital });
          }}>
            <Text style={styles.icuTextStyle}>{item.name}</Text>
            {item?.occupied_bed_count !== undefined && (<Text style={styles.icuText}>{`${item.occupied_bed_count} Beds Active`}</Text>)}
            <View style={styles.notifyIndicator}>
              <Image source={images.red_dot} style={{ width: 8, height: 8, paddingEnd: 8 }} />
              <Text style={styles.vitalsText}>{ item.vital_count+' Vitals Notification'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const onLogout = () => {
    removeDataValue();
    navigation.navigate('Auth');
  };

  const onCall = () => {
    let phoneNumber = '';
    if (Platform.OS === 'android') {
      phoneNumber = 'tel:9988005499';
    } else {
      phoneNumber = 'telprompt:9988005499';
    }
    Linking.openURL(phoneNumber);
  };


  return (
    <View style={styles.mainContainer}>
      {isloader === true && <Loader visible></Loader>}
      <View style={styles.headerViewStyle}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerText}>{getName}</Text>
          <Text style={styles.icuText}>{getIcuName}</Text>
        </View>

        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
          <TouchableOpacity onPress={() => { navigation.navigate('NotificationList', { 'hospitalId': getHospitalId }) }} style={{ flexDirection: 'row' }}>
            <Image source={images.bell_icon} style={{ width: 35, height: 35, }} />
            {getUnreadCount && (<Text style={styles.notifyCount} >{getUnreadCount}</Text>)}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleModal}>
            <Image source={images.LogOut_image} style={{ width: 30, height: 30 }} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.subContainerView}>
        <Text style={styles.selectHeaderText}>{'Select an ICU to view'}</Text>

        <FlatList
          data={getICUListData}
          renderItem={renderICUListData}
          numColumns={3}
          keyExtractor={(item) => item.icu_id.toString()}
        />
      </View>

      <TouchableOpacity onPress={() => {
        navigation.navigate('ChatActivity', { 'hospitalId': getHospitalId })
      }}
        style={styles.floatingButton}>
        <Image source={images.chat_icon} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onCall()} style={styles.contactUS}>
        <Image source={images.contact_us_icon} style={{ width: 22, height: 22, resizeMode: 'contain' }} />
        <Text style={{ color: colors.orangeColor, fontSize: 16, fontFamily: font.semiBold }}>{' Contact Us'}</Text>
      </TouchableOpacity>

      <Modal isVisible={isModalVisible} onBackdropPress={toggleModal} style={styles.bottomModal}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>See you Soon!</Text>
          <Text style={styles.modalTitle}>Are you sure you want to Logout?</Text>
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity onPress={toggleModal} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onLogout()} style={styles.sendButton}>
              <Text style={styles.sendButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  )
};

export default ChooseYourICUName;


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.backgroundScreen,
  },
  headerViewStyle: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    elevation: 4, // Android shadow
    backgroundColor: colors.backgroundScreen, // Ensure the background color matches the screen
    padding:10
  },
  headerText: {
    fontFamily: font.semiBold,
    fontSize: 16,
    color: colors.grayColor,
  },
  notifyCount: {
    width: 22,
    height: 22,
    backgroundColor: 'red',
    borderWidth: 1,
    justifyContent: 'center',
    textAlign: 'center',
    borderColor: colors.borderColor,
    borderRadius: 11,
    padding: 4,
    fontSize: 10,
    marginLeft: -16,
    fontFamily: font.bold,
    color: colors.white,
    overflow: 'hidden',
    marginBottom: 8,
  },
  icuText: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.midiumGrayy,
  },
  icuItemContainer: {
    flex: 1,
    maxWidth: '50%', // Ensure each item takes up half the screen width
    padding: 8,
  },
  icuItemsStyle: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 8,
    padding: 15,
    flex: 1,
  },
  icuTextStyle: {
    color: colors.grayColor,
    fontSize: 16,
    fontFamily: font.semiBold,
  },
  vitalsText: {
    fontSize: 8,
    fontFamily: font.regular,
    color: colors.grayColorTwo,
  },
  selectHeaderText: {
    fontFamily: font.medium,
    fontSize: 16,
    color: colors.grayColorTwo,
    paddingStart: 5,
    paddingBottom: 5,
  },
  subContainerView: {
    padding: 15,
    flex: 1,
  },
  notifyIndicator: {
    backgroundColor: colors.lightRedColor,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 5,
  },
  contactUS: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  floatingButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2C8170',
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 4 }, // iOS shadow
    shadowOpacity: 0.5, // iOS shadow
  },
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: colors.backgroundScreen,
    padding: 20,
    justifyContent: 'center',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: font.bold,
    marginBottom: 10,
    alignSelf: 'center'
  },
  cancelButton: {
    marginTop: 10,
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.borderColor,
    marginRight: 10,
  },
  sendButton: {
    marginTop: 10,
    backgroundColor: colors.orangeColor,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: font.semiBold,
    color: colors.orangeColor,
    textAlign: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontFamily: font.semiBold,
    color: colors.white,
    textAlign: 'center',
  },
});
