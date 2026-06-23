import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text, Alert, Modal, TouchableOpacity } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import ImagePicker from 'react-native-image-crop-picker';
import { storeCaptureDocuments, getAuthToken, getDataObject } from '../Services/storage';
import Loader from '../Components/Loader';
import * as FetchAPI from '../Services/fetchAPI';
import { GetDocumentNameList, UploadDocuments } from '../Services/APIManager';
import theme from '../assets/theme';
import RNFetchBlob from 'rn-fetch-blob';
import EncryptionHelper from '../Components/EncryptionHelper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import i18n from '../locales/i18n';

// ⭐ NEW DOCUMENT PICKER
import { pick, keepLocalCopy } from '@react-native-documents/picker';

const { images, font, colors } = theme;

const AddNewDocuments = ({ route, navigation }) => {
  const [isLoader, setLoader] = useState(false);
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);
  const [getImage, setImage] = useState(null);
  const [getBedNameData, setBedNameData] = useState([]);
  const [getNurseName, setNurseName] = useState('');
  const [serverPublicKey, setServerPublicKey] = useState('bud8344icu123!@#97&03hjsbb#*&^%#');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setModalVisible(true), 1000);

    getAuthToken("auth_token").then(res => {
      getDocumentsNameData("Bearer " + res);
    });

    getDataObject("user_Data").then(response => {
      setNurseName(response.user.first_name + ' ' + response.user.last_name);
    });
  }, []);

  const getDocumentsNameData = async (auth_token) => {
    setLoader(true);
    FetchAPI.GetRequestwithauttoken(GetDocumentNameList, auth_token, async (response) => {
      setLoader(false);
      if (response.status === 200) {
        setBedNameData(response.data);
      } else {
        Toast.show({ type: 'error', text1: i18n.t('something_went_wrong') });
      }
    });
  };

  // ⭐ Updated option selector
  const selectOption = async (option) => {
    setModalVisible(false);

    try {
      if (option === 'camera') {
        const image = await ImagePicker.openCamera({
          cropping: true,
          compressImageQuality: 0.5,
        });
        setImage({ type: 'image', uri: image.path });

      } else if (option === 'gallery') {
        const image = await ImagePicker.openPicker({
          cropping: true,
          compressImageQuality: 0.5,
        });
        setImage({ type: 'image', uri: image.path });

      } else if (option === 'file') {
        // ⭐ NEW DOCUMENT PICKER USAGE
        const [file] = await pick({ type: ['*/*'] });

        // ⭐ Save local copy
        const localFile = await keepLocalCopy(file);

        setImage({
          type: 'file',
          uri: localFile.fileCopyUri,
          name: file.name
        });
      }

    } catch (err) {
      console.log("Picker error:", err);
    }
  };


  // ⭐ Upload logic unchanged
  const patientDocumentUpload = async (auth_token, patientID) => {
    setLoader(true);

    const { iv: nameIV, ciphertext: encryptedDocumentName } =
      await EncryptionHelper.encryptMessage({ document_name: value }, serverPublicKey);

    const { iv: patientIdIV, ciphertext: encryptedPatientID } =
      await EncryptionHelper.encryptMessage({ patient: patientID }, serverPublicKey);

    const { iv: uploadedByIV, ciphertext: encryptedUploadedBy } =
      await EncryptionHelper.encryptMessage({ uploaded_by: getNurseName }, serverPublicKey);

    RNFetchBlob.fetch('POST', UploadDocuments, {
      Authorization: auth_token,
      'Content-Type': 'multipart/form-data',
    }, [
      {
        name: "document_image",
        filename: getImage.type === 'image' ? "image.png" : getImage.name,
        type: getImage.type === 'image' ? "image/png" : "application/octet-stream",
        data: RNFetchBlob.wrap(getImage.uri),
      },
      { name: "document_name", data: encryptedDocumentName },
      { name: "patient", data: encryptedPatientID },
      { name: "uploaded_by", data: encryptedUploadedBy },
      { name: "document_name_iv", data: nameIV },
      { name: "patientId_iv", data: patientIdIV },
      { name: "uploadedBy_iv", data: uploadedByIV },
    ])
      .then((resp) => {
        setLoader(false);
        navigation.goBack();
        Toast.show({ type: 'success', text1: i18n.t('uploaded_document_successfully') });
      })
      .catch((err) => {
        console.log("err_resp", err);
        setLoader(false);
      });
  };

  const renderItem = (item) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item.name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoader && <Loader visible />}

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Image source={images.back_arrow} style={styles.backImage} tintColor={colors.grayColor} />
        <Text style={styles.headerText}>{i18n.t('add_new_file')}</Text>
      </TouchableOpacity>

      <Text style={styles.bedHeaderText}>{i18n.t('bed') + route.params.bedNumber}</Text>
      <Text style={styles.patientName}>{route.params.full_name}</Text>

      {getImage && (
        <View style={styles.docViewStyl}>
          {getImage.type === 'image'
            ? <Image style={{ width: '100%', height: '100%' }} source={{ uri: getImage.uri }} />
            : <Text style={styles.fileName}>{i18n.t('selected_file') + getImage.name}</Text>
          }
        </View>
      )}

      <Text style={styles.selectFileTypeText}>{i18n.t('select_file_type')}</Text>

      <View style={styles.dropdownContainer}>
        <Dropdown
          style={[styles.dropdownStyl, isFocus && { borderColor: colors.borderColor }]}
          data={getBedNameData}
          search
          maxHeight={300}
          labelField="name"
          valueField="id"
          placeholder={!isFocus ? i18n.t('select_document_name') : '...'}
          searchPlaceholder={i18n.t('search')}
          value={value}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={item => {
            setValue(item.id);
            setIsFocus(false);
          }}
          renderItem={renderItem}
          selectedTextStyle={styles.selectedText}
        />
      </View>

      {/* ⭐ Selection Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{i18n.t('choose_an_option')}</Text>

            <TouchableOpacity style={styles.modalButton} onPress={() => selectOption('camera')}>
              <Text style={styles.modalButtonText}>{i18n.t('capture_from_camera')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={() => selectOption('gallery')}>
              <Text style={styles.modalButtonText}>{i18n.t('pick_from_gallery')}</Text>
            </TouchableOpacity>

            {/* ⭐ NEW BUTTON FOR FILE PICK */}
            <TouchableOpacity style={styles.modalButton} onPress={() => selectOption('file')}>
              <Text style={styles.modalButtonText}>{i18n.t('choose_document')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelButtonText}>{i18n.t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.captureButtonStyle, { backgroundColor: getImage ? colors.white : colors.orangeColor }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: getImage ? colors.orangeColor : colors.white }}>{getImage ? i18n.t('recapture') : i18n.t('capture')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButtonStyle}
          onPress={() => {
            if (!value) {
              Toast.show({ type: 'error', text1: i18n.t('please_select_documents_name') });
              return;
            }

            getAuthToken("auth_token").then(res => {
              patientDocumentUpload("Bearer " + res, route.params.patientID);
            });
          }}
        >
          <Text style={{ color: colors.white }}>{i18n.t('submit')}</Text>
        </TouchableOpacity>
      </View>

      <Toast />
    </SafeAreaView>
  );
};

