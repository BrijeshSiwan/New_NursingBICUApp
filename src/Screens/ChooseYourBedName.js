import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, FlatList, ToastAndroid, Platform, RefreshControl } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Loader from '../Components/Loader';
import * as FetchAPI from '../Services/fetchAPI';
import { GetBedByICU } from "../Services/APIManager";
import { getAuthToken } from "../Services/storage";
import theme from '../assets/theme';
const { images, font, colors } = theme;

const ChooseYourBedName = ({ route, navigation }) => {
  const [isLoader, setLoader] = useState(false);
  const [getICUBedData, setICUBedData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getAuthToken("auth_token").then(res => {
      getBedDataByICU("Bearer " + res);
    });

    // const interval = setInterval(() => {
    //   getAuthToken("auth_token").then(res => {
    //     getBedDataByICU("Bearer " + res);
    //   });
    // }, 60000);
    // return () => clearInterval(interval);
    
  }, []);

  const getBedDataByICU = async (auth_token) => {
    setLoader(true);

    var bed_url = GetBedByICU + route.params.icuID + '/';
    FetchAPI.GetRequestwithauttoken(bed_url, auth_token, async (response) => {
      console.log('BED BY ICU DATA', response);
      if (response.status === 200) {
        try {
          let data = response.data.beds;
          // Check if the number of items is odd
          if (data.length % 2 !== 0) {
            data.push({ placeholder: true });
          }
          setICUBedData(data);
          setLoader(false);
        } catch (e) {
          console.log(e);
          setLoader(false);
        }
      } else {
        setLoader(false);
        if (Platform.OS === 'android') {
          ToastAndroid.show(response.msg, ToastAndroid.SHORT);
        }
      }
    });
  }

  const onViewClick = (item) => {
    console.log('check hospital data', item);

    if (item.patient == null) {
      navigation.navigate('PatientDetailsForm', { "hospital_ID": item.icu.hospital, "icuName": item.icu.name, "bedNumber": item.bed_number, "icuID": route.params.icuID, "bed_id": item.bed_id });
    } else if (item.patient.notification_title === "Admission Pending") {
      if (Platform.OS === 'android') {
        ToastAndroid.show(item.patient.notification_title, ToastAndroid.SHORT);
      }
    } else {
      navigation.navigate('PhotoViewer', {
        "patientID": item.patient.id, "bedNumber": item.bed_number,
        "full_name": item.patient.full_name, "uhid": item.patient.uhid, "gender": item.patient.gender, "date_of_birth": item.patient.date_of_birth, "phone_number": item.patient.phone_number,
      });
    }
  }

  const renderBedData = ({ item, index }) => {
    if (item.placeholder) {
      return <View style={[styles.selectBed_view_styl, styles.placeholder]} />;
    }

    let colorrr = item.patient ? item.patient.color_code : '';
    var color_type = '';
    if (colorrr === 0) {
      color_type = '#49A703';
    } else if (colorrr === 1) {
      color_type = '#F3683F';
    } else if (colorrr === 2) {
      color_type = '#ED0423';
    } else if (colorrr === 3) {
      color_type = '#C19A10';
    } else if (colorrr === 4) {
      color_type = '#113A9D';
    } else {
      color_type = '#FFFFFF';
    }
    return (
      <View style={styles.itemWrapper}>
        <View style={styles.selectBed_view_styl}>
          <View style={styles.bed_header}>
            <Text style={{ color: '#2C8170', fontSize: 14, lineHeight: 19, fontFamily: font.semiBold }}>{'Bed ' + item.bed_number }</Text>
          </View>

          <View style={{ padding: 10 }}>
            <Text style={{ color: '#3D3D3D', fontSize: 12, fontFamily: font.regular }}>{item.patient ? item.patient.full_name : 'Empty Bed'}</Text>
            <Text style={{ color: '#3D3D3D', fontSize: 12, fontFamily: font.regular }}>{'ID: '}
              <Text style={{ color: '#3D3D3D', fontSize: 12, fontFamily: font.regular }}>{item.patient ? item.patient.uhid : 'Empty Bed'}</Text>
            </Text>
          </View>

          {(item.is_occupied === true) &&
            <View style={{ flex: 1, paddingHorizontal: 1, flexDirection: 'row', justifyContent: 'space-between', borderTopColor: colors.borderColor, borderTopWidth: .5, marginTop: 10 }}>
              <TouchableOpacity onPress={() => { navigation.navigate('CriticalCareMonitoring', { "patientID": item.patient.id, 'hospitalId': route.params.hospitalId, 'bedNumber': item.bed_number, 'patientName': item.patient?.full_name }) }} style={styles.patientFileOpen} >
                <Text style={{ color: colors.grayColor, fontFamily: font.regular, fontSize: 14, marginRight: 10 }}>{'Vitals Chart'}</Text>
                <Image source={images.right_arrow} style={{ width: 16, height: 16, paddingEnd: 8 }} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => {
                navigation.navigate('PatientDocumentsList', {
                  "patientID": item.patient.id, "bedNumber": item.bed_number,
                  "full_name": item.patient.full_name, "uhid": item.patient.uhid, "gender": item.patient.gender, "date_of_birth": item.patient.date_of_birth, "phone_number": item.patient.phone_number,"icuID": route.params.icuID
                })
              }}
                style={styles.patientFileOpen} >
                <Text style={{ color: colors.grayColor, fontFamily: font.regular, fontSize: 14, marginRight: 10 }}>{'Patient Files'}</Text>
                <Image source={images.right_arrow} style={{ width: 16, height: 16, paddingEnd: 8 }} />
              </TouchableOpacity>
            </View>}

          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity onPress={() => onViewClick(item)}
              style={[styles.assign_bed_button, { backgroundColor: item.is_occupied == false ? color_type : color_type }]}>
              <Text style={{ color: item.patient ? '#ffffff' : '#F3683F', fontSize: 12, textAlign: 'center', fontFamily: font.medium }}>{item.patient ? item.patient.notification_title : 'Assign This Bed Now '}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const onRefresh = () => {
    setRefreshing(true);
    getAuthToken("auth_token").then(res => {
      getBedDataByICU("Bearer " + res).then(() => {
        setRefreshing(false);
      });
    });
  }

  return (
    <View style={styles.mainContainer}>
      {isLoader && <Loader visible />}

        <TouchableOpacity onPress={() => { navigation.replace('ChooseYourICUName') }} style={{ flexDirection: 'row', marginBottom: 20 }}>
          <Image source={images.back_arrow}
            style={{ width: 30, height: 35, marginEnd: 10 }} tintColor={'#3D3D3D'} />
          <Text style={{ color: '#3D3D3D', fontFamily: font.regular, fontSize: 16, marginTop: 6 }} >{'Choose Your Bed'}</Text>
        </TouchableOpacity>

        <FlatList
            data={getICUBedData}
            renderItem={renderBedData}
            numColumns={2}
            keyExtractor={(item, index) => index.toString()}
            columnWrapperStyle={styles.columnWrapper}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
        />

        <TouchableOpacity onPress={() => { navigation.navigate('ChatActivity', { "patientID": route.params.patientID, 'hospitalId': route.params.hospitalId }) }} style={styles.floatingButton}>
          <Image source={images.chat_icon} style={{ width: 28, height: 28 }} />
        </TouchableOpacity>
    </View>
  )
}

export default ChooseYourBedName;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.backgroundScreen,
    padding: 25
  },
  itemWrapper: {
    flex: 1,
    padding: 5,
  },
  selectBed_view_styl: {
    flex: 1,
    borderColor: '#E7E1DC',
    borderWidth: 1,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    padding: 10,
  },
  bed_header: {
    width: '100%',
    backgroundColor: '#ACE3D2',
    padding: 10,
    alignSelf: 'center',
  },
  assign_bed_button: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF3333',
    padding: 10,
    marginBottom: 1,
    marginTop: 10,
    alignSelf: 'center',
    borderRadius: 5,
    borderColor: '#D1D1D1',
    borderWidth: 1
  },
  bottomButtonContainer: {
    justifyContent: 'flex-end', // Pushes the button to the bottom
    flex: 1,
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
  patientFileOpen: {
    flex: 1,
    height: 40,
    backgroundColor: colors.white,
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.borderColor,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderRadius: 2,
    paddingHorizontal: 10
  },
  columnWrapper: {
    justifyContent: 'space-between'
  },
  placeholder: {
    backgroundColor: 'transparent', // Makes the placeholder invisible
    borderWidth: 0, // Removes the border of the placeholder
  }
});
