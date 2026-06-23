import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, ToastAndroid, Platform, Alert,TouchableOpacity } from "react-native";
import Loader from '../Components/Loader';
import * as FetchAPI from '../Services/fetchAPI';
import { rejectDocumentsApi, viewDocuments } from '../Services/APIManager';
import { getAuthToken} from "../Services/storage";
import theme from '../assets/theme';
const { colors, images, font } = theme;
import ImageViewer from 'react-native-image-zoom-viewer';
import { SafeAreaView } from "react-native-safe-area-context";
import { parse, format, parseISO } from 'date-fns';
import RNFetchBlob from 'rn-fetch-blob';
import i18n from '../locales/i18n';

const PatientDocumentView = ({ route, navigation }) => {
  const [isLoader, setLoader] = useState(false);
  const [getDocumentDetails, setDocumentDetails] = useState(null);
  const [getPatientDetails, setPatientDetails] = useState(null);
  const [getBedNumber, setBedNumber] = useState('');
  const [zoomImages, setZoomImages] = useState([]);
  const [getRotateImage, setRotateImage] = useState(0);
  const [getImageUrl, setImageUrl] = useState('');

  useEffect(() => {
    getAuthToken("auth_token").then(res => {
      getDocumentData("Bearer " + res)
    });
   
  }, []);


  const getDocumentData = async (auth_token) => {
    setLoader(true);
    const document_url = viewDocuments + route.params.document_id + '/';
    FetchAPI.GetRequestwithauttoken(document_url,auth_token, async (response) => {
      try {
        const documentDetails = response.data.documents;
        setDocumentDetails(documentDetails);
        setPatientDetails(response.data.patient_data);
        setBedNumber(response.data.bed_number);
        // Log and set the document image URL
        const documentImageUrl = documentDetails?.document_image;
        setImageUrl(documentImageUrl);
        if (documentImageUrl) {
          setZoomImages([{ url: documentImageUrl }]);
        } else {
          console.warn("Document image URL is not available");
        }

        setLoader(false);
      } catch (e) {
        console.error("Error while fetching document data:", e);
        setLoader(false);
      }
    });
  };

  const rejectAlert = () => {
    Alert.alert(
      i18n.t('reject_document_message'),
      '',
      [
        {
          text: i18n.t('cancel'),
          onPress: () => console.log('Cancel Pressed'),
        },
        { text: i18n.t('ok'), onPress: () =>{ 
          getAuthToken("auth_token").then(res => {
            onRejected("Bearer " + res)
          });
          
        } },
      ]
    );
  };

  const onRejected = async (auth_token) => {
    setLoader(true);

    const rejected_url = rejectDocumentsApi + route.params.document_id  + '/';
    FetchAPI.PutRequest(rejected_url, '', auth_token, async (response) => {
      try {
        if (Platform.OS === 'android') {
          ToastAndroid.show(response.msg, ToastAndroid.SHORT);
        }
        navigation.goBack();
        setLoader(false);
      } catch (e) {
        console.error("Error while rejecting document:", e);
        setLoader(false);
      }
    });
  };

  let formattedDate = '';
  let time = '';
  if (getDocumentDetails?.upload_time) {
    const dateAndTimeParts = getDocumentDetails.upload_time.match(/(\d{1,2}\/\d{1,2}\/\d{4}), (\d{1,2}:\d{1,2} [APap][Mm])/);
    if (dateAndTimeParts && dateAndTimeParts.length >= 3) {
      const date = dateAndTimeParts[1];
      time = dateAndTimeParts[2];
      const parsedDate = parse(date, 'dd/MM/yyyy', new Date());
      formattedDate = format(parsedDate, 'dd MMMM yyyy');
    }
  };


  const downloadImage = async () => {
    
    let date = new Date();
    let file_ext = getFileExtention(getImageUrl);

    file_ext = '.' + file_ext[0];
    const { config, fs } = RNFetchBlob;
    let RootDir = fs.dirs.PictureDir;
    let options = {
    fileCache: true,
    addAndroidDownloads: {
      path:
        RootDir+
        '/file_' + 
        Math.floor(date.getTime() + date.getSeconds() / 2) +
        file_ext,
      description: 'downloading file...',
      notification: true,
      // useDownloadManager works with Android only
      useDownloadManager: true,   
    },
    };
    config(options)
    .fetch('GET', getImageUrl)
    .then(res => {
      // Alert after successful downloading
      console.log('res -> ', JSON.stringify(res));
      Alert.alert('File Downloaded Successfully.');
    });
  };

  const getFileExtention = fileUrl => {
    return /[.]/.exec(fileUrl) ? /[^.]+$/.exec(fileUrl) : undefined;
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      {isLoader && <Loader visible />}

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Image source={images.back_arrow} style={styles.backImage} tintColor={colors.grayColor} />
        <Text style={styles.headerText}>{getDocumentDetails?.document_name}</Text>
      </TouchableOpacity>

      <View style={[styles.infoContainer, { flexDirection: 'column' }]}>
        <Text style={styles.bedHeaderText}>{i18n.t('bed') + getBedNumber}</Text>
        <Text style={[styles.bedHeaderText, styles.patientName]}>{getPatientDetails?.full_name}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.bedHeaderText}>{i18n.t('gender') + ': ' + getPatientDetails?.gender}</Text>
        <Text style={styles.bedHeaderText}>{i18n.t('id') + ': ' + getPatientDetails?.patient_id}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.bedHeaderText}>{i18n.t('age') + getPatientDetails?.age}</Text>
        <Text style={styles.bedHeaderText}>{i18n.t('admission_date') + (getPatientDetails?.date_of_admitions ? format(parseISO(getPatientDetails.date_of_admitions), 'dd MMMM yyyy') : '')}</Text>
      </View>

      <View style={styles.docViewStyl}>
        {zoomImages.length > 0 ? (
          <ImageViewer
          style={{width:'100%',height:'100%',transform: [{rotate: getRotateImage+'deg'}]}}
            imageUrls={zoomImages}
            renderIndicator={() => null}
          />
        ) : (
          <Text>{i18n.t('no_image_available')}</Text>
        )}

        <View style={{width:'100%',height:'5%',justifyContent:'space-between',alignItems:'center',backgroundColor:'#ACE3D2',flexDirection:'row',paddingHorizontal:20}}>
          <TouchableOpacity onPress={()=>{setRotateImage(getRotateImage+90)}}>
            <Image style={{width:30,height:30}}  source={images.icon_rotate} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => downloadImage()}>
            <Image style={{width:30,height:30}}  source={images.download_image} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dateTimeContainer}>
        <Text style={styles.dateTimeText}>{formattedDate}</Text>
        <Text style={styles.dateTimeText}>{time}</Text>
        <Text style={styles.dateTimeText}>{getDocumentDetails?.uploaded_by ? i18n.t('by') : ''}
          <Text style={styles.dateTimeText}>{getDocumentDetails?.uploaded_by}</Text>
        </Text>
      </View>

      <TouchableOpacity onPress={rejectAlert} style={styles.rejectButtonStyle}>
        <Text style={styles.rejectButtonText}>{i18n.t('reject_document')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default PatientDocumentView;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.backgroundScreen,
  },
  backButton: {
    flexDirection: 'row',
    paddingLeft: 16,
    paddingTop: 10,
  },
  backImage: {
    width: 24,
    height: 24,
    marginTop: 10,
    marginRight: 10,
  },
  headerText: {
    fontFamily: font.semiBold,
    fontSize: 16,
    color: colors.headingText,
    paddingTop: 10,
  },
  infoContainer: {
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bedHeaderText: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.black,
    marginTop: 8,
  },
  patientName: {
    fontSize: 16,
    fontFamily: font.bold,
  },
  docViewStyl: {
    flex: 1,
    backgroundColor: colors.grayColor,
    padding: 1,
    marginTop: 10,
  },
  imageViewer: {
    width: '100%',
    height: '100%',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    padding: 8,
    justifyContent: 'space-between',
    backgroundColor: '#D6F1E8',
  },
  dateTimeText: {
    color: '#4F4F4F',
    fontSize: 12,
    fontFamily: font.regular,
  },
  rejectButtonStyle: {
    width: '90%',
    marginVertical: 10,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.borderColor,
    padding: 10,
  },
  rejectButtonText: {
    color: colors.orangeColor,
    fontSize: 16,
    fontFamily: font.bold,
  },
});
