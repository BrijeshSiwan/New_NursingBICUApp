import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Modal from "react-native-modal";
import { RadioButton } from "react-native-paper";
import { Input } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Moment from 'moment';
import theme from '../assets/theme';
const { colors, images, font } = theme;
import * as FetchAPI from '../Services/fetchAPI';
import { InsertPatientdetails, checkPatientReadmit, sendNotification } from '../Services/APIManager';
import { getAuthToken } from "../Services/storage";
import Toast from 'react-native-toast-message';
import EncryptionHelper from '../Components/EncryptionHelper'; 
import i18n from '../locales/i18n';

const AssignPatientModal = ({ toggleAssignModal, isModalAssignVisible, bedNumber, bed_id, icuName, getHospitalId, fcm_tokens,onRefresh }) => {
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [fullNameError, setFullNameError] = useState("");
    const [uhidError, setUHIDError] = useState("");
    const [genderError, setGenderError] = useState("");
    const [dobError, setDOBError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [getPatientFullName, setPatientFullName] = useState('');
    const [getPatientUHID, setPatientUHID] = useState('');
    const [getPatientGender, setPatientGender] = useState('');
    const [getDOB, setDOB] = useState('');
    const [getPatientPhone, setPatientPhone] = useState('');
    const [serverPublicKey, setServerPublicKey] = useState('bud8344icu123!@#97&03hjsbb#*&^%#');
    const [loader, setLoader] = useState(false);

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const handleDateChange = (event, date) => {
        setDatePickerVisibility(false);
        if (date) {
            setSelectedDate(date);
            setDOB(Moment(date).format('YYYY-MM-DD'));
        }
    };

    const validateDOB = () => {
        if (!getDOB) {
            setDOBError(i18n.t('enter_patient_dob'));
        } else {
            setDOBError('');
        }
    };

    const onInputFullName = (fullName) => {
        setPatientFullName(fullName);
    };

    const onInputUHID = (uhid) => {
        setPatientUHID(uhid);
        if (uhid.length >= 4) {
            getAuthToken("auth_token").then(res => {
                reAdmitPatientCheck("Bearer " + res, uhid);
            });
        }
    };

    const onInputPhone = (phone) => {
        setPatientPhone(phone);
    };

    const handleAssign = () => {
        if (getPatientFullName.length === 0) setFullNameError(i18n.t('enter_full_name'));
        else setFullNameError("");
        if (getPatientUHID.length === 0) setUHIDError(i18n.t('enter_UHID'));
        else setUHIDError("");
        if (getPatientGender.length === 0) setGenderError(i18n.t('select_gender'));
        else setGenderError("");
        if (getDOB.length === 0) setDOBError(i18n.t('enter_patient_dob'));
        else setDOBError("");
        if (getPatientPhone.length === 0) setPhoneError(i18n.t('enter_patient_phone'));
        else setPhoneError("");

        if (
            getPatientFullName.length !== 0 &&
            getPatientUHID.length !== 0 &&
            getPatientGender.length !== 0 &&
            getDOB.length !== 0 &&
            getPatientPhone.length !== 0
        ) {
            getAuthToken("auth_token").then(res => {
                submitPatientDetails("Bearer " + res);
            });
        }
    };

    //call assign patient api
    const submitPatientDetails = async (auth_token) => {
        setLoader(true);

        const userCredentials = {
            full_name: getPatientFullName,
            gender: getPatientGender,
            date_of_birth: getDOB,
            phone_number: getPatientPhone,
            uhid: getPatientUHID,
            bed: bed_id,
            hospital: getHospitalId
        };

        const { iv: iv, ciphertext: encryptedAssignPatient } = await EncryptionHelper.encryptMessage(userCredentials, serverPublicKey);

        const paramss = {
            encrypted_json: encryptedAssignPatient,
            iv: iv
        };

        FetchAPI.PostCommentRequest(InsertPatientdetails, auth_token, paramss, async (response) => {
            setLoader(false);
          //  console.log("FORM RESPONSE SEND", response);
            if (response.status === 200) {
                toggleAssignModal();
                sendMessage(auth_token);
                onRefresh();
                Toast.show({ type: 'success', text1: response.msg });
            } else {
                Toast.show({ type: 'error', text1: i18n.t('something_went_wrong') });
            }
        });
    };

    // send notification for patient admission
    const sendMessage = async (auth_token) => {
        const params = { fcm_tokens: fcm_tokens, body: `${getPatientFullName} ${getPatientGender} ${getDOB}`, title: `${'Patient Admission Request'}`, hospital_id: getHospitalId, message_type: 'admission', icu_id: '', document_id: '' };
        FetchAPI.PostCommentRequest(sendNotification, auth_token, params, async (response) => {
            if (response.status === 200) {
                console.log('Message sent successfully', response);
            } else {
                console.log('Error sending message', response);
            }
        });
    };

    // call reassign patient api
    const reAdmitPatientCheck = async (auth_token, uhid) => {
        setLoader(true);
        const params = { uhid: uhid };
        FetchAPI.PostCommentRequest(checkPatientReadmit, auth_token, params, async (response) => {
            if (response.status === 200) {
                setPatientFullName(response.data.full_name);
                setPatientUHID(response.data.uhid);
                setPatientPhone(response.data.phone_number);
                setPatientGender(response.data.gender);
                setDOB(response.data.date_of_birth);
                Toast.show({ type: 'success', text1: response.msg });
                setLoader(false);
            } else if (response.status === 404) {
                setPatientFullName(getPatientFullName);
                setPatientPhone('');
                setPatientGender('');
                setDOB('');
                setLoader(false);
                Toast.show({ type: 'error', text1: response.msg });
            } else {
                try {
                    Toast.show({ type: 'error', text1: i18n.t('something_went_wrong') });
                    setLoader(false);
                } catch (e) {
                    console.log(e);
                    setLoader(false);
                }
            }
        });
    };

    return (
        <View>
            <Modal isVisible={isModalAssignVisible} onBackdropPress={toggleAssignModal} style={styles.bottomModal}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{i18n.t('assign_patient')}</Text>
                    <Text style={[styles.modalTitle, { fontSize: 14, color: colors.textColor, fontFamily: font.regular, }]}>{icuName + ' | '+ i18n.t('bed') + bedNumber}</Text>
                    <TouchableOpacity style={styles.modalHeader} onPress={toggleAssignModal}>
                        <Image source={images.close} style={styles.cancelIcon} />
                    </TouchableOpacity>

                    <View style={styles.inputContainer}>
                        <View style={styles.rowContainer}>
                            <Input containerStyle={styles.inputHalfContainer} label={<Text style={styles.radioLabel} >{i18n.t('patient_name')}</Text>} placeholder={i18n.t('patient_name')} value={getPatientFullName} onChangeText={onInputFullName} errorMessage={fullNameError} inputContainerStyle={styles.inputFieldStyl} inputStyle={styles.inputTextStyl} />
                            <Input containerStyle={styles.inputHalfContainer} label={<Text style={styles.radioLabel}>{i18n.t('uhid')}</Text>} placeholder={i18n.t('patient_hospital_id')} maxLength={10} value={getPatientUHID} onChangeText={onInputUHID} errorMessage={uhidError} inputContainerStyle={styles.inputFieldStyl} inputStyle={styles.inputTextStyl} />
                        </View>

                        <View style={styles.rowContainer}>
                            <Input containerStyle={styles.inputHalfContainer} label={<Text style={styles.radioLabel}>{i18n.t('phone_number')}</Text>} placeholder={i18n.t('phone_number')} keyboardType="number-pad" maxLength={10} value={getPatientPhone} onChangeText={onInputPhone} errorMessage={phoneError} inputContainerStyle={styles.inputFieldStyl} inputStyle={styles.inputTextStyl} />
                            <Input containerStyle={styles.inputHalfContainer} label={<Text style={styles.radioLabel}>{i18n.t('date_of_birth')}</Text>} placeholder={i18n.t('date_of_birth')} keyboardType="default" value={getDOB} onFocus={showDatePicker} onBlur={validateDOB} errorMessage={dobError} inputContainerStyle={styles.inputFieldStyl} inputStyle={styles.inputTextStyl}
                                rightIcon={
                                    <TouchableOpacity onPress={showDatePicker}>
                                        <Icon name="calendar-today" size={24} color="gray" />
                                    </TouchableOpacity>
                                }
                            />
                            {isDatePickerVisible && (
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="date"
                                    display="default"
                                    onChange={handleDateChange}
                                />
                            )}
                        </View>
                        <View style={styles.radioGroupContainer}>
                            <Text style={styles.radioLabel}>{i18n.t('gender')}</Text>
                            <RadioButton.Group
                                onValueChange={value => { setPatientGender(value); }}
                                value={getPatientGender}
                            >
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={styles.radioButtonContainer}>
                                        <RadioButton.Android value="male" color={colors.orangeColor} uncheckedIcon="circle-outline" checkedIcon="check-circle" />
                                        <Text style={styles.radioText}>{i18n.t('male')}</Text>
                                    </View>
                                    <View style={styles.radioButtonContainer}>
                                        <RadioButton.Android value="female" color={colors.orangeColor} />
                                        <Text style={styles.radioText}>{i18n.t('female')}</Text>
                                    </View>
                                    <View style={styles.radioButtonContainer}>
                                        <RadioButton.Android value="other" color={colors.orangeColor} />
                                        <Text style={styles.radioText}>{i18n.t('other')}</Text>
                                    </View>
                                </View>
                            </RadioButton.Group>
                            {genderError ? <Text style={styles.errorText}>{genderError}</Text> : null}
                        </View>
                    </View>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.submitButton} onPress={handleAssign}>
                            <Text style={styles.submitButtonText}>{i18n.t('confirm')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
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
    modalHeader: {
        position: 'absolute',
        right: 10,
        top: 20
    },
    cancelIcon: {
        width: 24,
        height: 24,
    },
    inputContainer: {
        marginBottom: 10,
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputHalfContainer: {
        flex: 1,
        marginRight: 2,
    },
    inputFieldStyl: {
        borderWidth: 1,
        borderColor: colors.borderColor,
        borderRadius: 8,
        paddingHorizontal: 4
    },
    inputTextStyl: {
        color: colors.grayColor,
        fontSize: 12,
        fontFamily: font.regular,
    },
    radioGroupContainer: {
        marginVertical: 5,
        paddingLeft: 10
    },
    radioButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
    },
    radioText: {
        fontSize: 14,
        fontFamily: font.regular,
        color: colors.textColor,
        marginLeft: 1,
        marginRight: 8,
    },
    radioLabel: {
        fontSize: 14,
        fontFamily: font.regular,
        color: colors.textColor,
        marginBottom: 4,
    },
    buttonContainer: {
        justifyContent: "center",
        padding: 10,
    },
    submitButton: {
        backgroundColor: colors.orangeColor,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center'
    },
    submitButtonText: {
        color: colors.white,
        fontSize: 16,
        fontFamily: font.bold,
    },


});

export default AssignPatientModal;
