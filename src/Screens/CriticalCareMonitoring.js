import React,{useEffect,useState,useRef} from "react";
import { View,Text,TextInput,StyleSheet,Image,TouchableOpacity,Button,ScrollView,ToastAndroid, Platform  } from "react-native";
import theme from '../assets/theme';
const {strings, images, font} = theme;
import * as FetchAPI from '../Services/fetchAPI'
import { getAuthToken,getDataObject } from "../Services/storage";
import { patientChartRequest,getFCMNotification,sendNotification } from '../Services/APIManager';
import Loader from '../Components/Loader';
import { randomBytes } from 'react-native-randombytes';
import CryptoJS from 'crypto-js';
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from '../locales/i18n';


const CriticalCareMonitoring = ({ route,navigation }) => {
    const [isloader, setLoader] = useState(false)
    const [getPatientTemp, setPatientTemp] = useState("");
    const [getPatientHrMin, setPatientHrMin] = useState('');
    const [getPatientRrMin, setPatientRrMin] = useState('');
    const [getPatientBpSys, setPatientBpSys] = useState('');
    const [getPatientBpDis, setPatientBpDis] = useState('');
    const [getPatientSpoTwo, setPatientSpoTwo] = useState('');
    const [getPatientG, setPatientG] = useState('');
    const [getPatientC, setPatientC] = useState('');
    const [getPatientS, setPatientS] = useState('');
    const [getPatientPupilsLeft, setPatientPupilsLeft] = useState('');
    const [getPatientPupilsRight, setPatientPupilsRight] = useState('');
    const [getPatientRBS, setPatientRBS] = useState('');
    const [getPatientIVOne, setPatientIVOne] = useState('');
    const [getPatientIVTwo, setPatientIVTwo] = useState('');
    const [getPatientNorepinhire, setPatientNorepinhire] = useState('');
    const [getPatientDobutamine, setPatientDobutamine] = useState('');
    const [getPatientUrine, setPatientUrine] = useState('');
    const [getPatientDrain, setPatientDrain] = useState('');
    const [isButtonEnabled, setIsButtonEnabled] = useState(false);
    const inputRefG = useRef(null);
    const inputRefC = useRef(null);
    const inputRefS = useRef(null);
    const inputRef1 = useRef(null);
    const inputRef2 = useRef(null);
    const [getFCMUserToken, setFCMUserToken] = useState([]);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState(""); 
    const [serverPublicKey, setServerPublicKey] = useState('bud8344icu123!@#97&03hjsbb#*&^%#');

    const {id,full_name,hospital} = route.params.patientDetails;

      const padPKCS7 = (data) => {
        const blockSize = 16; // AES block size
        const paddingLength = blockSize - (data.length % blockSize);
        const padding = String.fromCharCode(paddingLength).repeat(paddingLength);
        return data + padding;
      };
    
      const generateIV = () => {
          return new Promise((resolve, reject) => {
              randomBytes(16, (err, bytes) => {
                  if (err) reject(err);
                  resolve(CryptoJS.enc.Hex.parse(bytes.toString('hex')));
              });
          });
      };
    
      const encryptMessage = async (data, secretKey) => {
        const iv = await generateIV();
        const message = JSON.stringify(data);
        const paddedMessage = padPKCS7(message);
    
        const key = CryptoJS.SHA256(secretKey);
        const encrypted = CryptoJS.AES.encrypt(paddedMessage, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.NoPadding
        });
    
          const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
          const ciphertextBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
          const ciphertextUrlSafe = ciphertextBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
          const finalOutput = `${ivBase64}.${ciphertextUrlSafe}`;
      
          return {
            iv: ivBase64,
            ciphertext: ciphertextUrlSafe
          };
      };
    
    const handleSpoTwoChange = (spotwo) => {
        // Check if entered value is less than or equal to 100
        if (spotwo === '' || (parseInt(spotwo) >= 0 && parseInt(spotwo) <= 100)) { 
          // Update the state only if the condition is met
          setPatientSpoTwo(spotwo);
        }
    };

    const handleTextChangeGCS = (text, inputRef) => {
        if (text.length === 1 && inputRef.current) {
          inputRef.current.focus();
        }
    };

    const handleTextChange = (text, inputRef) => {
        if (text.length === 3 && inputRef.current) {
          inputRef.current.focus();
        }
    };

    useEffect(()=>{
        getAuthToken("auth_token").then(res => {
            getFCMTokenFromAPI("Bearer " + res);  
        });
    },[])

    useEffect(() => {
        getDataObject("user_Data").then(response => {
            setFirstName(response.user.first_name);
            setLastName(response.user.last_name);
        }).catch(error => {
            console.error('Error fetching user data:', error);
        });

        setIsButtonEnabled(isEitherFieldEmpty());
    }, [getPatientTemp, getPatientHrMin, getPatientRrMin, getPatientBpSys, getPatientBpDis, getPatientSpoTwo, getPatientG,
        getPatientC, getPatientS, getPatientPupilsLeft, getPatientPupilsRight, getPatientRBS, getPatientIVOne, getPatientIVTwo,
        getPatientNorepinhire, getPatientDobutamine, getPatientUrine, getPatientDrain]);
    
    const isEitherFieldEmpty = () => {
        if (
            getPatientTemp.trim() !== '' ||
            getPatientHrMin.trim() !== '' ||
            getPatientRrMin.trim() !== '' ||
            getPatientBpSys.trim() !== '' ||
            getPatientBpDis.trim() !== '' ||
            getPatientSpoTwo.trim() !== '' ||
            getPatientG.trim() !== '' ||
            getPatientC.trim() !== '' ||
            getPatientS.trim() !== '' ||
            getPatientPupilsLeft.trim() !== '' ||
            getPatientPupilsRight.trim() !== '' ||
            getPatientRBS.trim() !== '' ||
            getPatientIVOne.trim() !== '' ||
            getPatientIVTwo.trim() !== '' ||
            getPatientNorepinhire.trim() !== '' ||
            getPatientDobutamine.trim() !== '' ||
            getPatientUrine.trim() !== '' ||
            getPatientDrain.trim() !== ''
        ) {
           // setIsButtonEnabled(false);
            return true;
        } else {
           // setIsButtonEnabled(true);
            return false;
        }
    };

    const submitChartValueApi = async (auth_token) =>{
        setLoader(true)
        const params = {
            patient_id: id,
            vitals: {
                temperature: getPatientTemp,
                hr: getPatientHrMin,
                rr: getPatientRrMin,
                bp_systolic: getPatientBpSys,
                bp_diastolic: getPatientBpDis,
                spo2_with_o2: getPatientSpoTwo
            },
            neuro: {
                gcs_e: getPatientG,
                gcs_v: getPatientC,
                gcs_m: getPatientS,
                pupils_left: getPatientPupilsLeft,
                pupils_right: getPatientPupilsRight
            },
            dm: {
                rbs: getPatientRBS
            },
            intake: {
                iv: getPatientIVOne,
                rt: getPatientIVTwo,
                dobutamine: getPatientDobutamine,
                norepinephrine: getPatientNorepinhire
            },
            output: {
                urine: getPatientUrine,
                drain: getPatientDrain
            }
        };

        const { iv, ciphertext } = await encryptMessage(params, serverPublicKey);

        const paramss = {
            encrypted_json: ciphertext,
            iv: iv
        };
    
    
        FetchAPI.PostCommentRequest(patientChartRequest,auth_token, paramss, async (response) => {
          //  console.log("chart data SEND", response)
            if(response.status === 200){
                console.log("chart data SEND", response)
                if (Platform.OS === 'android') {
                    ToastAndroid.show(response.message, ToastAndroid.SHORT)
                    sendMessage(auth_token);
                  }
                setLoader(false)
            }else{
                setLoader(false)
            }
         
            setLoader(false)
        })
    
    };

    const sum = (parseInt(getPatientIVOne)?parseInt(getPatientIVOne):'') + (parseInt(getPatientIVTwo)?parseInt(getPatientIVTwo):'') + (parseInt(getPatientDobutamine)?parseInt(getPatientDobutamine):'') + (parseInt(getPatientNorepinhire)?parseInt(getPatientNorepinhire):'');
    const outputSum = (parseInt(getPatientUrine)?parseInt(getPatientUrine):'') + (parseInt(getPatientDrain)?parseInt(getPatientDrain):'')
    const sumGCS = (parseInt(getPatientG)?parseInt(getPatientG):'') + (parseInt(getPatientC)?parseInt(getPatientC):'') + (parseInt(getPatientS)?parseInt(getPatientS):'');

    const getFCMTokenFromAPI = async (auth_token) => {
        var getTokenAPIS = getFCMNotification + hospital + '/'
        FetchAPI.GetRequestwithauttoken(getTokenAPIS, auth_token, async (response) => {
            if (response.status === 200) {
                setFCMUserToken(response.fcm_token)
            } else {
                console.log('Error fetching FCM token')
            }
        })
    };

    const messages = [];

    messages.push(`Patient : ${full_name}`);

    messages.push(`Bed No : ${route.params.bedNumber}`);

    if (getPatientHrMin >= 140) {
        messages.push(`Heart Rate : ${getPatientHrMin}`);
    }
    if (getPatientRrMin >= 25) {
        messages.push(`RR : ${getPatientRrMin}`);
    }
    if (getPatientBpSys > 150) {
        messages.push(`BP Systolic : ${getPatientBpSys}`);
    }
    if (getPatientBpDis < 69) {
        messages.push(`BP Dys : ${getPatientBpDis}`);
    }
    if (getPatientSpoTwo < 90) {
        messages.push(`SpO2 : ${getPatientSpoTwo}`);
    }
    if (sumGCS > 7) {
        messages.push(`GCS : ${sumGCS}`);
    }
    if (getPatientRBS < 70) {
        messages.push(`RBS : ${getPatientRBS}`);
    }
    if (getPatientUrine < 40) {
        messages.push(`Urine : ${getPatientUrine}`);
    }
    if (getPatientDrain < 50) {
        messages.push(`Drain : ${getPatientDrain}`);
    }
   
    messages.push(`Patient_id : ${id}`);
    
    const message_text = messages.join(', ');
    
    //console.log(message_text);
    


    const sendMessage = async (auth_token) => { 
        const params = { fcm_tokens: getFCMUserToken, body: message_text, title: `${firstName} ${lastName}`, hospital_id:hospital ,message_type:'vitals', icu_id:'',document_id: '0'};
        FetchAPI.PostCommentRequest(sendNotification, auth_token, params, async (response) => {
            if (response.status === 200) {
                console.log('Message sent successfully', response)
            } else {
                console.log('Error sending message', response)
            }
        })
    }


    return(
        <SafeAreaView style = {styles.container}>
            {isloader === true && <Loader visible></Loader>}
            <TouchableOpacity onPress={() => {navigation.goBack()}} style = {{flexDirection:'row'}}>
                <Image source={images.back_arrow} 
                style = {{width:30,height:35,tintColor:'#3D3D3D',marginStart:10,marginVertical:15}}/>
                <Text style = {styles.heading} >{i18n.t('critical_care_monitoring')}</Text>
            </TouchableOpacity>

                <ScrollView style={styles.columnView} >
                    <Text style={styles.heading}>{i18n.t('vitals')}</Text>

                    <View style = {styles.horizontalContainer}>
                        <View style = {{flex:1, flexDirection:'column'}}>
                            <View style = {styles.tableContainer}>
                                <Text style={{color:'#3D3D3D',fontWeight:'500'}}>{i18n.t('temperature')}</Text>
                                <Text style={{color:'#3D3D3D',fontSize:10}}>{'(F)'}</Text>
                                <TextInput
                                    style = {styles.inputStyle}
                                    placeholderTextColor="#3D3D3D"
                                    keyboardType={'numeric'}
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    placeholder={''}
                                    maxLength={5}
                                    isPassword={false}
                                    value={getPatientTemp}
                                    onChangeText={(temp) => setPatientTemp(temp)}  
                                />
                            </View>

                            {getPatientTemp !== '' && (<View style = {styles.resultsContainer}>
                                {getPatientTemp >= 95 && getPatientTemp <= 99.9 &&<View style = {{flexDirection:'row', padding:5,}}>
                                    <Image source={images.check_icon} style = {{width:20,height:20,marginEnd:5,padding:5}} />
                                    <Text style = {{fontSize:12,color:'#3D3D3D',fontWeight:'400'}}>{i18n.t('normal_range')}</Text>
                                </View>}
                                {getPatientTemp > 99.9 && <View style = {{flexDirection:'column'}}>
                                <View style = {{flexDirection:'row', padding:8,}}>
                                    <Image source={images.rejected_icon} style = {{width:20,height:20,marginEnd:2,}} />
                                    <Text style = {{fontSize:12,color:'#EB420B',fontWeight:'600'}}>{i18n.t('check_triggers')}</Text>
                                </View>
                                <View style = {{flexDirection:'column', padding:10,}}>
                                    <Text style = {{fontSize:10,color:'#3D3D3D',fontWeight:'500'}}>{'Inj PCM 1 GM iv stat \n Sponging if Doesnot Settle after 15 minutes [Put Ice Packs in Both Groins & Arm Pits] \nIf Doesnot Settle → Connect Command Centre'}</Text>
                                </View>
                                </View>}
                            </View>)}

                        </View>

                        <View style = {{flex:1, flexDirection:'column'}}>
                            <View style = {styles.tableContainer}>
                                <Text style={{color:'#3D3D3D',fontWeight:'500'}}>HR</Text>
                                <Text style={{color:'#3D3D3D',fontSize:10}}>{'(/min)'}</Text>
                                <TextInput
                                    style = {styles.inputStyle}
                                    placeholderTextColor="#3D3D3D"
                                    keyboardType={'numeric'}
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    placeholder={''}
                                    maxLength={3}
                                    isPassword={false}
                                    value={getPatientHrMin}
                                    onChangeText={(hrmin) => setPatientHrMin(hrmin)}  
                                />
                            </View>
                            {getPatientHrMin !== '' && (
                            <View style={styles.resultsContainer}>
                                {(parseInt(getPatientHrMin) >= 50 && parseInt(getPatientHrMin) <= 100) && (
                                    <View style={{ flexDirection: 'row', padding: 10 }}>
                                        <Image source={images.check_icon} style={{ width: 20, height: 20, marginEnd: 10, padding: 5 }} />
                                        <Text style={{fontSize:12,color:'#3D3D3D',fontWeight:'400'}}>{i18n.t('normal_range')}</Text>
                                    </View>
                                )}
                                {(parseInt(getPatientHrMin) < 50 || parseInt(getPatientHrMin) > 100) && (
                                    <View style={{ flexDirection: 'column' }}>
                                        <View style={{ flexDirection: 'row', padding: 10 }}>
                                            <Image source={images.rejected_icon} style={{ width: 20, height: 20, marginEnd: 2, padding: 5 }} />
                                            <Text style={{ fontSize: 12, color: '#EB420B', fontWeight: '600' }}>{i18n.t('check_triggers')}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'column', padding: 12 }}>
                                            <Text style={{ fontSize: 10, color: '#3D3D3D', fontWeight: '500' }}>{'Get ECG/ Check Temperatureand  BP →  Connect Command Centre'}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                            )}
                        </View>

                        <View style = {{flex:1, flexDirection:'column'}}>
                            <View style = {styles.tableContainer}>
                                <Text style={{color:'#3D3D3D',fontWeight:'500'}}>RR</Text>
                                <Text style={{color:'#3D3D3D',fontSize:10}}>{'(/min)'}</Text>
                                <TextInput
                                    style = {styles.inputStyle}
                                    placeholderTextColor="#3D3D3D"
                                    keyboardType={'numeric'}
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    placeholder={''}
                                    maxLength={3}
                                    isPassword={false}
                                    value={getPatientRrMin}
                                    onChangeText={(rrmin) => setPatientRrMin(rrmin)}  
                                /> 
                            </View>
                            {getPatientRrMin !== '' && <View style = {styles.resultsContainer}>
                                {getPatientRrMin >= 16 && getPatientRrMin <= 25 &&<View style = {{flexDirection:'row', padding:10,}}>
                                    <Image source={images.check_icon} style = {{width:20,height:20,marginEnd:10,padding:5}} />
                                    <Text style = {{fontSize:12,color:'#3D3D3D',fontWeight:'400'}}>{i18n.t('normal_range')}</Text>
                                </View>}
                                {getPatientRrMin > 25 && <View style = {{flexDirection:'column'}}>
                                <View style = {{flexDirection:'row', padding:10,}}>
                                    <Image source={images.rejected_icon} style = {{width:20,height:20,marginEnd:2,padding:5}} />
                                    <Text style = {{fontSize:12,color:'#EB420B',fontWeight:'600'}}>{i18n.t('check_triggers')}</Text>
                                </View>
                                <View style = {{flexDirection:'column', padding:10,}}>
                                    <Text style = {{fontSize:10,color:'#3D3D3D',fontWeight:'500'}}>{'To Start O2O 2lt / Mm & Titrate to keep Saquration > 95% \nConnect Command Centre'}</Text>
                                </View>
                                </View>}
                            </View>}
                        </View>
                        
                    </View>
                    

                    <View style = {styles.horizontalContainer}>
                        <View style = {{flex:1, flexDirection:'column'}}>
                            <View style = {styles.tableContainer}>
                                <Text style={{color:'#3D3D3D',fontWeight:'500'}}>BP</Text>
                                <Text style={{color:'#3D3D3D',fontSize:10}}>{'(Systolic/Diastolic)'}</Text>
                                <View style = {{flexDirection:'row'}}>
                                    <TextInput
                                        style = {[styles.inputStyle,{width:60}]}
                                        placeholderTextColor="#3D3D3D"
                                        keyboardType={'numeric'}
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                        placeholder={''}
                                        maxLength={3}
                                        isPassword={false}
                                        value={getPatientBpSys}
                                        onChangeText={(bpsys) => setPatientBpSys(bpsys)}  
                                    />

                                    <TextInput
                                        style = {[styles.inputStyle,{width:60}]}
                                        placeholderTextColor="#3D3D3D"
                                        keyboardType={'numeric'}
                                        autoCapitalize="none"
                                        returnKeyType="done"
                                        placeholder={''}
                                        maxLength={3}
                                        isPassword={false}
                                        value={getPatientBpDis}
                                        onChangeText={(bpdis) => setPatientBpDis(bpdis)}  
                                    />
                                </View>
                            </View>
                            {getPatientBpSys !== '' && getPatientBpDis !== '' && (
                                <View style={styles.resultsContainer}>
                                    {(getPatientBpSys >= 100 && getPatientBpSys <= 130) && (getPatientBpDis >= 69 && getPatientBpDis <= 89) &&
                                        <View style={{ flexDirection: 'row', padding: 10, }}>
                                            <Image source={images.check_icon} style={{ width: 20, height: 20, marginEnd: 10, padding: 5 }} />
                                            <Text style={{fontSize:12,color:'#3D3D3D',fontWeight:'400'}}>{i18n.t('normal_range')}</Text>
                                        </View>}
                                    {(getPatientBpSys < 100 && getPatientBpDis < 69) &&
                                        <View style={{ flexDirection: 'column' }}>
                                            <View style={{ flexDirection: 'row', padding: 10, }}>
                                                <Image source={images.rejected_icon} style={{ width: 20, height: 20, marginEnd: 10, padding: 5 }} />
                                                <Text style={{ fontSize: 12, color: '#EB420B', fontWeight: '600' }}>{i18n.t('check_triggers')}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'column', padding: 10, }}>
                                                <Text style={{ fontSize: 12, color: '#3D3D3D', fontWeight: '500' }}>{'If Patient Calm, Oxygen Saturation >95% RR<20/- \nGive NS 200 ml Bolus\n If SBP less than 100 mmHG , Start Inj. Norepinephrine [8 Mg [2 ampules] + 46 ml ns ] VIA Infusion Pump \nInform Command Centre'}</Text>
                                            </View>
                                        </View>}
                                    {getPatientBpSys > 150 &&
                                        <View style={{ flexDirection: 'column' }}>
                                            <View style={{ flexDirection: 'row', padding: 10, }}>
                                                <Image source={images.rejected_icon} style={{ width: 20, height: 20, marginEnd: 10, padding: 5 }} />
                                                <Text style={{ fontSize: 12, color: '#EB420B', fontWeight: '600' }}>Recheck Trigger factors</Text>
                                            </View>
                                            <View style={{ flexDirection: 'column', padding: 10, }}>
                                                <Text style={{ fontSize: 12, color: '#3D3D3D', fontWeight: '500' }}>{'1. Fever\n2. Agitation / awake on Ventilator\n3. Check GCS\nConnect Command Centre'}</Text>
                                            </View>
                                        </View>}
                                </View>
                            )}
                        </View>


                        <View style = {{flex:1, flexDirection:'column'}}>
                            <View style = {styles.tableContainer}>
                                <Text style={{color:'#3D3D3D',fontWeight:'500'}}>SpO2</Text>
                                <Text style={{color:'#3D3D3D',fontSize:10}}>{'(%)'}</Text>
                                <TextInput
                                    style = {styles.inputStyle}
                                    placeholderTextColor="#3D3D3D"
                                    keyboardType={'numeric'}
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    placeholder={''}
                                    maxLength={3}
                                    isPassword={false}
                                    value={getPatientSpoTwo}
                                    onChangeText={handleSpoTwoChange}  
                                />
                            </View>
                            {getPatientSpoTwo !== '' && <View style = {styles.resultsContainer}>
                                {getPatientSpoTwo > 90 &&<View style = {{flexDirection:'row', padding:10,}}>
                                    <Image source={images.check_icon} style = {{width:20,height:20,marginEnd:10,padding:5}} />
                                    <Text style = {{fontSize:12,color:'#3D3D3D',fontWeight:'400'}}>{i18n.t('normal_range')}</Text>
                                </View>}
                                {getPatientSpoTwo <= 90 && <View style = {{flexDirection:'column'}}>
                                <View style = {{flexDirection:'row', padding:10,}}>
                                    <Image source={images.rejected_icon} style = {{width:20,height:20,marginEnd:10,padding:5}} />
                                    <Text style = {{fontSize:12,color:'#EB420B',fontWeight:'600'}}>{i18n.t('check_triggers')}</Text>
                                </View>
                                <View style = {{flexDirection:'column', padding:10,}}>
                                    <Text style = {{fontSize:12,color:'#3D3D3D',fontWeight:'500'}}>{'To Start O2O 2lt / Mm and Titrate to keep Saquration > 95% \nIf no improvement, Connect Command Centre'}</Text>
                                </View>
                                </View>}
                            </View>}
                        </View>
                        
                        {/* <View style = {{ flex:1,flexDirection:'column'}}>  
                        </View> */}

                    </View>

                    <Text style={styles.heading}>Neuro</Text>

                    <View style = {styles.horizontalContainer}>
                        <View style = {{flex:1, flexDirection:'column'}}>
                            <View style = {[styles.tableContainer,{borderTopColor:'#ECEE9B'}]}>
                                <Text style={{color:'#3D3D3D',fontWeight:'500'}}>GCS</Text>
                                <Text style={{color:'#3D3D3D',fontSize:10}}>{'(E/V/M)'}</Text>
                                <View style = {[styles.inputStyle,{width:120,flexDirection:'row',alignItems:'center',justifyContent:'center'}]}>
                                    <TextInput
                                        ref={inputRefG}
                                        style = {{height:50,width:30,textAlign:'center',fontSize:14,fontWeight:'600',color:'#3D3D3D'}}
                                        placeholderTextColor="#3D3D3D"
                                        keyboardType={'numeric'}
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                        placeholder={''}
                                        maxLength={1}
                                        isPassword={false}
                                        value={getPatientG}
                                        onChangeText={(text) => {
                                            setPatientG(text);
                                            handleTextChangeGCS(text, inputRefC);
                                        }}  
                                    />
                                    <Text style={{color:'#3D3D3D',fontWeight:'600'}}>/</Text>
                                    <TextInput
                                        ref={inputRefC}
                                        style = {{height:50,width:30,textAlign:'center',fontSize:14,fontWeight:'600',color:'#3D3D3D',}}
                                        placeholderTextColor="#3D3D3D"
                                        keyboardType={'numeric'}
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                        placeholder={''}
                                        maxLength={1}
                                        isPassword={false}
                                        value={getPatientC}
                                        onChangeText={(text) => {
                                            setPatientC(text);
                                            handleTextChangeGCS(text, inputRefS);
                                        }}  
                                    />
                                    <Text style={{color:'#3D3D3D',fontWeight:'600'}}>/</Text>
                                    <TextInput
                                        ref={inputRefS}
                                        style = {{height:50,width:30,textAlign:'center',fontSize:14,fontWeight:'600',color:'#3D3D3D',}}
                                        placeholderTextColor="#3D3D3D"
                                        keyboardType={'numeric'}
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                        placeholder={''}
                                        maxLength={1}
                                        isPassword={false}
                                        value={getPatientS}
                                        onChangeText={(texts) => setPatientS(texts)}  
                                    />
                                </View>
                                
                            </View>
                            {getPatientG !== '' && getPatientC !== '' && getPatientS !== '' && (
                                <View style={styles.resultsContainer}>
                                {(sumGCS <= 15 ) && (
                                    <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Image source={images.check_icon} style={{ width: 20, height: 20, marginRight: 10, padding: 5 }} />
                                    <Text style={{fontSize:12,color:'#3D3D3D',fontWeight:'400'}}>{i18n.t('normal_range')}</Text>
                                    </View>
                                )}
                                {(sumGCS > 15) && (
                                    <View style={{ flexDirection: 'column' }}>
                                    <View style={{ flexDirection: 'row', padding: 10 }}>
                                        <Image source={images.rejected_icon} style={{ width: 20, height: 20, marginRight: 10, padding: 5 }} />
                                        <Text style={{ fontSize: 12, color: '#EB420B', fontWeight: '600' }}>{i18n.t('check_triggers')}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'column', padding: 10 }}>
                                        <Text style={{ fontSize: 12, color: '#3D3D3D', fontWeight: '500' }}>
                                           {i18n.t('inform_command_centre')}
                                        </Text>
                                    </View>
                                    </View>
                                )}
                                </View>
                            )}
                        </View>
                        
                        <View style = {{flex:1, flexDirection:'column'}}>
                            <View style = {[styles.tableContainer,{borderTopColor:'#ECEE9B'}]}>
                                <Text style={{color:'#3D3D3D',fontWeight:'500'}}>Pupils</Text>
                                <Text style={{color:'#3D3D3D',fontSize:10}}>{'(Left/Right in mm)'}</Text>
                                <View style = {[styles.inputStyle,,{width:120,flexDirection:'row',alignItems:'center',justifyContent:'center'}]}>
                                    <TextInput
                                        ref={inputRef1}
                                        style = {{height:50,width:40,textAlign:'center',fontSize:14,fontWeight:'600',color:'#3D3D3D',}}
                                        placeholderTextColor="#3D3D3D"
                                        keyboardType={'numeric'}
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                        placeholder={''}
                                        maxLength={3}
                                        isPassword={false}
                                        value={getPatientPupilsLeft}
                                        onChangeText={(pupilsl) => {
                                            setPatientPupilsLeft(pupilsl);
                                            handleTextChange(pupilsl, inputRef2);
                                        }} 
                                    />
                                    <Text style={{color:'#3D3D3D',fontWeight:'600',textAlign:'center'}}>/</Text>
                                    <TextInput
                                        ref={inputRef2}
                                        style = {{height:50,width:40,textAlign:'center',fontSize:14,fontWeight:'600',color:'#3D3D3D',}}
                                        placeholderTextColor="#3D3D3D"
                                        keyboardType={'numeric'}
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                        placeholder={''}
                                        maxLength={3}
                                        isPassword={false}
                                        value={getPatientPupilsRight}
                                        onChangeText={(pupilsr) => setPatientPupilsRight(pupilsr)}  
                                    />
                                </View>
                            </View>
                            {(getPatientPupilsLeft !== '' && getPatientPupilsRight !== '')  && 
                            (<View style = {styles.resultsContainer}>
                                {(getPatientPupilsLeft == getPatientPupilsRight) &&
                                (<View style = {{flexDirection:'row', padding:10,}}>
                                    <Image source={images.check_icon} style = {{width:20,height:20,marginEnd:10,padding:5}} />
                                    <Text style = {{fontSize:12,color:'#3D3D3D',fontWeight:'400'}}>{i18n.t('normal_range')}</Text>
                                </View>)}
                                {(getPatientPupilsLeft !== getPatientPupilsRight) && 
                                (<View style = {{flexDirection:'column'}}>
                                <View style = {{flexDirection:'row', padding:10,}}>
                                    <Image source={images.rejected_icon} style = {{width:20,height:20,marginEnd:10,padding:5}} />
                                    <Text style = {{fontSize:12,color:'#EB420B',fontWeight:'600'}}>{i18n.t('check_triggers')}</Text>
                                </View>
                                <View style = {{flexDirection:'column', padding:10,}}>
                                    <Text style = {{fontSize:12,color:'#3D3D3D',fontWeight:'500'}}>
                                        {'Inform Doctor, Check GCS & Vitals on Priority'}
                                    </Text>
                                </View>
                                </View>)}
                            </View>)}
                        </View>

                        {/* <View style = {{ flex:1,flexDirection:'column'}}>  
                        </View> */}

                    </View>

                    <Text style={styles.heading}>DM</Text>

                    <View style = {styles.horizontalContainer}>
                        <View style = {{ flex:1,flexDirection:'column'}}>  
                        
                            <View style = {[styles.tableContainer,{borderTopColor:'#FDCDAA'}]}>
                                <Text style={{color:'#3D3D3D',fontWeight:'500'}}>RBS</Text>
                                <Text style={{color:'#3D3D3D',fontSize:10}}>{'(Mg/Dl)'}</Text>
                                <View style ={{flexDirection:'row'}} >
                                    <TextInput
                                        style = {styles.inputStyle}
                                        placeholderTextColor="#3D3D3D"
                                        keyboardType={'numeric'}
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                        placeholder={''}
                                        maxLength={3}
                                        isPassword={false}
                                        value={getPatientRBS}
                                        onChangeText={(rbs) => setPatientRBS(rbs)}  
                                    />
                                    
                                </View>
                            </View>
                            {(getPatientRBS !== '' ) && (
                                <View style={styles.resultsContainer}>
                                    {(getPatientRBS >= 80 && getPatientRBS <= 200) && (
                                    <View style={{ flexDirection: 'row', padding: 10 }}>
                                        <Image source={images.check_icon} style={{ width: 20, height: 20, marginEnd: 10, padding: 5 }} />
                                        <Text style={{fontSize:12,color:'#3D3D3D',fontWeight:'400'}}>{i18n.t('normal_range')}</Text>
                                    </View>
                                    )}
                                    {(getPatientRBS >= 201 && getPatientRBS <= 250) && (
                                    <View style={{ flexDirection: 'column' }}>
                                        <View style={{ flexDirection: 'row', padding: 10 }}>
                                            <Image source={images.rejected_icon} style={{ width: 20, height: 20, marginEnd: 2, padding: 5 }} />
                                            <Text style={{ fontSize: 12, color: '#EB420B', fontWeight: '600' }}>{i18n.t('check_triggers')}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'column', padding: 10 }}>
                                            <Text style={{ fontSize: 12, color: '#3D3D3D', fontWeight: '500' }}>
                                                Inform Doctor & Insuline Dose 4 Unit
                                            </Text>
                                        </View>
                                    </View>
                                    )}
                                    {(getPatientRBS >= 251 && getPatientRBS <= 300) && (
                                    <View style={{ flexDirection: 'column' }}>
                                        <View style={{ flexDirection: 'row', padding: 10 }}>
                                            <Image source={images.rejected_icon} style={{ width: 20, height: 20, marginEnd: 2, padding: 5 }} />
                                            <Text style={{ fontSize: 12, color: '#EB420B', fontWeight: '600' }}>{i18n.t('check_triggers')}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'column', padding: 10 }}>
                                            <Text style={{ fontSize: 12, color: '#3D3D3D', fontWeight: '500' }}>
                                                Inform Doctor & Insuline Dose 6 Unit
                                            </Text>
                                        </View>
                                    </View>
                                    )}
                                    {(getPatientRBS >= 301 && getPatientRBS <= 350) && (
                                    <View style={{ flexDirection: 'column' }}>
                                        <View style={{ flexDirection: 'row', padding: 10 }}>
                                            <Image source={images.rejected_icon} style={{ width: 20, height: 20, marginEnd: 2, padding: 5 }} />
                                            <Text style={{ fontSize: 12, color: '#EB420B', fontWeight: '600' }}>{i18n.t('check_triggers')}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'column', padding: 10 }}>
                                            <Text style={{ fontSize: 12, color: '#3D3D3D', fontWeight: '500' }}>
                                                Inform Doctor & Insuline Dose 8 Unit
                                            </Text>
                                        </View>
                                    </View>
                                    )}
                                    {( getPatientRBS < 80 ) && (
                                    <View style={{ flexDirection: 'column' }}>
                                        <View style={{ flexDirection: 'row', padding: 10 }}>
                                            <Image source={images.rejected_icon} style={{ width: 20, height: 20, marginEnd: 2, padding: 5 }} />
                                            <Text style={{ fontSize: 12, color: '#EB420B', fontWeight: '600' }}>{i18n.t('check_triggers')}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'column', padding: 10 }}>
                                            <Text style={{ fontSize: 12, color: '#3D3D3D', fontWeight: '500' }}>
                                                Injection D25 % Stat and check RBS after 10 minutes...Inform command centre
                                            </Text>
                                        </View>
                                    </View>
                                    )}
                                    {(getPatientRBS > 350) && (
                                    <View style={{ flexDirection: 'column' }}>
                                        <View style={{ flexDirection: 'row', padding: 10 }}>
                                        <Image source={images.rejected_icon} style={{ width: 20, height: 20, marginEnd: 2, padding: 5 }} />
                                        <Text style={{ fontSize: 12, color: '#EB420B', fontWeight: '600' }}>{i18n.t('check_triggers')}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'column', padding: 10 }}>
                                        <Text style={{ fontSize: 12, color: '#3D3D3D', fontWeight: '500' }}>
                                            {i18n.t('inform_command_centre')}
                                        </Text>
                                        </View>
                                    </View>
                                    )}
                                </View>
                            )}
                        </View>
                        <View style = {{ flex:1,flexDirection:'column'}}>  
                        </View>
                        <View style = {{ flex:1,flexDirection:'column'}}>  
                        </View>

                    </View>

                    <Text style={styles.heading}>Intake</Text>

                    <View style = {styles.horizontalContainer}>
                        <View style = {{ flex:1,flexDirection:'column'}}>  
                            <View style = {[styles.tableContainer,{borderTopColor:'#D1B3F8'}]}>
                                <Text style={{color:'#3D3D3D',fontWeight:'500'}}>IV</Text>
                                <Text style={{color:'#3D3D3D',fontSize:10}}>{'(ML)'}</Text>
                                <TextInput
                                    style = {styles.inputStyle}
                                    placeholderTextColor="#3D3D3D"
                                    keyboardType={'numeric'}
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    placeholder={''}
                                    maxLength={4}
                                    isPassword={false}
                                    value={getPatientIVOne}
                                    onChangeText={(ivone) => setPatientIVOne(ivone)}  
                                />
                            </View>
                            
                        </View>

                        <View style = {{ flex:1,flexDirection:'column'}}>
                            <View style = {[styles.tableContainer,{borderTopColor:'#D1B3F8'}]}>  
                                <Text style={{color:'#3D3D3D',fontWeight:'500'}}>RT</Text>
                                <Text style={{color:'#3D3D3D',fontSize:10}}>{'(ML)'}</Text>
                                <TextInput
                                    style = {styles.inputStyle}
                                    placeholderTextColor="#3D3D3D"
                                    keyboardType={'numeric'}
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    placeholder={''}
                                    maxLength={4}
                                    isPassword={false}
                                    value={getPatientIVTwo}
                                    onChangeText={(ivtwo) => setPatientIVTwo(ivtwo)}  
                                />
                            </View>
                            
                        </View>

                        <View style = {{ flex:1,flexDirection:'column'}}>
                            <View style = {[styles.tableContainer,{borderTopColor:'#D1B3F8'}]}>  
                                <Text style={{color:'#3D3D3D',fontWeight:'500'}}>Dobutamine</Text>
                                <Text style={{color:'#3D3D3D',fontSize:10}}>{'(ML)'}</Text>
                                <TextInput
                                    style = {styles.inputStyle}
                                    placeholderTextColor="#3D3D3D"
                                    keyboardType={'numeric'}
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    placeholder={''}
                                    maxLength={4}
                                    isPassword={false}
                                    value={getPatientDobutamine}
                                    onChangeText={(dobutamine) => setPatientDobutamine(dobutamine)}  
                                />
                            </View>
                            
                        </View>

                    </View> 

                    <View style = {styles.horizontalContainer}>
                        <View style = {{ flex:1,flexDirection:'column'}}>
                            <View style = {[styles.tableContainer,{borderTopColor:'#D1B3F8'}]}> 
                                <Text style={{color:'#3D3D3D',fontWeight:'500'}}>Norepinhrine</Text>
                                <Text style={{color:'#3D3D3D',fontSize:10}}>{'(ML)'}</Text>
                                <TextInput
                                    style = {styles.inputStyle}
                                    placeholderTextColor="#3D3D3D"
                                    keyboardType={'numeric'}
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    placeholder={''}
                                    maxLength={4}
                                    isPassword={false}
                                    value={getPatientNorepinhire}
                                    onChangeText={(norepinhire) => setPatientNorepinhire(norepinhire)}  
                                />
                            </View>
                            
                        </View>

                        {sum? <View style = {{ flex:1,flexDirection:'column'}}>
                            <View style = {{borderTopColor:'#D1B3F8',padding:0,borderTopWidth:3,marginHorizontal:10,marginTop:48,}}>  
                            </View>
                            <View style = {[styles.resultsContainer,{backgroundColor:'#F5F0FD',padding:10}]}>
                                <Text style={{color:'#3D3D3D',fontWeight:'600',padding:10}}>{i18n.t('total_intake')}</Text>
                                <Text style = {{fontSize:16,color:'#3D3D3D',fontWeight:'600'}}>{sum?sum+' ML':''}</Text>
                            </View>
                        </View>:<View style = {{ flex:1,flexDirection:'column'}}>
                            <View style = {{borderTopColor:'#FAF6F3',padding:0,borderTopWidth:3,marginHorizontal:10,marginTop:45,}}>
                            </View>
                        </View>}

                        <View style = {{ flex:1,flexDirection:'column'}}>  
                        </View>
                        
                    </View>

                    <Text style={styles.heading}>{i18n.t('output')}</Text>

                   
                    <View style = {styles.horizontalContainer}>
                        <View style = {{ flex:1,flexDirection:'column'}}>  
                            <View style = {[styles.tableContainer,{borderTopColor:'#97EEC4'}]}>  
                                <Text style={{color:'#3D3D3D',fontWeight:'500'}}>{i18n.t('urine')}</Text>
                                <Text style={{color:'#3D3D3D',fontSize:10}}>{'(ML)'}</Text>
                                <TextInput
                                    style = {styles.inputStyle}
                                    placeholderTextColor="#3D3D3D"
                                    keyboardType={'numeric'}
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    placeholder={''}
                                    maxLength={4}
                                    isPassword={false}
                                    value={getPatientUrine}
                                    onChangeText={(urine) => setPatientUrine(urine)}  
                                />
                            </View>
                            {getPatientUrine !== '' && (
                                <View style={styles.resultsContainer}>
                                    {getPatientUrine >= 50 && getPatientUrine <= 100 && (
                                    <View style={{ flexDirection: 'row', padding: 10 }}>
                                        <Image source={images.check_icon} style={{ width: 20, height: 20, marginEnd: 10, padding: 5 }} />
                                        <Text style={{fontSize:12,color:'#3D3D3D',fontWeight:'400'}}>{i18n.t('normal_range')}</Text>
                                    </View>
                                    )}
                                    {(getPatientUrine < 50 ) && (
                                    <View style={{ flexDirection: 'column' }}>
                                        <View style={{ flexDirection: 'row', padding: 10 }}>
                                        <Image source={images.rejected_icon} style={{ width: 20, height: 20, marginEnd: 10, padding: 5 }} />
                                        <Text style={{ fontSize: 12, color: '#EB420B', fontWeight: '600' }}>{i18n.t('check_triggers')}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'column', padding: 10 }}>
                                        <Text style={{ fontSize: 12, color: '#3D3D3D', fontWeight: '500' }}>{i18n.t('inform_command_centre')}</Text>
                                        </View>
                                    </View>
                                    )}
                                </View>
                            )}
                        </View>

                        <View style = {{ flex:1,flexDirection:'column'}}>
                            <View style = {[styles.tableContainer,{borderTopColor:'#97EEC4'}]}> 
                                <Text style={{color:'#3D3D3D',fontWeight:'500'}}>{i18n.t('drain')}</Text>
                                <Text style={{color:'#3D3D3D',fontSize:10}}>{'(ML)'}</Text>
                                <TextInput
                                    style = {styles.inputStyle}
                                    placeholderTextColor="#3D3D3D"
                                    keyboardType={'numeric'}
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    placeholder={''}
                                    maxLength={4}
                                    isPassword={false}
                                    value={getPatientDrain}
                                    onChangeText={(drain) => setPatientDrain(drain)}  
                                />
                            </View>
                            
                        </View>

                        {outputSum? <View style = {{ flex:1,flexDirection:'column'}}>
                            <View style = {{borderTopColor:'#97EEC4',padding:0,borderTopWidth:3,marginHorizontal:10,marginTop:45,}}>
                            </View>
                            <View style = {[styles.resultsContainer,{backgroundColor:'#ECFBF3',padding:10}]}>
                                <Text style={{color:'#7C7C7C',fontWeight:'600',padding:10}}>{i18n.t('total_output')}</Text>
                                <Text style={{color:'#3D3D3D',fontSize:16,fontWeight:'600'}}>{outputSum?outputSum+' ML':''}</Text>
                            </View>
                        </View>:<View style = {{ flex:1,flexDirection:'column'}}>
                            <View style = {{borderTopColor:'#FAF6F3',padding:0,borderTopWidth:3,marginHorizontal:10,marginTop:45,}}>
                            </View>
                        </View>}
                        
                    </View>

                    

                </ScrollView>

                    <TouchableOpacity onPress={() => {navigation.navigate('ChatActivity',{"patientID":id,'hospitalId':hospital})} } style={styles.floatingButton}>
                        <Image source={images.chat_icon} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => {navigation.navigate('CriticalCareChartView',{"patientID":id,'hospitalId':hospital})} } style={styles.criticalViewButton}>
                        <Text style={{fontSize:12,color:'#ffffff'}}>{i18n.t('view_critical_care_chart')}</Text>
                    </TouchableOpacity>

                   

                    <TouchableOpacity disabled={!isButtonEnabled} onPress={() => {
                        getAuthToken("auth_token").then(res => {
                            submitChartValueApi("Bearer "+res); 
                          })
                        }} style = {{width:'100%', height:60,backgroundColor:'#ffffff',alignItems:'center',justifyContent:'center',bottom:1,right:1,position:'absolute',}}>
                        <Text style = {{width:'90%',height:40,color:'#ffffff',fontWeight:'600',backgroundColor:isButtonEnabled?'#F3683F':'#FECFAA',textAlign:'center',textAlignVertical:'center'}} >{i18n.t('submit_details')}</Text>
                    </TouchableOpacity>
            
        </SafeAreaView>
    )
};