export default AddNewDocuments;

const styles = StyleSheet.create({
    container: {
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
        paddingLeft: 16,
    },
    bedHeaderText: {
        fontFamily: font.regular,
        fontSize: 10,
        color: colors.textColor,
        marginTop: 10,
        paddingLeft: 16,
    },
    patientName: {
        fontSize: 16,
        fontFamily: font.bold,
        color: colors.textColor,
        marginTop: 10,
        paddingLeft: 16,
    },
    docViewStyl: {
        flex: 1,
        backgroundColor: colors.grayColor,
        padding: 1,
        marginTop: 10,
        alignItems: 'center',
    },
    selectFileTypeText: {
        color: colors.grayColor,
        fontSize: 12,
        fontFamily: font.regular,
        padding: 16,
        marginLeft: 20
    },
    dropdownContainer: {
        width: '90%',
        height: 44,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: colors.borderColor,
        backgroundColor: colors.white,
        alignSelf: 'center'
    },
    dropdownStyl: {
        width: '100%',
        height: 40,
        borderColor: 'white',
        backgroundColor: 'white',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
        alignSelf: 'center',
    },
    buttonRow: {
        width: '90%',
        height: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf:'center',
        marginTop: 16,
        marginBottom: 16
    },
    captureButtonStyle: {
        flex: 2,
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.borderColor,
    },
    submitButtonStyle: {
        flex: 2.5,
        alignItems: 'center',
        backgroundColor: colors.orangeColor,
        paddingHorizontal: 50,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.orangeColor,
        marginLeft: 20
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      modalContent: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
      },
      modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
      },
      modalButton: {
        backgroundColor: '#2196F3',
        padding: 10,
        marginVertical: 8,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
      },
      modalButtonText: {
        color: colors.white,
        fontSize: 14,
        fontFamily: font.semiBold,
      },
      modalCancelButton: {
        marginTop: 10,
        padding: 15,
        alignItems: 'center',
      },
      modalCancelButtonText: {
        color: 'red',
        fontSize: 16,
      },
      fileName: {
        fontSize: 16,
        color: colors.white,
      },
});
