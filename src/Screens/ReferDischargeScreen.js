import React,{useState,useEffect,useRef} from "react";
import { View,Text,StyleSheet,TouchableOpacity,Image,ToastAndroid,KeyboardAvoidingView,ScrollView } from "react-native";
import Loader from '../Components/Loader';
import theme from '../assets/theme';
const { colors, images, font } = theme;
import { format,parseISO } from 'date-fns';
import { Input } from 'react-native-elements';
import * as FetchAPI from '../Services/fetchAPI'
import { getAuthToken, } from "../Services/storage";
import {SendDischargeNotification,refferPatientRequest,refferPatientAPI } from '../Services/APIManager';
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "../locales/i18n";

const ReferDischargeScreen = ({route,navigation}) =>{
    const [isloader, setLoader] = useState(false)
    const [getHeaderName, setHeaderName] = useState('');
    const [getPrimaryComments, setPrimaryComments] = useState('');
    const [getComments, setComments] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const maxWords = 100;

    const {bed_number,icu,patient} = route.params.selectedItem

    const onInputPrimaryComments = (primaryComment) => {
        const wordCount = primaryComment.trim().split(/\s+/).length;

        if (wordCount <= maxWords) {
            setPrimaryComments(primaryComment);
            setErrorMessage('');
        }
        
    };

    

    const onInputComments = (fullName) => {
        setComments(fullName);
    };

    useEffect(() => {
        setHeaderName(route.params.type)
    }, []);

    validates = () => { 
        const wordCount = getPrimaryComments.trim().split(/\s+/).filter(word => word !== '').length;

        if(wordCount === 0){
           // ToastAndroid.show('Kindly provide the reason for the medical case.', ToastAndroid.SHORT) 
            setErrorMessage(i18n.t('this_field_cannot_empty'));
            return false;
        }else if(wordCount > maxWords){
            setErrorMessage(`Maximum word limit is ${maxWords}.`);
            return false;
        }
        
        
        else{
            getAuthToken("auth_token").then(res => {
                if(route.params.type === i18n.t('refer_patient')){
                    sendRefferPatientRequest("Bearer "+res);
                    console.log('Refer');
                }else{
                    confirmDischargePatient("Bearer "+res);
                    console.log('Discharge');
                }
                  
            })
        };
    };

    const confirmDischargePatient = async (auth_token) => {
        setLoader(true)
        const param = {
            "comment":getComments,
            "reason":getHeaderName,
            "primary_reason":getPrimaryComments,
            "secondary_reason":getComments,
          }
        var discharge_patient = SendDischargeNotification+patient.id+'/'
        FetchAPI.PostCommentRequest(discharge_patient,auth_token,param,async(response) => {
         // console.log('check discharge response==',response);
          if(response.status === 200){
            setLoader(false)
            ToastAndroid.show(response.msg, ToastAndroid.SHORT);
            navigation.goBack();
          }else{
            setLoader(false)
            ToastAndroid.show(i18n.t('something_went_wrong'), ToastAndroid.SHORT) 
          }
        })
    };

    const sendRefferPatientRequest = async (auth_token) => {
        setLoader(true)
        const param = {
          "patient_id": String(patient.id) ,
          "full_name": patient.full_name,
          "uhid": patient.patient_id,
          "gender": patient.gender,
          "date_of_birth": patient.date_of_birth,
          "phone_number": patient.phone_number,
          "comment":getComments,
          "reason":getHeaderName,
        }
        FetchAPI.PostCommentRequest(refferPatientAPI,auth_token,param,async(response) => {
         // console.log('check discharge details response==',response);
          if(response.status === 200){
            ToastAndroid.show(response.message, ToastAndroid.SHORT)
            sendRefferPatient(auth_token);
          }else{
            setLoader(false)
            ToastAndroid.show(response.message, ToastAndroid.SHORT)
            setModalVisible(false) 
          }
        }) 
    };

    const sendRefferPatient = async (auth_token) => {
        setLoader(true)
        var reffer_patient = refferPatientRequest+patient.id+'/'
        const param = {"reason": "referred"}
        FetchAPI.PostCommentRequest(reffer_patient,auth_token,param,async(response) => {
         // console.log('check reffer response==',response);
          if(response.status === 200){
            setLoader(false)
            ToastAndroid.show(response.msg, ToastAndroid.SHORT)
            navigation.goBack();
          }else{
            ToastAndroid.show(i18n.t('something_went_wrong'), ToastAndroid.SHORT)
          }
        }) 
    };

    const wordCount = getPrimaryComments.trim().split(/\s+/).filter(word => word !== '').length;

    return(
        <SafeAreaView style = {styles.container}>
        <KeyboardAvoidingView style = {styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style = {styles.headerContainer}>
                <TouchableOpacity onPress={() => {navigation.goBack()}} style ={styles.backContainer}>
                    <Image source={images.back_arrow} tintColor={colors.grayColor} style={{width:35,height:35}}/>
                    <Text style ={styles.headerText} >{getHeaderName+' '+ i18n.t('patient') }</Text>
                </TouchableOpacity>
            </View>

            <View style = {styles.patientContainer}>
                <View>
                    <Text style={styles.patientDetailsText}>{i18n.t('bed') + ': '+ bed_number}</Text>
                    <Text style={[styles.patientDetailsText,{fontFamily:font.bold}]}>{patient.full_name}</Text>
                    <Text style={styles.patientDetailsText}>{i18n.t('gender') +': '+ patient.gender}</Text>
                    <Text style={styles.patientDetailsText}>{i18n.t('age')+ patient.age}</Text>
                </View>

                <View style={{justifyContent:'flex-end',alignItems:'flex-end'}}>
                    <Text style={styles.patientDetailsText}>{}</Text>
                    <Text>{''}</Text>
                    <Text style={styles.patientDetailsText}>{i18n.t('uhid')+': '+ patient.patient_id}</Text>
                    <Text style={styles.patientDetailsText}>{i18n.t('admission_date') + format(parseISO(patient?.date_of_admitions), 'dd MMMM yyyy')}</Text>
                </View>

            </View>

            
            <View style={{ padding: 10 }}>
                <Input 
                    label={<Text style={styles.reasonHeader}>{i18n.t('enter_primary_diagnose')}</Text>}
                    placeholder={i18n.t('add_diagnose')} 
                    value={getPrimaryComments} 
                    onChangeText={onInputPrimaryComments} 
                    inputContainerStyle={styles.inputFieldStyl} 
                    inputStyle={styles.inputTextStyl} 
                    numberOfLines={1}
                    textAlignVertical="top"  // Ensures the text starts at the top of the textarea
                />
                {/* Word count display */}
                <Text style={{position: 'absolute', right: 30, top: 145, color: 'grey', fontSize: 12 }}>
                    {maxWords - wordCount}
                </Text>

                {/* Display error message if validation fails */}
                {errorMessage ? <Text style={{ color: 'red', marginTop: -15, marginLeft: 15, marginBottom: 15 }}>{errorMessage}</Text> : null}

                <Input 
                    label={<Text style={styles.reasonHeader}>{i18n.t('enter_secondary_diagnose')}</Text>}
                    placeholder={i18n.t('add_diagnose_optional')}
                    value={getComments} 
                    onChangeText={onInputComments} 
                    inputContainerStyle={styles.inputFieldStyl} 
                    inputStyle={styles.inputTextStyl} 
                    numberOfLines={1}  
                    textAlignVertical="top"  // Ensures the text starts at the top of the textarea
                />
            </View>

            

            <View style={styles.bottomContainer}>
                <TouchableOpacity onPress={() => {navigation.goBack()}} style={styles.cancelButton}>
                    <Text style={styles.buttonText}>{i18n.t('cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {validates()}} style={styles.confirmButton}>
                    <Text style={[styles.buttonText,{color: colors.white}]}>{ i18n.t('confirm')}</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </KeyboardAvoidingView>
        </SafeAreaView>
    )
};

export default ReferDischargeScreen;

const styles = StyleSheet.create({
    container:{
        flex:1,
        backgroundColor:colors.backgroundScreen,
    },
    headerContainer:{
        padding: 10,
        marginBottom: 5,
        shadowColor: colors.black,
        shadowOffset: {
            width: 5,
            height: 5,
        },
        shadowOpacity: 0.5,  
        shadowRadius: 5,  
        elevation: 5,
        backgroundColor:colors.backgroundScreen, 
    },
    headerText:{
        fontSize:16,
        fontFamily:font.bold
    },
    backContainer:{
        flexDirection:'row'
    },
    patientContainer: {
        padding: 8,
        margin: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderColor: colors.lightElfGreen,
        borderStyle: 'dashed',
        borderWidth: 1,
        backgroundColor: colors.lightGrey,
        borderRadius:8
    },
    patientDetailsText: {
        fontFamily: font.light,
        fontSize: 14,
        color: '#4F4F4F',
        padding:2,
    },
    radioButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioText: {
        fontSize: 14,
        fontFamily: font.regular,
        color: colors.grayColor,
        marginRight: 10,
    },
    reasonHeader:{
        fontSize:14,
        fontFamily:font.regular,
        paddingLeft:5,
        marginBottom:5
    },
    inputFieldStyl:{
        borderWidth:1,
        borderColor:colors.borderColor,
        borderRadius:8,
        paddingLeft: 5,
        backgroundColor: colors.white,
    },
    inputTextStyl:{
        color:colors.grayColor,
        fontSize:14,
        fontFamily: font.regular,
    },
    radioLabel: {
        fontSize: 16,
        fontFamily: font.regular,
        color: colors.textColor,
        marginBottom: 5,
    },
    bottomContainer:{
        position: 'absolute', 
        bottom: 0, 
        left: 0,
        right: 0,
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        padding: 15,
        backgroundColor: colors.white,
    },
    cancelButton:{
        flex: 0.3, // Takes up 30% of the width
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        backgroundColor: colors.white, // Style as needed
        borderRadius: 8,
        borderWidth:1,
        borderColor:colors.borderColor
    },
    buttonText:{
        color: colors.orangeColor, // Style text as needed
        fontSize: 14,
        fontFamily: font.bold,
    },
    confirmButton:{
        flex: 0.65, // Takes up 70% of the width
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        backgroundColor: colors.orangeColor, // Style as needed
        borderRadius: 8,
    }
})