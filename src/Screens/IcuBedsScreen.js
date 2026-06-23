import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Image, FlatList, RefreshControl, Linking, Platform, Alert } from "react-native";
import Loader from '../Components/Loader';
import theme from '../assets/theme';
import VitalsAlerts from "../Components/VitalsAlerts";
const { colors, images, font } = theme;
import * as FetchAPI from '../Services/fetchAPI'
import { GetICUByHospital, GetBedByICU, NotificationListApi, logoutApi, getFCMNotification } from '../Services/APIManager';
import { getAuthToken, getDataObject, removeDataValue } from "../Services/storage";
import Modal from "react-native-modal";
import { format, parseISO } from 'date-fns';
import { Provider } from "react-native-paper";
import Popover from 'react-native-popover-view';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import AssignPatientModal from "../Components/AssignPatientModal";
import i18n from '../locales/i18n';

const dischargeOptions = ['discharge', 'refer_patient', 'lama', 'demise', 'shifted'];

const IcuBedsScreen = ({ route, navigation }) => {
  const [isloader, setLoader] = useState(false);
  const [getName, setName] = useState('');
  const [getIcuName, setIcuName] = useState('');
  const [getHospitalId, setHospitalId] = useState('');
  const [getBedNumber, setBedNumber] = useState('');
  const [getBed_id, setBed_id] = useState('');
  const [getIcuId, setIcuId] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isModalAssignVisible, setModalAssignVisible] = useState(false);
  const [getICUListData, setICUListData] = useState([]);
  const [getICUBedData, setICUBedData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isVitalsVisible, setVitalsVisible] = useState(false);
  const [getVitalTitle, setVitalsTitle] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedItem, setSelectedItem] = useState(null);
  const [getFCMUserToken, setFCMUserToken] = useState([]);
  const [getCount, setCount] = useState('');

  const touchableRefs = useRef([]);

  const reminderTitle = route.params?.reminderTitle ?? '';
  useEffect(() => {
    if (reminderTitle !== '') {
      setVitalsVisible(true);
      setVitalsTitle(reminderTitle);
    } else {
      setVitalsVisible(false);
      setVitalsTitle('');  // Reset the title if empty
    }
  }, [reminderTitle]);

  useEffect(() => {
    getDataObject("user_Data").then(response => {
      if (response?.user) {
        setHospitalId(String(response.user.hospital_id));
        setName(response.user.first_name + ' ' + response.user.last_name);
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchICUData = async () => {
        try {
          const token = await getAuthToken("auth_token");
          if (isActive && getHospitalId) {
            setLoader(true);
            // call list of IcU api
            FetchAPI.GetRequestwithauttoken(GetICUByHospital + getHospitalId + '/', "Bearer " + token, async (response) => {
              if (response?.status === 200) {
                const icus = response.data.icus || [];
                setICUListData(icus);
                getFCMTokenFromAPI("Bearer " + token, getHospitalId);
                if (icus.length > 0) {
                  const firstICU = icus[0];
                  setIcuName(firstICU.name);
                  setIcuId(firstICU.icu_id);
                  await getBedDataByICU("Bearer " + token, firstICU.icu_id);
                }
              }
            })
          }
        } catch (err) {
          console.error('Error in ICU fetch:', err);
        } finally {
          if (isActive) setLoader(false);
        }
      };

      fetchICUData();

      return () => {
        isActive = false;
      };
    }, [getHospitalId])
  );


  const vitalsAlertModal = () => setVitalsVisible(!isVitalsVisible);
  const toggleModal = () => setModalVisible(!isModalVisible);
  const toggleAssignModal = () => setModalAssignVisible(!isModalAssignVisible);
  const toggleVisibility = () => setIsVisible(!isVisible);

  const onLogout = () => {
    Promise.all([getAuthToken("auth_token"), getAuthToken("refresh_token")])
      .then(([auth_token, refresh_token]) => {
        callLogoutApi(`Bearer ${auth_token}`, refresh_token);
      })
      .catch(error => {
        console.error("Error fetching tokens:", error);
      });
  };

  //call logout Api
  const callLogoutApi = async (auth_token, refresh_token) => {
    setLoader(true)
    const params = { refresh_token: refresh_token };
    FetchAPI.PostCommentRequest(logoutApi, auth_token, params, async (response) => {
      setLoader(false)
      console.log('logout', response);
      if (response.status === 200) {
        removeDataValue();
        navigation.navigate('Auth');
        Toast.show({ type: 'success', text1: response.msg });
      } else {
        Toast.show({ type: 'error', text1: i18n.t('something_went_wrong') });
      }
    })
  };


  // call list of Beds api
  const getBedDataByICU = async (auth_token, icu_id) => {
    try {
      setLoader(true);
      FetchAPI.GetRequestwithauttoken(GetBedByICU + icu_id + '/', auth_token, async (response) => {
        if (response?.status === 200) {
          setICUBedData(response.data.beds || []);
          getICUNotificationsData(auth_token);
        } else {
          Toast.show({ type: 'error', text1: i18n.t('something_went_wrong') });
        }
      })
    } catch (err) {
      console.error('Error in Bed fetch:', err);
    } finally {
      setLoader(false);
    }
  };

  //get fcm token for notification
  const getFCMTokenFromAPI = async (auth_token, hospital_id) => {
    var getTokenAPIS = getFCMNotification + hospital_id + '/'
    FetchAPI.GetRequestwithauttoken(getTokenAPIS, auth_token, async (response) => {
      if (response.status === 200) {
        setFCMUserToken(response.fcm_token)
      } else {
        console.log('Error fetching FCM token')
      }
    })
  };

  //get notification list data
  const getICUNotificationsData = async (auth_token) => {
    FetchAPI.GetRequestwithauttoken(NotificationListApi, auth_token, async (response) => {
      if (response.status === 200) {
        const notifications = response.data.notifications || [];
        if (notifications.length > 0) setCount(notifications.length);
      } else {
        Toast.show({ type: 'error', text1: i18n.t('something_went_wrong') });
      }
    });
  };

  // render icu list
  const renderICUListData = ({ item }) => {
    return (
      <TouchableOpacity >
        <Text style={styles.icuTextStyle}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const openMenu = (item, index) => {
    setSelectedItem(item);
    touchableRefs.current[index].measure((fx, fy, width, height, px, py) => {
      setMenuPosition({ x: px, y: py });
      setMenuVisible(true);
    });
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedItem(null);
  };

  // render bed list
  const renderBedData = ({ item, index }) => {
    return (
      <View style={styles.bedItemContainer}>
        {isloader && <Loader visible></Loader>}
        <View style={styles.headerBedView}>
          <Text style={{ color: colors.textColor, fontSize: 12, lineHeight: 19, fontFamily: font.regular }}>{i18n.t('bed') + item.bed_number}</Text>

          {(item.is_occupied === true) && (<TouchableOpacity
            ref={(ref) => (touchableRefs.current[index] = ref)}
            onPress={() => openMenu(item, index)}
          >
            <Image source={images.menu_icon} style={{ width: 20, height: 20, paddingEnd: 8 }} />
          </TouchableOpacity>)}
        </View>

        {(item.patient !== null) &&
          <View style={{ width: '100%', paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.patientNameText} >{item.patient ? item.patient.full_name : ''}</Text>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={toggleVisibility}>
              <Text style={styles.detailsTextStyl} >{i18n.t('view_details')}</Text>
              <Image source={images.drop_down_icon} style={{ width: 20, height: 20, paddingEnd: 8 }} />
            </TouchableOpacity>
          </View>}

        {isVisible && (item.patient !== null) && (<View style={{ width: '100%', paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.patientDetailsText} >{item.patient ? i18n.t('gender') + item.patient.gender : null}</Text>
          <Text style={styles.patientDetailsText} >{item.patient ? i18n.t('uhid') + item.patient?.patient_id : null}</Text>
        </View>)}

        {isVisible && (item.patient !== null) && (<View style={{ width: '100%', paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.patientDetailsText} >{item.patient ? i18n.t('age') + item.patient?.age : null}</Text>
          <Text style={styles.patientDetailsText} >{item.patient ? i18n.t('admission_date') + format(parseISO(item.patient?.date_of_admitions), 'dd MMMM yyyy') : null}</Text>
        </View>)}

        {(item.is_occupied === true) &&
          <View style={{ flex: 1, borderColor: colors.borderColor, padding: 10 }}>

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => navigation.navigate('CriticalCareChartView', { "patientID": item.patient.id })} style={styles.patientFileView}>
                <Text style={{ color: colors.grayColor, fontFamily: font.regular, fontSize: 12, width: '88%' }}>{i18n.t('vitals_chart')}</Text>
                <Image source={images.file_icon} style={{ width: 25, height: 25, paddingEnd: 8 }} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { navigation.navigate('CriticalCareMonitoring', { "patientDetails": item.patient, 'bedNumber': item.bed_number }) }} style={styles.addPatientFile} >
                <Text style={{ color: colors.white, fontFamily: font.semiBold, fontSize: 12, }}>{i18n.t('add')}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 15, width: '100%' }}>
              <TouchableOpacity onPress={() => navigation.navigate('PatientDocumentsList', { "patientDetails": item.patient, 'bedNumber': item.bed_number, 'icuID': item.icu.icu_id })} style={[styles.patientFileView, { width: '50%' }]} >
                <Text style={{ color: colors.grayColor, fontFamily: font.regular, fontSize: 12, width: '88%' }}>{i18n.t('patient_file_lab')}</Text>
                <Image source={images.file_icon} style={{ width: 25, height: 25, }} />
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', width: '50%' }}>
                <TouchableOpacity onPress={() => navigation.navigate('AddNewDocuments', {
                  'patientID': item.patient.id, 'bedNumber': item.bed_number, 'icuID': item.icu.icu_id, 'full_name': item.patient.full_name
                })} style={[styles.addPatientFile, { width: '40%', }]} >
                  <Text style={{ color: colors.white, fontFamily: font.semiBold, fontSize: 12, }}>{i18n.t('file')}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('AddLabReport', {
                  'patientID': item.patient.id, 'bedNumber': item.bed_number, 'icuID': item.icu.icu_id, 'full_name': item.patient.full_name
                })} style={[styles.addPatientFile, { width: '56%', }]} >
                  <Text style={{ color: colors.white, fontFamily: font.semiBold, fontSize: 12, }}>{i18n.t('lab_report')}</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>}


        <View style={styles.vacantContainer}>
          {item.patient === null ? (
            <Text style={styles.vacantBedStyl}>{i18n.t('vacant_bed')}</Text>
          ) : (
            !item.patient.is_approved || item.patient.color_code === 3 ? (
              <Text style={styles.pendingBedStyl}>{item.patient.notification_title}</Text>
            ) : null
          )}

          {(item.patient === null) && <TouchableOpacity onPress={() => { setBedNumber(item.bed_number); setBed_id(item.bed_id); setModalAssignVisible(true); }}
            style={styles.assignPatientButton}>
            <Text style={{ color: colors.orangeColor, fontSize: 12, fontFamily: font.bold }}>{i18n.t('add_patient')}</Text>
          </TouchableOpacity>}
        </View>
      </View>
    );
  };


  const onRefresh = async () => {
    setRefreshing(true);
    const token = await getAuthToken("auth_token");
    await getBedDataByICU("Bearer " + token, getIcuId);
    setRefreshing(false);
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
    <SafeAreaView style={styles.container}>
      <View style={styles.headerViewStyle}>
        <View style={{}}>
          <Text style={styles.headerText}>{getName}</Text>
          <Text style={styles.icuText}>{getIcuName}</Text>
        </View>

        <View style={{ flexDirection: 'row', }}>
          <TouchableOpacity onPress={() => onCall()} style={{ flexDirection: 'row' }}>
            <Image source={images.contact_us_icon} style={{ width: 35, height: 35, }} />
            <Text style={styles.callText} >{i18n.t('command_center')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleModal}>
            <Image source={images.LogOut_image} style={{ width: 30, height: 30 }} />
          </TouchableOpacity>

          <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => { navigation.navigate('NotificationList') }} >
            <Image source={images.bell_icon} style={{ width: 36, height: 36 }} />
            <Text style={styles.conuntText}>{getCount}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1, backgroundColor: '#F4EDE5', padding: 10 }}>
          <View>
            <Text style={styles.versionText}>{'v2.0.4'}</Text>
            <FlatList
              style={{ marginTop: -20 }}
              data={getICUListData}
              renderItem={renderICUListData}
              horizontal={true}
              keyExtractor={(item) => item.icu_id.toString()}
            />
          </View>
          <Provider>
            <View>
              <FlatList
                data={getICUBedData}
                renderItem={renderBedData}
                keyExtractor={(item, index) => index.toString()}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              />
              <Popover
                isVisible={menuVisible}
                from={{ x: menuPosition.x, y: menuPosition.y, width: -100, height: 30 }}
                onRequestClose={closeMenu}
              >
                <View style={{ width: 150, padding: 5, borderWidth: 1, borderColor: colors.borderColor }}>
                  {dischargeOptions.map((option, index) => (
                    <TouchableOpacity key={option} onPress={() => { navigation.navigate('ReferDischargeScreen',{selectedItem, type: i18n.t(option),}); closeMenu();}}>
                      <Text style={{padding: 8, borderBottomWidth: index < dischargeOptions.length - 1 ? 1 : 0, borderBottomColor: colors.borderColor, color: colors.grayColor,}}>{i18n.t(option)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Popover>
            </View>
          </Provider>
        </View>

      </View>

      <TouchableOpacity onPress={() => { navigation.navigate('ChatActivity', { 'hospitalId': getHospitalId }) }} style={styles.floatingButton}>
        <Image source={images.chat_icon} style={{ width: 28, height: 28 }} />
      </TouchableOpacity>

      <VitalsAlerts vitalsAlertModal={vitalsAlertModal} isVitalsVisible={isVitalsVisible} vitalsTitle={getVitalTitle} />

      {isModalAssignVisible && <AssignPatientModal toggleAssignModal={toggleAssignModal} isModalAssignVisible={isModalAssignVisible} bedNumber={getBedNumber} bed_id={getBed_id} icuName={getIcuName} getHospitalId={getHospitalId} fcm_tokens={getFCMUserToken} onRefresh={onRefresh} />}

      <Modal isVisible={isModalVisible} onBackdropPress={toggleModal} style={styles.bottomModal}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{i18n.t('see_you_soon')}</Text>
          <Text style={styles.modalTitle}>{i18n.t('sure_logout_text')}</Text>
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity onPress={toggleModal} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>{i18n.t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onLogout()} style={styles.sendButton}>
              <Text style={styles.sendButtonText}>{i18n.t('logout')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Toast />
    </SafeAreaView>
  )
};

export default IcuBedsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  headerViewStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    elevation: 4, // Android shadow
    backgroundColor: colors.backgroundScreen, // Ensure the background color matches the screen
    padding: 10,
    shadowColor: colors.grayColor,
    shadowOffset: {
      width: 4,
      height: 4,
    },
    marginBottom: 5
  },
  headerText: {
    fontFamily: font.semiBold,
    fontSize: 16,
    color: colors.grayColor,
  },
  icuText: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.midiumGrayy,
  },
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: colors.backgroundScreen,
    paddingHorizontal: 5,
    paddingVertical: 20,
    justifyContent: 'center',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: font.bold,
    marginBottom: 10,
    alignSelf: 'center',
    color: colors.grayColor,
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
  icuTextStyle: {
    fontSize: 16,
    color: colors.grayColor,
    fontFamily: font.bold,
    margin: 5,
    borderBottomWidth: 2,
    borderBottomColor: colors.orangeColor,
    paddingBottom: 5
  },
  bedItemContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderColor,
    marginTop: 20,
  },
  headerBedView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  detailsTextStyl: {
    fontFamily: font.semiBold,
    fontSize: 12,
    color: colors.orangeColor
  },
  vacantBedStyl: {
    width: '60%',
    color: colors.textColor,
    fontSize: 14,
    fontFamily: font.light,
    backgroundColor: colors.lightRedColor,
    padding: 8,
    marginRight: 8,
    textAlign: 'center'
  },
  pendingBedStyl: {
    color: colors.orangeColor,
    fontSize: 14,
    fontFamily: font.regular,
    backgroundColor: colors.lightRedColor,
    padding: 8,
    marginRight: 8,
    textAlign: 'center'
  },
  patientDetailsText: {
    fontFamily: font.light,
    fontSize: 12,
    color: '#4F4F4F',
  },
  vacantContainer: {
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'center'
  },
  assignPatientButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 8,
    justifyContent: 'center'
  },
  patientFileView: {
    width: '74%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderColor,
    padding: 8
  },
  addPatientFile: {
    width: '24%',
    backgroundColor: colors.orangeColor,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginStart: 4,
    borderRadius: 8,
  },
  patientNameText: {
    color: colors.grayColor,
    fontSize: 16,
    fontFamily: font.bold,
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
  callText: {
    width: 75,
    fontSize: 12,
    fontFamily: font.bold,
    color: colors.orangeColor,
  },
  conuntText: {
    fontSize: 8,
    fontFamily: font.bold,
    color: colors.white,
    backgroundColor: '#ff0000',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    marginLeft: -18,
    paddingTop: 4,
    overflow: 'hidden'
  },
  versionText: {
    fontSize: 12,
    fontFamily: font.semiBold,
    textAlign: 'right',
    color: colors.black,
    marginTop: -5,
    marginRight: 10,
  }
});