export default CriticalCareMonitoring;

const styles = StyleSheet.create({
    container: {
        width:'100%',
        height:'100%',
        backgroundColor:'#FAF6F3'
    },
    columnView:{
        width:'100%',
        flexDirection:'column',
        paddingHorizontal:10,
        marginBottom:75,
    },
    heading:{
        fontSize:14,
        fontWeight:'500',
        color:'#7C7C7C',
        marginTop:20,
        marginStart:5
    },
    horizontalContainer:{
        width:'100%',
        flexDirection:'row',
        justifyContent:'space-between',
    },
    tableContainer:{
        flexDirection:'column',
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:'#ffffff',
        marginHorizontal:5,
        marginTop:10,
        borderTopColor:'#96DDEC',
        borderTopWidth:3,
        borderLeftColor:'#E7E1DC',
        borderRightColor:'#E7E1DC',
        borderBottomColor:'#E7E1DC',
        borderLeftWidth:1,
        borderRightWidth:1,
        borderBottomWidth:1,
        paddingTop:10,
        shadowColor:'#353535',
        shadowOffset:{width:2,height:2},
        shadowOpacity:5,
        elevation:5
    },
    inputStyle:{
        width:80,
        height:40,
        backgroundColor:'#ffffff',
        borderRadius:5,
        marginVertical:15,
        borderColor:'#D0D5DD',
        color:'#3D3D3D',
        borderWidth:1,
        textAlign:'center',
        fontSize:14,
        fontWeight:'600',
        marginHorizontal:5
    },
    resultsContainer:{
        borderColor:'#E7E1DC',
        borderWidth:1,
        backgroundColor:'#EDF7F9',
        justifyContent:'center',
        alignItems:'center',
        shadowColor:'#353535',
        shadowOffset:{width:2,height:2},
        shadowOpacity:5,
        elevation:5
    },
    floatingButton: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2C8170',
        alignItems: 'center',
        justifyContent: 'center',
        right: 20,
        bottom: 70,
        elevation: 8, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 4 }, // iOS shadow
        shadowOpacity: 0.5, // iOS shadow
      },
      criticalViewButton: {
        position: 'absolute',
        borderRadius: 5,
        backgroundColor: '#F3683F',
        alignItems: 'center',
        justifyContent: 'center',
        right: 10,
        top: 50,
        padding:10
      },
      buttonText: {
        fontSize: 24,
        color: '#fff',
      },
      dropdown: {
        width:'40%',
        height: 30,
        color:'white',
        borderColor: 'white',
        backgroundColor:'gray',
        borderWidth: 0.2,
        borderRadius: 5,
        paddingHorizontal: 5,
        marginTop:25
      },
})