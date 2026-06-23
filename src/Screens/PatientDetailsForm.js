


import React, {useState,useEffect } from 'react';
import { View, StyleSheet, Image, Text, ToastAndroid, Platform } from 'react-native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { Input } from 'react-native-elements';
import DateTimePickerComp from '../Components/DateTimePickerComp';
import Moment from 'moment';
import { Dropdown } from 'react-native-element-dropdown';
import Loader from '../Components/Loader';
import * as FetchAPI from '../Services/fetchAPI'
import { getAuthToken } from "../Services/storage";
import { InsertPatientdetails,GetICUByHospital,GetBedByHospital,checkPatientReadmit,SeenNotification} from '../Services/APIManager';
import theme from '../assets/theme';
const { font} = theme;


const PatientDetailsForm = ({route,navigation}) => {
    const [isloader, setLoader] = useState(false)
    const [getPatientFullName, setPatientFullName] = useState('');
    const [getPatientUHID, setPatientUHID] = useState('');
    const [getPatientGender, setPatientGender] = useState('');
    const [getDOB, setDOB] = useState('');
    const [getPatientPhone, setPatientPhone] = useState('');
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    
    const [getICUValue, setICUValue] = useState(null);
    const [getBedValue, setBedValue] = useState(null);
    const [isFocus, setIsFocus] = useState(false);

    const [fullNameError, setFullNameError] = useState("")
    const [uhidError, setUHIDError] = useState("")
    const [genderError, setGenderError] = useState("")
    const [dobError, setDOBError] = useState("")
    const [phoneError, setPhoneError] = useState("")

    const [getICuData, setICUData] = useState([])
    const [getBedData, setBedData] = useState([])

    const onInputFullName = (fullName) => {
      setPatientFullName(fullName);
    }

    const onInputUHID = (uhid) => {
      setPatientUHID(uhid);
      if (uhid.length >= 4) {
        getAuthToken("auth_token").then(res => {
          reAdmitPatientCheck("Bearer " + res,uhid);
        });
      }
    }

    const onInputPhone = (phone) => {
      setPatientPhone(phone);
    }

    useEffect(() => {
      setICUValue(route.params?.icuID);
      setBedValue(route.params?.bed_id);

      getAuthToken("auth_token").then(res => {
        getICUByHospitalData("Bearer "+res);  
      })

      setTimeout(() => {
        if(route.params?.refferPatient !=null){
          getAuthToken("auth_token").then(res => {
            reAdmitPatientCheck("Bearer " + res,route.params?.refferPatient);
          });
        }
      }, 1000)
      


    }, [])

    const getICUByHospitalData = async (auth_token) =>{
      setLoader(true)
      
      var icu_list_data = GetICUByHospital+route.params.hospital_ID+'/'

      FetchAPI.GetRequestwithauttoken(icu_list_data, auth_token, async(response) =>{
        console.log('HOSPITAL bed DATA',response)
        if(response.status === 200){
          try {
            setICUData(response.data.icus)
            setLoader(false)
          } catch (e) {
            console.log(e);
            setLoader(false)
          }
        }else{
          setLoader(false)
          if (Platform.OS === 'android') {
            ToastAndroid.show(response.msg, ToastAndroid.SHORT)
          }
        }
      })
    }

    const getBedByHospitalData = async (auth_token,icu_id) =>{
      setLoader(true)

     // console.log('check bed value',GetBedByHospital+icu_id+'/')

      FetchAPI.GetRequestwithauttoken(GetBedByHospital+icu_id+'/', auth_token, async(response) =>{
        if(response.status === 200){
          try {
           // console.log('check bed value',response.data.beds)
            setBedData(response.data.beds)
            setLoader(false)
          } catch (e) {
            console.log(e);
            setLoader(false)
          }
        }else{
          setLoader(false)
          if (Platform.OS === 'android') {
            ToastAndroid.show(response.msg, ToastAndroid.SHORT)
          }
        }
      })
    }

    validates = () => { 
  
      if(getPatientFullName.length == 0){
        setFullNameError("Enter Patient Full Name");
      }else {
        setFullNameError("")
      }
      
      if (getPatientUHID.length == 0) {
        setUHIDError('Enter UHID');
      }else{
        setUHIDError("")
      }

      if (getPatientGender.length == 0) {
        setGenderError('Select Gender');
      }else{
        setGenderError("")
      }

      if (getDOB.length == 0) {
        setDOBError('Enter Patient DOB');
      }else{
        setDOBError("")
      }

      if (getPatientPhone.length == 0) {
        setPhoneError('Enter Patient Phone Number');
      }else{
        setPhoneError("")
      }

      

      if(getPatientFullName.length != 0 && getPatientUHID.length != 0 && getPatientGender.length != 0 && getDOB.length != 0 && getPatientPhone.length != 0){
       // navigation.navigate('PhotoViewer')
       if(getBedValue == null){
        if (Platform.OS === 'android') {
          ToastAndroid.show('Please select ICU and Bed', ToastAndroid.SHORT)
        }
        return
      }
       getAuthToken("auth_token").then(res => {
        submitPatientDetails("Bearer "+res);  
      })
       
      }
     
    }

    const reAdmitPatientCheck = async (auth_token,uhid) =>{
      setLoader(true)
      const params = { uhid: uhid,  };
      FetchAPI.PostCommentRequest(checkPatientReadmit,auth_token, params, async (response) => {
        console.log("Readmit FORM RESPONSE SEND", response)
       
        if(response.status === 200){

          setPatientFullName(response.data.full_name);
          setPatientUHID(response.data.uhid);
          setPatientPhone(response.data.phone_number);
          setPatientGender(response.data.gender);
          setDOB(response.data.date_of_birth)
          
          if (Platform.OS === 'android') {
            ToastAndroid.show(response.msg, ToastAndroid.SHORT)
          }
          setLoader(false)
        }else if(response.status === 404){

          setPatientFullName(getPatientFullName);
         // setPatientUHID(getPatientUHID);
          setPatientPhone('');
          setPatientGender('');
          setDOB('')
          setLoader(false)
        }else{
          try {
            if (Platform.OS === 'android') {
              ToastAndroid.show(response.msg, ToastAndroid.SHORT)
            }
            setLoader(false)
          } catch (e) {
            console.log(e);
            setLoader(false)
          }
        }
      })
    }

    const submitPatientDetails = async (auth_token) =>{
      setLoader(true)
  
      const params = { full_name: getPatientFullName, gender: getPatientGender, date_of_birth: getDOB, phone_number: getPatientPhone, uhid: getPatientUHID, bed: getBedValue, hospital: route.params.hospital_ID };
  
      FetchAPI.PostCommentRequest(InsertPatientdetails,auth_token, params, async (response) => {
       // console.log("FORM RESPONSE SEND", response)
       
        if(response.status === 200){
         // console.log('check icu id value',route.params.icuID)
         if(route.params?.refferPatient !=null){
            
            getAuthToken("auth_token").then(res => {
              seenNotificationValue("Bearer "+res, route.params.notification_id); 
            });

          }else{
            navigation.replace('ChooseYourBedName',{"icuID":route.params?.icuID});
          }
          
         
         
          try {
            if (Platform.OS === 'android') {
              ToastAndroid.show(response.msg, ToastAndroid.SHORT)
            }
            setLoader(false)
          } catch (e) {
            console.log(e);
            setLoader(false)
          }
        }else{
          try {
            if (Platform.OS === 'android') {
              ToastAndroid.show(response.msg, ToastAndroid.SHORT)
            }
            setLoader(false)
          } catch (e) {
            console.log(e);
            setLoader(false)
          }
        }
      })
    }

    //seen notification in case of refer patient
    const seenNotificationValue = async (auth_token,notification_id) => {
      setLoader(true)
      FetchAPI.PostCommentRequest(SeenNotification+notification_id+'/',auth_token,'', async (response) => {
        if(response.status === 200){
          try {
            navigation.replace('ChooseYourBedName',{"icuID":getICUValue});
            setLoader(false)
          } catch (e) {
            console.log(e);
            setLoader(false)
          }
        }else{
          setLoader(false)
          if (Platform.OS === 'android') {
            ToastAndroid.show(response.msg, ToastAndroid.SHORT)
          }
        }
      })  
    }
  
    return (
        <View style={styles.container}>
          {isloader === true && <Loader visible></Loader>}
          <ScrollView>

            <DateTimePickerComp
                mode="date"
                isDateTimePickerVisible={isDatePickerVisible}
                handleDatePicked={(date) => {setDatePickerVisible(false),setDOB(Moment(date).format('YYYY-MM-DD'))}}
                hideDateTimePicker={() => setDatePickerVisible(false)}
            />

            <Image
                source={require('../assets/images/logo.png')}
                style={{
                width: '30%',
                height: 60,
                resizeMode: 'contain',
                marginTop:20,
                marginBottom:20,
                }}
            />

            <TouchableOpacity onPress={() => navigation.goBack()} style = {{flexDirection:'row',marginBottom:20}}>
                <Image source={require('../assets/images/back_arrow.png')} 
                style = {{width:30,height:30,}} tintColor={'#3D3D3D'}/>
                <Text style={{color:'#3D3D3D',fontFamily:font.regular,fontSize:16,marginTop:3}} >{'Insert Patient Details'}</Text>
            </TouchableOpacity>

            <View style = {styles.form_main_view}>

            <Text style={{color:'#FFFFFF',marginVertical:10,fontSize:14,fontFamily:font.regular}} >{'Patient Details'}</Text>

            <View style = {styles.view_line}></View>

            <Text style={{color:'white',marginVertical:10,fontSize:12}} >{'Patient name'}</Text>  
            <View style={styles.date_view_styl}>
            <Input
              inputStyle={{color:'#454545',fontSize:14}}
              value={getPatientFullName}
              onChangeText={(fullName) => onInputFullName(fullName)}
              placeholder="Full Name" 
              placeholderTextColor="#454545"
              inputContainerStyle={{borderBottomWidth:0}}
              keyboardType="default"
              blurOnSubmit={false}
              secureTextEntry={false}
              returnKeyType="next"
            />
            </View>
            {fullNameError.length > 0 && <Text style={styles.errorText_styl} >{fullNameError}</Text>}

            <Text style={{color:'white',marginVertical:10,fontSize:12,fontFamily:font.regular}} >{'UHID'}</Text>
            <View style={styles.date_view_styl}>
            <Input
                inputStyle={{color:'#454545',fontSize:14}}
                value={getPatientUHID}
                onChangeText={(text) => onInputUHID(text)}
                placeholder="Enter Patient Hospital ID"
                placeholderTextColor="#454545"
                inputContainerStyle={{borderBottomWidth:0}}
                keyboardType="default"
                blurOnSubmit={false}
                secureTextEntry = {false}
                returnKeyType="next"
            />
            </View>
            {uhidError.length > 0 && <Text style={styles.errorText_styl} >{uhidError}</Text>}

            <Text style={{color:'white',marginTop:10,fontSize:12,fontFamily:font.regular}} >{'Gender'}</Text>
            <View style={{flexDirection:'row',marginVertical:10}}>

                <TouchableOpacity onPress={() => {setPatientGender('male')}}>
                <Text style={[styles.gender_text_styl,{backgroundColor:getPatientGender =='male'?'#F3683F':'#FFFFFF',borderRadius:5}]} >{'Male'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {setPatientGender('female')}}>
                <Text style={[styles.gender_text_styl,{backgroundColor:getPatientGender =='female'?'#F3683F':'#FFFFFF',borderRadius:5}]} >{'Female'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {setPatientGender('other')}}>
                <Text style={[styles.gender_text_styl,{backgroundColor:getPatientGender =='other'?'#F3683F':'#FFFFFF',borderRadius:5}]} >{'Other'}</Text>
                </TouchableOpacity>

            </View>
            {genderError.length > 0 && <Text style={styles.errorText_styl} >{genderError}</Text>}

            <Text style={{color:'white',marginVertical:10,fontSize:12,fontFamily:font.regular}} >{'Date of Birth'}</Text>
            <TouchableOpacity onPress={() => setDatePickerVisible(true)} style={styles.date_view_styl}>
              <Input
                inputStyle={{color:'#454545',fontSize:14}}
                editable={false}
                placeholder="Date of Birth"
                placeholderTextColor={'#454545'}
                inputContainerStyle={{borderBottomWidth:0}}
                value={getDOB}
                onChangeText={TextInputValue => setDOB(TextInputValue)}
                rightIcon={
                  <Image style={{width:30,height:30,resizeMode: 'contain',}} source={require('../assets/images/calendar_month.png')} tintColor={'#000000'} />
                }
              />
            </TouchableOpacity>
            {dobError.length > 0 && <Text style={styles.errorText_styl} >{dobError}</Text>}

            <Text style={{color:'white',marginVertical:10,fontSize:12,fontFamily:font.regular}} >{'Phone Number'}</Text>
            <View style={styles.date_view_styl}>
              <Input
                  inputStyle={{color:'#454545',fontSize:14}}
                  maxLength={10}
                  placeholder='xxxxxxxxxx'
                  placeholderTextColor={'#454545'}
                  inputContainerStyle={{borderBottomWidth:0}}
                  keyboardType="number-pad"
                  value={getPatientPhone}
                  onChangeText={text => onInputPhone(text)}
              />    
            </View>
            {phoneError.length > 0 && <Text style={styles.errorText_styl} >{phoneError}</Text>}
            </View>

            <TouchableOpacity style={[styles.refferButton_style,{backgroundColor:'#F3683F',borderRadius:5}]} onPress={() => validates()}>
                <Text style={{color:'white',fontSize:14}}>{'Send Request'}</Text>
            </TouchableOpacity>


            <View style = {{position:'absolute',top:10,right:40,flexDirection:'row'}}>
                <View style={{width:150,marginRight:10}}>
                  {/* <Text style={{color:'#909090',fontSize:14,fontFamily:font.regular}}>{'ICU Name'}</Text> */}

                  <Dropdown
                      style={[styles.dropdown, isFocus && { borderColor: 'blue',fontFamily:font.regular }]}
                      data={getICuData}
                      search
                      selectedTextStyle = {{ color:'#ffffff'}}
                      maxHeight={300}
                      labelField="name"
                      valueField="icu_id"
                      placeholder={!isFocus ? route.params.icuName?route.params.icuName: 'Select ICU' : '...'}
                      searchPlaceholder="Search..."
                      placeholderStyle = {{ color:'#ffffff'}}
                      value={getICUValue}
                      onFocus={() => setIsFocus(true)}
                      onBlur={() => setIsFocus(false)}
                      onChange={item => {
                          setICUValue(item.icu_id);
                          setIsFocus(false);
                          getAuthToken("auth_token").then(res => {
                            getBedByHospitalData("Bearer "+res,item.icu_id);  
                          })
                      }}
                      />
      
                </View>

                <View style={{width:150}}>
                    {/* <Text style={{color:'#909090',fontSize:14,fontFamily:font.regular}}>{'Bed Name'}</Text> */}

                    <Dropdown
                        style={[styles.dropdown, isFocus && { borderColor: 'blue',fontFamily:font.regular, }]}
                        data={getBedData}
                        search
                        selectedTextStyle = {{ color:'#ffffff'}}
                        maxHeight={300}
                        labelField="bed_name"
                        valueField="bed_id"
                        placeholder={!isFocus ? route.params.bedNumber? "Bed "+ route.params.bedNumber: 'Select Bed' : '...'}
                        searchPlaceholder="Search..."
                        placeholderStyle = {{ color:'#ffffff'}}
                        value={getBedValue}
                        onFocus={() => setIsFocus(true)}
                        onBlur={() => setIsFocus(false)}
                        onChange={item => {
                            setBedValue(item.bed_id);
                            setIsFocus(false);
                        }}
                        />
                </View>
            </View>
            </ScrollView>

        </View>
    );

}
export default PatientDetailsForm;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF7F4",
    padding:20
  },
  activityIndicator: {
    alignItems: 'center',
    height: 80,
  },
  form_main_view:{
    width:'100%',
    backgroundColor:'#2C8170',
    borderRadius:5,
    padding:20
  },
  view_line:{
    width:'100%',
    borderColor:'#A2C0D4',
    height:1,
    borderStyle:'dashed',
    borderWidth:1,
    marginVertical:15,
  },
  gender_text_styl:{
    color:'#454545',
    backgroundColor:'#464646',
    fontSize:14,
    padding:10,
    marginEnd:15,
  },
  inputStyle: {
    height: 50,
    color: '#ffffff',
    paddingLeft: 20,
    paddingRight: 20,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#464646',
    backgroundColor:'#464646',
  },
  date_view_styl:{
    height: 45,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#464646',
    backgroundColor:'#FFFFFF',
  },
  refferButton_style:{
    fontSize:18,
    marginVertical:20,
    justifyContent:'flex-end',
    alignSelf:'flex-end',
    alignItems:'center',
    backgroundColor:'#FF3333',
    paddingVertical:8,
    paddingHorizontal:30
},
dropdown: {
    height: 45,
    borderColor: '#2C8170',
    backgroundColor:'#2C8170',
    borderWidth: 0.5,
    borderRadius: 5,
    paddingHorizontal: 8,
    marginTop:10,
  },
  errorText_styl:{
    color:'red',
    fontSize:16,
    fontStyle:'italic',
    fontWeight:'400',
    marginTop:5
  }
 
  
});