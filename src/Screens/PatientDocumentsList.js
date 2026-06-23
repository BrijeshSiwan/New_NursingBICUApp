import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, FlatList, Platform, ToastAndroid } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Loader from '../Components/Loader';
import * as FetchAPI from '../Services/fetchAPI';
import { getAuthToken } from "../Services/storage";
import { GetViewDocumentData } from '../Services/APIManager';
import theme from '../assets/theme';
const { images, font, colors } = theme;
import { SearchBar } from 'react-native-elements';
import { SafeAreaView } from "react-native-safe-area-context";
import { format, parse } from 'date-fns';
import i18n from '../locales/i18n';


const PatientDocumentsList = ({ route, navigation }) => {
  const [isLoader, setLoader] = useState(false);
  const [getDocumentsData, setDocumentsData] = useState([]);
  const [getDocumentsSearchData, setDocumentsSearchData] = useState([]);
  const [getSearchValue, setSearchValue] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {id,full_name} = route.params.patientDetails;

  useEffect(() => {
    getAuthToken("auth_token").then(res => {
      getDocumentsNameListData("Bearer " + res);
    });
  }, []);

  const getDocumentsNameListData = async (auth_token, isRefresh = false) => {
    if (!isRefresh) setLoader(true);

    var bed_url = GetViewDocumentData + id + '/';
    FetchAPI.GetRequestwithauttoken(bed_url, auth_token, async (response) => {
      if (response.status === 200) {
        try {
          setDocumentsData(response.data.documents);
          setDocumentsSearchData(response.data.documents);
          setLoader(false);
          setRefreshing(false);
        } catch (e) {
          console.log(e);
          setLoader(false);
          setRefreshing(false);
        }
      } else {
        setLoader(false);
        setRefreshing(false);
        if (Platform.OS === 'android') {
          ToastAndroid.show(response.msg, ToastAndroid.SHORT);
        }
      }
    });
  };

  const searchFunction = (text) => {
    const updatedData = getDocumentsSearchData.filter((item) => {
      const item_data = `${item.document_name.toUpperCase()}`;
      const text_data = text.toUpperCase();
      return item_data.indexOf(text_data) > -1;
    });

    setDocumentsData(updatedData);
    setSearchValue(text);
  };

  const onRefresh = () => {
    setRefreshing(true);
    getAuthToken("auth_token").then(res => {
      getDocumentsNameListData("Bearer " + res, true);
    });
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      {isLoader && <Loader visible></Loader>}

      <TouchableOpacity onPress={() => { navigation.goBack() }} style={styles.backButton}>
        <Image source={images.back_arrow} style={{ width: 24, height: 24, marginTop: 10, marginRight: 10 }} tintColor={colors.grayColor}/>
        <View>
          <Text style={styles.headerText}>{i18n.t('patient_files')}</Text>
          <Text style={styles.subHeaderText}>{full_name + '     '+ i18n.t('bed') + route.params.bedNumber}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.searchBarWrapper}>
        <SearchBar
          placeholder={i18n.t('search_document_name')}
          value={getSearchValue}
          placeholderTextColor={colors.textColor}
          containerStyle={styles.searchBarContainer}
          inputContainerStyle={styles.searchBarInputContainer}
          inputStyle={styles.searchBarInput}
          onChangeText={(text) => searchFunction(text)}
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={getDocumentsData}
        renderItem={({ item }) => {

          let formattedDate = '';
          try {
            const uploadTime = parse(item.upload_time, 'dd/MM/yyyy, hh:mm a', new Date()); 
            formattedDate = format(uploadTime, 'dd MMMM yyyy, hh:mm a');
          } catch (error) {
            console.error('Error parsing date:', error);
          }

          return(
          <View style={styles.listItemContainer}>
            <TouchableOpacity style={styles.listItem} onPress={() => {
              navigation.navigate('PatientDocumentView', {'document_id': item.document_id});
            }}>
              <View style={styles.listItemContent}>
                <View>
                  <Text style={styles.documentName}>{item.document_name}</Text>
                  <Text style={styles.uploadInfo}>{formattedDate}
                    {item.uploaded_by != null ? '  By: ' : ''}{item.uploaded_by != null ? item.uploaded_by : ''}
                  </Text>
                </View>
                <Image source={images.right_arrow} style={styles.rightArrow} />
              </View>
            </TouchableOpacity>
          </View>
          )
        }}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <TouchableOpacity onPress={() => navigation.navigate('AddNewDocuments', {
        'patientID': id, 'bedNumber': route.params.bedNumber, 'icuID': route.params.icuID,'full_name':full_name
      })} style={styles.patientFileOpen}>
        <Text style={styles.addFileText}>{'+ '+i18n.t('add_new_file')}</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
};

export default PatientDocumentsList;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.backgroundScreen,
  },
  backButton: {
    flexDirection: 'row',
    paddingLeft: 16,
    paddingTop: 14,
  },
  headerText: {
    fontFamily: font.semiBold,
    fontSize: 16,
    color: colors.headingText,
  },
  subHeaderText: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.headingText,
  },
  searchBarWrapper: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 20,
    borderColor: colors.borderColor,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: colors.white,
  },
  searchBarContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    height: 40, 
    justifyContent:'center'
  },
  searchBarInputContainer: {
    backgroundColor: 'transparent',
    color: colors.headingText,
  },
  searchBarInput: {
    fontSize: 14,
    fontFamily: font.light,
    color: colors.textColor,
  },
  listItemContainer: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#CFCFCF',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#FFF5ED',
  },
  listItem: {
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  listItemContent: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  documentName: {
    color: colors.headingText,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: font.semiBold,
  },
  uploadInfo: {
    color: colors.headingText,
    fontSize: 10,
    lineHeight: 20,
    fontFamily: font.regular,
  },
  rightArrow: {
    width: 20,
    height: 20,
    margin: 8,
    justifyContent: 'flex-end',
  },
  patientFileOpen: {
    padding: 10,
    marginTop: 10,
  },
  addFileText: {
    width: '95%',
    backgroundColor: colors.orangeColor,
    color: colors.white,
    fontSize: 16,
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: font.bold,
    padding: 10,
    borderRadius: 8,
  },
});
