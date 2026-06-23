import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, Alert, PermissionsAndroid, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import theme from '../assets/theme';
const { strings, images, font } = theme;
import { getAuthToken, getDataObject } from "../Services/storage";
import i18n from '../locales/i18n';
import * as FetchAPI from '../Services/fetchAPI';
import { downloadVitalsChart } from '../Services/APIManager';
import RNFetchBlob from 'rn-fetch-blob';


const CriticalCareChartView = ({ route, navigation }) => {
    const [token, setToken] = useState("");
    const webViewRef = useRef(null);

    useEffect(() => {
        getAuthToken("auth_token").then(res => {
            setToken(res);
        });
    }, []);

    const setTokenScript = `
        (function() {
        localStorage.setItem('token', '${token}');
        console.log('Token set in local storage:', localStorage.getItem('token'));
        const event = new Event('tokenSet');
        document.dispatchEvent(event);
        })();
        true;
    `;

    const injectToken = () => {
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(setTokenScript);
        }
    };

    // useEffect(() => {
    //     if (token && webViewRef.current) {
    //         const setTokenScript = `
    //             (function() {
    //               localStorage.setItem('token', '${token}');
    //               console.log('Token set in local storage:', localStorage.getItem('token'));
    //               const event = new Event('tokenSet');
    //               document.dispatchEvent(event);
    //             })();
    //             true;
    //           `;
    //         webViewRef.current.injectJavaScript(setTokenScript);
    //     }
    // }, [token]);

    const downloadPdfFile = async () => {
      try {
          const token = await getAuthToken('auth_token');
          const hasPermission = await requestStoragePermission();
  
          if (!hasPermission) {
              Alert.alert('Permission denied', 'Cannot download without storage permission');
              return;
          }
  
          const date = new Date();
          const fileName = `VitalsChart_${date.getTime()}.pdf`;
          const downloadPath = RNFetchBlob.fs.dirs.DownloadDir + `/${fileName}`;
          const url = downloadVitalsChart + route.params.patientID + '/';
  
          RNFetchBlob
              .config({
                  fileCache: true,
                  addAndroidDownloads: {
                      useDownloadManager: true,
                      notification: true,
                      title: fileName,
                      description: 'Vitals Chart PDF',
                      mime: 'application/pdf',
                      path: downloadPath,
                      mediaScannable: true,
                  },
              })
              .fetch('GET', url, {
                  Authorization: 'Bearer ' + token,
              })
              .then((res) => {
                  console.log('✅ PDF downloaded to:', res.path());
                  Alert.alert('Download complete', `PDF saved to Downloads`);
              })
              .catch((err) => {
                  console.error('❌ PDF download failed:', err);
                  Alert.alert('Download failed', 'Unable to download PDF file.');
              });
      } catch (err) {
          console.error('🔥 Unexpected error:', err);
          Alert.alert('Error', 'Something went wrong');
      }
  };
  
  
  
  
  

    const requestStoragePermission = async () => {
        if (Platform.OS !== 'android') return true;
      
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES, // OR READ_MEDIA_EXTERNAL_STORAGE for SDK 33+
          {
            title: 'Storage Permission',
            message: 'App needs access to download the file.',
            buttonPositive: 'OK',
          }
        );
      
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity onPress={() => { navigation.goBack() }} style={{ flexDirection: 'row' }}>
                <Image source={images.back_arrow} style={{ width: 30, height: 35, tintColor: '#3D3D3D', margin: 15 }} />
                <Text style={styles.heading}>{i18n.t('critical_care_monitoring')}</Text>
            </TouchableOpacity>

            <TouchableOpacity  style={{ width:40, height:40,position:'absolute',top:20,right:20 }} onPress={() => downloadPdfFile()}>
                <Image style={{width:30,height:30, tintColor: '#3D3D3D'}}  source={images.download_image} />
            </TouchableOpacity>

            <WebView
                limitsNavigationsToAppBoundDomains={true}
                ref={webViewRef}
                source={{ uri: 'https://budgeticu01-ac85.vercel.app/patient-record/' + route.params.patientID }}
                domStorageEnabled={true}
                javaScriptEnabled={true}
                allowsInlineMediaPlayback={true}
                style={{ flex: 1,marginTop:-80 }}
                onLoadEnd={injectToken}
                onMessage={(event) => {
                    console.log(event.nativeEvent.data);
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF6F3'
    },
    heading: {
        fontSize: 16,
        fontWeight: '500',
        color: '#7C7C7C',
        marginTop: 20,
        marginStart: 10
    },
});

export default CriticalCareChartView;
