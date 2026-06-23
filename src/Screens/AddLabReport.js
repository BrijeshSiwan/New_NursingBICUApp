import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text, Alert, Modal, TouchableOpacity, Platform } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import ImagePicker from 'react-native-image-crop-picker';
import { storeCaptureDocuments, getAuthToken, getDataObject } from '../Services/storage';
import Loader from '../Components/Loader';
import * as FetchAPI from '../Services/fetchAPI';
import { GetDocumentNameList, UploadDocuments, UploadLabReport } from '../Services/APIManager';
import theme from '../assets/theme';
import RNFetchBlob from 'rn-fetch-blob';
const { images, font, colors } = theme;
import EncryptionHelper from '../Components/EncryptionHelper';
import DocumentPicker from '@react-native-documents/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import i18n from '../locales/i18n';

const AddLabReport = ({ route, navigation }) => {
    const [isLoader, setLoader] = useState(false);
    const [value, setValue] = useState(null);
    const [isFocus, setIsFocus] = useState(false);
    const [getImage, setImage] = useState(null);
    const [getBedNameData, setBedNameData] = useState([]);
    const [getNurseName, setNurseName] = useState('');
    const [serverPublicKey, setServerPublicKey] = useState('bud8344icu123!@#97&03hjsbb#*&^%#');
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setModalVisible(true)
        }, 1000);

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
            if (response.status === 200) {
                try {
                    setBedNameData(response.data);
                    setLoader(false);
                } catch (e) {
                    console.log(e);
                    setLoader(false);
                }
            } else {
                setLoader(false);
                Toast.show({ type: 'error', text1: i18n.t('something_went_wrong') });
            }
        });
    };

    const selectOption = async (option) => {
        setModalVisible(false); // Close modal

        try {
            if (option === 'camera') {
                const image = await ImagePicker.openCamera({
                    cropping: true,
                    compressImageQuality: 0.5,
                });
               // console.log('Selected Image from Camera:', image); // Debug log
                setImage({
                    type: 'image',
                    uri: image.path,
                    name: image.filename || image.path.split('/').pop(), // Use filename or derive from path
                    mimeType: image.mime,
                });
            } else if (option === 'gallery') {
                const image = await ImagePicker.openPicker({
                    cropping: true,
                    compressImageQuality: 0.5,
                });
               // console.log('Selected Image from Gallery:', image); // Debug log

                const fileType = getFileType(image.filename || image.path); // Check filename or path
               // console.log('Detected file type:', fileType); // Debug log

                if (!fileType) {
                    Alert.alert("Error", "Unsupported file type. Please upload a PNG, JPEG, or PDF.");
                    return;
                }

                setImage({
                    type: 'image',
                    uri: image.path,
                    name: image.filename || image.path.split('/').pop(), // Use filename or derive from path
                    mimeType: fileType, // Use detected MIME type
                });
            } else if (option === 'file') {
                const file = await DocumentPicker.pickSingle({
                    type: [DocumentPicker.types.allFiles],
                });
                setImage({
                    type: 'file',
                    name: file.name,
                    uri: file.uri,
                });
            }
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                console.log('File selection canceled');
            } else {
                console.error(err);
            }
        }
    };

    // Get the MIME type based on file extension
    const getFileType = (filenameOrPath) => {
        if (!filenameOrPath) return null;

        // Use path if filename is not available
        const extension = filenameOrPath.split('.').pop().toLowerCase();
        console.log('File Extension:', extension); // Debug log

        switch (extension) {
            case 'png':
                return 'image/png';
            case 'jpeg':
            case 'jpg':
                return 'image/jpeg';
            case 'pdf':
                return 'application/pdf';
            default:
                return null;
        }
    };


    const patientLabReportUpload = async (auth_token, patientID) => {
        setLoader(true);

        const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];

        const fileType = getFileType(getImage.name);
        if (!fileType || !allowedTypes.includes(fileType)) {
            setLoader(false);
            Alert.alert("Error", "Unsupported file type. Please upload a PNG, JPEG, or PDF.");
            return;
        }

        console.log("getImage Object:", getImage);

        const formData = new FormData();

        // Adjust the file URI for iOS
        const fileUri = Platform.OS === 'ios' ? getImage.uri.replace('file://', '') : getImage.uri;

        formData.append("file", {
            uri: fileUri,
            name: getImage.name || "uploaded_file", // Dynamic file name
            type: fileType, // Use actual MIME type
        });
        formData.append("document_name", value);
        formData.append("patient_id", patientID);

        try {
            const response = await fetch(UploadLabReport, {
                method: "POST",
                headers: {
                    Authorization: auth_token,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const contentType = response.headers.get("content-type");
            let result;

            if (contentType && contentType.includes("application/json")) {
                result = await response.json();
            } else {
                result = await response.text();
                console.warn("Non-JSON response:", result);
            }

            if (response.ok) {
               // console.log("Upload Response:", result);
                setLoader(false);
                Toast.show({ type: 'success', text1: i18n.t('uploaded_report_successfully') });
                navigation.goBack();
            } else {
                console.error("Upload failed:", result);
                setLoader(false);
                Alert.alert("Error", result.message || "Upload failed");
            }
        } catch (err) {
            console.error("Error:", err);
            setLoader(false);
            Alert.alert("Error", "An error occurred while uploading");
        }
    };



    const patientDocumentUpload = async (auth_token, patientID) => {
        setLoader(true)

        const { iv: nameIV, ciphertext: encryptedDocumentName } = await EncryptionHelper.encryptMessage({ document_name: value }, serverPublicKey);

        const { iv: patientIdIV, ciphertext: encryptedPatientID } = await EncryptionHelper.encryptMessage({ patient: patientID }, serverPublicKey);

        const { iv: uploadedByIV, ciphertext: encryptedUploadedBy } = await EncryptionHelper.encryptMessage({ uploaded_by: getNurseName }, serverPublicKey);

        RNFetchBlob.fetch('POST', UploadDocuments, {
            Authorization: auth_token,
            'Content-Type': 'multipart/form-data',
        }, [
            {
                name: "document_image",
                filename: "image.png",
                type: "image/png",
                data: RNFetchBlob.wrap(getImage.uri),
            },
            {
                name: "document_name",
                data: encryptedDocumentName,
            },
            {
                name: "patient",
                data: encryptedPatientID,
            },
            {
                name: "uploaded_by",
                data: encryptedUploadedBy,
            },
            {
                name: "document_name_iv",
                data: nameIV,
            },
            {
                name: "patientId_iv",
                data: patientIdIV,
            },
            {
                name: "uploadedBy_iv",
                data: uploadedByIV,
            },

        ]).then((resp) => {
            console.log("resppp", resp);
            setLoader(false);
            Toast.show({ type: 'success', text1: i18n.t('uploaded_document_successfully') });
        }).catch((err) => {
            console.log("err_resp", err);
            setLoader(false);
        })

    };

    const renderItem = (item) => (
        <View style={styles.item}>
            <Text style={styles.itemText}>{item.name}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {isLoader === true && <Loader visible></Loader>}

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Image source={images.back_arrow} style={styles.backImage} tintColor={colors.grayColor} />
                <Text style={styles.headerText}>{i18n.t('add_lab_report')}</Text>
            </TouchableOpacity>

            <Text style={styles.bedHeaderText}>{i18n.t('bed') + route.params.bedNumber}</Text>
            <Text style={styles.patientName}>{route.params.full_name}</Text>

            {getImage && (
                <View style={styles.docViewStyl}>
                    {getImage.type === 'image' ? (

                        <Image style={{ width: '100%', height: '100%', backgroundColor: colors.elfGreen, }} source={{ uri: getImage.uri }} />
                    ) : (
                        <Text style={styles.fileName}> {i18n.t('selected_file') + getImage.name}</Text>
                    )}
                </View>
            )}

            {/* <View style={styles.docViewStyl}>
                {getImage ? <Image style={{ width: '100%', height: '100%', backgroundColor: colors.elfGreen, }} source={{ uri: getImage.uri }} /> : null}
            </View> */}

            <Text style={styles.selectFileTypeText}>{i18n.t('select_file_type')}</Text>

            <View style={styles.dropdownContainer}>
                <Dropdown
                    style={[styles.dropdownStyl, isFocus && { borderColor: colors.borderColor, }]}
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

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{i18n.t('choose_an_option')}</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => selectOption('camera')}
                        >
                            <Text style={styles.modalButtonText}>{i18n.t('capture_from_camera')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => selectOption('gallery')}
                        >
                            <Text style={styles.modalButtonText}>{i18n.t('pick_lab_report_gallery')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => selectOption('file')}
                        >
                            <Text style={styles.modalButtonText}>{i18n.t('pick_lab_report_file')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalCancelButtonText}>{i18n.t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.captureButtonStyle, { backgroundColor: getImage ? colors.white : colors.orangeColor, }]} onPress={() => { setModalVisible(true) }}>
                    <Text style={{ color: getImage ? colors.orangeColor : colors.white, fontSize: 12, fontFamily: font.bold }}>{getImage ? i18n.t('recapture') : i18n.t('capture')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.submitButtonStyle]} onPress={() => {
                    storeCaptureDocuments('capture_image', getImage ? getImage.uri : '');
                    getAuthToken("auth_token").then(res => {
                        if (value == null) {
                            Toast.show({ type: 'error', text1: i18n.t('please_select_documents_name') });
                            return;
                        } else {
                            if (getImage.type === 'image') {
                                // Call patientDocumentUpload for images
                                patientLabReportUpload("Bearer " + res, route.params.patientID);
                                patientDocumentUpload("Bearer " + res, route.params.patientID);
                            } else if (getImage.type === 'file') {
                                // Call patientLabReportUpload for files
                                patientLabReportUpload("Bearer " + res, route.params.patientID);
                                // patientDocumentUpload("Bearer " + res, route.params.patientID);
                            }
                        }
                    });
                }}>
                    <Text style={{ color: colors.white, fontSize: 12, fontFamily: font.bold }}>{i18n.t('submit')}</Text>
                </TouchableOpacity>
            </View>
            <Toast />
        </SafeAreaView>
    );
};

export default AddLabReport;

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
        alignSelf: 'center',
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
