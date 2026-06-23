import React, {useState,useEffect } from 'react';
import { FlatList, View, StyleSheet, Image, Text, ToastAndroid, Platform,Modal,TouchableOpacity,Alert } from 'react-native';
import Loader from '../Components/Loader';
import * as FetchAPI from '../Services/fetchAPI'
import { getAuthToken, } from "../Services/storage";
import { GetViewDocumentData,DischargePatientReasonApi,UpdateDischaegePatientapi,SendDischargeNotification,refferPatientRequest,refferPatientNotification,refferPatientAPI } from '../Services/APIManager';
import { Dropdown } from 'react-native-element-dropdown';
import { Input } from 'react-native-elements';
import theme from '../assets/theme';
const {strings, images, font} = theme;
import ImageViewer from 'react-native-image-zoom-viewer';
import RNFetchBlob from 'rn-fetch-blob';




const PhotoViewer = ({route,navigation}) =>{
    const [modalVisible, setModalVisible] = useState(false);
    const [isloader, setLoader] = useState(false)
    const [getDocumentsData, setDocummentsData] = useState([]);
    const [getDocumentsView, setDocummentsView] = useState('');
    const [value, setValue] = useState(null);
    const [isFocus, setIsFocus] = useState(false);
    const [getPatientReasonData, setPatientReasonData] = useState([]);
    const [getPatientComments, setPatientComments] = useState('');
    const [getDocumentName, setDocumentName] = useState(null);
    const [getDocumentID, setDocumentID] = useState(null);
    const [getCrop, setCrop] = useState(null);
    const [isCheckDocumentStatus, checkDocumentStatus] = useState(false);
    const [getRotateImage, setRotateImage] = useState(0);
    const [getButtonType, setButtonType] = useState('');

    const zoomImages = [
      {
        url:getDocumentsView?getDocumentsView:null,
      },
    ];
    const fileUrl = getDocumentsView?getDocumentsView:null;

    const onInputComments = (comment) => {
        setPatientComments(comment);
    }

    useEffect(() => {
     // console.log('PARAM CHECK',route.params)
        getAuthToken("auth_token").then(res => {
            getBedDataByICU("Bearer "+res); 
            getDocumentsNameData("Bearer "+res);
            
        })
    
    }, [])
    

    const getBedDataByICU = async (auth_token) => {
        setLoader(true)
    
        var documents_list_data = GetViewDocumentData+route.params.patientID+'/'
        FetchAPI.GetRequestwithauttoken(documents_list_data ,auth_token, async (response) => {
          console.log('Documents list data',response)
          if(response.status === 200){
  
            try {
            setDocummentsData(response.data.documents)
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

    const getDocumentsNameData = async (auth_token) => {
        setLoader(true)
        FetchAPI.GetRequestwithauttoken(DischargePatientReasonApi,auth_token, async (response) => {
          if(response.status === 200){
            try {
            setPatientReasonData(response.data)
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
        getAuthToken("auth_token").then(res => {
          if(getButtonType === 'Discharge'){
            confirmDischargePatient("Bearer "+res);
            console.log('Discharge');
          }else{
            sendRefferPatientRequest("Bearer "+res);
            console.log('Reffer');
          }
            
          })
    }

    const confirmDischargePatient = async (auth_token) => {
      setLoader(true)
      var discharge_patient = SendDischargeNotification+route.params.patientID+'/'
      FetchAPI.PostCommentRequest(discharge_patient,auth_token,'',async(response) => {
        console.log('check discharge response==',response);
        if(response.status === 200){
          if (Platform.OS === 'android') {
            ToastAndroid.show(response.msg, ToastAndroid.SHORT)
          }
          setModalVisible(false)
          navigation.replace('ChooseYourICUName')

          try {
            setModalVisible(false)
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
          setModalVisible(false) 
        }
      })
      
    }

    const sendRefferPatientNotification = async (auth_token) => {
      setLoader(true)
      var reffer_patient = refferPatientNotification+route.params.patientID+'/'
      FetchAPI.PostCommentRequest(reffer_patient,auth_token,'',async(response) => {
        console.log('check discharge notification==',response);
        if(response.status === 200){
          if (Platform.OS === 'android') {
            ToastAndroid.show(response.msg, ToastAndroid.SHORT)
            //sendRefferPatientRequest(auth_token)
          }
          setModalVisible(false)
         // navigation.replace('ChooseYourICUName')

          try {
            setModalVisible(false)
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
          setModalVisible(false) 
        }
      })
      
    }

    const sendRefferPatientRequest = async (auth_token) => {
      setLoader(true)
      const param = {
        "patient_id": route.params.patientID,
        "full_name": route.params.full_name,
        "uhid": route.params.uhid,
        "gender": route.params.gender,
        "date_of_birth": route.params.date_of_birth,
        "phone_number": route.params.phone_number
      }
      FetchAPI.PostCommentRequest(refferPatientAPI,auth_token,param,async(response) => {
        console.log('check discharge details response==',response);
        if(response.status === 200){
          ToastAndroid.show(response.message, ToastAndroid.SHORT)
          setModalVisible(false)
          sendRefferPatient(auth_token)
         // navigation.replace('ChooseYourICUName')
        }else{
          setLoader(false)
          ToastAndroid.show(response.message, ToastAndroid.SHORT)
          setModalVisible(false) 
        }
      }) 
    }

    const sendRefferPatient = async (auth_token) => {
      setLoader(true)
      var reffer_patient = refferPatientRequest+route.params.patientID+'/'
      const param = {"reason": "referred"}
      FetchAPI.PostCommentRequest(reffer_patient,auth_token,param,async(response) => {
        console.log('check reffer response==',response);
        if(response.status === 200){
          if (Platform.OS === 'android') {
            ToastAndroid.show(response.msg, ToastAndroid.SHORT)
          }
          
          setModalVisible(false)
          navigation.replace('ChooseYourICUName')

          try {
            setModalVisible(false)
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
          setModalVisible(false) 
        }
      }) 
    }

    

    

    const submitDischargeReason = async (auth_token) =>{
        setLoader(true)
    
        const params = { reason: value, comments: getPatientComments,  };
        var update_discharge_patient = UpdateDischaegePatientapi+route.params.patientID+'/'
        FetchAPI.PostCommentRequest(update_discharge_patient,auth_token, params, async (response) => {
    
          if(response.status === 200){
    
            if (Platform.OS === 'android') {
              ToastAndroid.show(response.msg, ToastAndroid.SHORT)
            }
            setModalVisible(false)
            navigation.replace('ChooseYourICUName')
            try {
                setModalVisible(false)
             // navigation.replace('ChooseYourICUName')
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
            setModalVisible(false) 
          }
        })
      }



    const downloadImage = async () => {
         // Get today's date to add the time suffix in filename
    let date = new Date();
    // File URL which we want to download
  //  let FILE_URL = fileUrl;    
    // Function to get extention of the file url
    let file_ext = getFileExtention(getDocumentsView);
   
    file_ext = '.' + file_ext[0];
   
    // config: To get response by passing the downloading related options
    // fs: Root directory path to download
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
      .fetch('GET', getDocumentsView)
      .then(res => {
        // Alert after successful downloading
        console.log('res -> ', JSON.stringify(res));
        alert('File Downloaded Successfully.');
      });
      };

      const getFileExtention = fileUrl => {
        // To get the file extension
        return /[.]/.exec(fileUrl) ?
                 /[^.]+$/.exec(fileUrl) : undefined;
      };

    
    return(
        <View style={styles.container}>
            {isloader === true && <Loader visible></Loader>}
            <TouchableOpacity onPress={() => {navigation.goBack()}} style = {{flexDirection:'row'}}>
                <Image source={images.back_arrow} 
                style = {{width:30,height:35,}} tintColor={'#3D3D3D'}/>
                <Image
                    source={images.logo_img}
                    style={{
                    width: '30%',
                    height: 40,
                    resizeMode: 'contain',
                    marginBottom:40,
                    marginTop:4,
                    }}
                />
            </TouchableOpacity>
            

            <View style={styles.centeredView}>
                <Modal animationType="slide" transparent={true} visible={modalVisible}>
                <View style={[styles.centeredView,{marginTop:-120}]}>
                    <View style={styles.modalView}>
                    
                    <Text style={styles.popupTextStyl}>{`Do you want to ${getButtonType === 'Discharge' ? 'discharge' : 'refer'} this patient?`}</Text>
                    <View style = {styles.view_line}></View>
                    {/* <Text style={styles.popupTextStyl}>{'Choose reason of discharge'}</Text> */}

                    {/* <Dropdown
                        style={[styles.dropdown, isFocus && { borderColor: 'blue', }]}
                        data={getPatientReasonData}
                        selectedTextStyle={{color:'white',}}
                        search
                        maxHeight={300}
                        placeholderStyle={{color:'#919191',}}
                        labelField="name"
                        valueField="id"
                        placeholder={!isFocus ? 'Select item' : '...'}
                        searchPlaceholder="Search..."
                        value={value}
                        onFocus={() => setIsFocus(true)}
                        onBlur={() => setIsFocus(false)}
                        onChange={item => {
                            setValue(item.id);
                            setIsFocus(false);
                        }}
                    /> */}

                    {/* <Text style={styles.popupTextStyl}>{'Comments '}</Text> */}

                    {/* <View style={styles.date_view_styl}>
                        <Input
                        inputStyle={{color:'#ffffff', alignContent:'flex-start',justifyContent:'flex-start',textAlignVertical: 'top'}}
                        value={getPatientComments}
                        multiline={true}
                        numberOfLines={5}
                        onChangeText={(text) => onInputComments(text)}
                        placeholder="Enter any comment (Optional)" 
                        placeholderTextColor="#919191"
                        keyboardType="default"
                        blurOnSubmit={false}
                        secureTextEntry={false}
                        returnKeyType="next"
                        
                        />
                    </View> */}

                    <TouchableOpacity style = {{position:'absolute',right:30,top:30}}
                        onPress={() => setModalVisible(false)}>
                        <Text style={{fontSize:25,color:'white'}} >{'x'}</Text>
                    </TouchableOpacity>

                    <View style = {{ width: '100%',position:'absolute',right:30,bottom:30,flexDirection:'row',justifyContent:'space-between'}}>

                    <TouchableOpacity style={[styles.popupButton_style,{backgroundColor:'#F3683F'}]}  onPress={() => setModalVisible(false) }>
                        <Text style={{color:'white',fontSize:15}}>{'Cancel'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.popupButton_style,{backgroundColor:'#F3683F'}]} onPress={() => {validates()}}>
                        <Text style={{color:'white',fontSize:15}}>{'Confirm'}</Text>
                    </TouchableOpacity>

                    </View>

                    
                   
                </View>
                </View>
                </Modal>
            </View>

            <View style = {{position:'absolute',top:15,right:15,flexDirection:'row'}}>
                <TouchableOpacity style={[styles.topButton_style,{backgroundColor:'#2C8170',marginEnd:10}]} onPress={() =>{ setButtonType('Discharge'), setModalVisible(true)}}>
                    <Text style={{color:'white',fontSize:12,fontFamily:font.medium}}>{'Discharge'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.topButton_style,{backgroundColor:'#ff0000',marginEnd:10}]} onPress={() => {setButtonType('Refffer'), setModalVisible(true)}}>
                    <Text style={{color:'white',fontSize:12,fontFamily:font.medium}}>{' Refffer '}</Text>
                </TouchableOpacity>
                          
               {isCheckDocumentStatus? <TouchableOpacity style={[styles.topButton_style,{backgroundColor:'#F3683F'}]} onPress={() => navigation.navigate('ReUploadDocument',{'patientID':route.params.patientID,'documentsID':getDocumentID,'bedNumber':route.params.bedNumber})}>
                    <Text style={{color:'white',fontSize:12,fontFamily:font.medium}}>{'Re-Upload Document'}</Text>
                </TouchableOpacity>:
                <TouchableOpacity style={[styles.topButton_style,{backgroundColor:'#F3683F'}]} onPress={() => navigation.navigate('AddNewDocuments',{'patientID':route.params.patientID,'bedNumber':route.params.bedNumber})}>
                    <Text style={{color:'white',fontSize:12,fontFamily:font.medium}}>{'Add New Document'}</Text>
                </TouchableOpacity>
                }
            </View>


            <View style= {{width:'100%',height:'100%',}}>
            <View style = {styles.imageViewStyles}>

            {getDocumentsView?
              <ImageViewer
                style={{width:'100%',height:'100%',backgroundColor:'#ffffff',transform: [{rotate: getRotateImage+'deg'}]}}
                imageUrls={zoomImages}
                renderIndicator={() => null}
              />
            :null}
            
            </View>

            <View style={{width:'100%',height:'5%',justifyContent:'space-between',alignItems:'center',backgroundColor:'#ACE3D2',flexDirection:'row',paddingHorizontal:20}}>
                <TouchableOpacity onPress={()=>{setRotateImage(getRotateImage+90)}}>
                <Image style={{width:30,height:30}}  source={images.icon_rotate} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() =>
                  {
                    if(getDocumentsView !== ''){
                      downloadImage()
                    }else{
                      ToastAndroid.show('Please Select FIle', ToastAndroid.SHORT)
                    }
                  }}>
                  <Image style={{width:30,height:30}}  source={images.download_image} />
                </TouchableOpacity>
            </View>

            <View style={{width:'100%',height:'20%',justifyContent:'center',paddingBottom:40,backgroundColor: "#2C8170",}} >
                <FlatList
                numColumns={3}
                data={getDocumentsData}
                renderItem={({item}) => {

                    return (
                    <View style = {{flex:1, paddingVertical:11,paddingHorizontal:15,borderWidth:1,borderColor:'#ffffff',justifyContent:'space-between'}}>
                    <TouchableOpacity style = {{justifyContent:'space-between',flexDirection:'row'}}
                    onPress={() => {
                      setDocummentsView(item.document_image);
                      setDocumentName(item.document_name);
                      setDocumentID(item.document_id);
                      checkDocumentStatus(item.rejected);
                      }}>
                        <Text style={{color: 'white', fontSize:12,lineHeight:20,fontFamily:font.medium}} numberOfLines={1}>{item.document_name}</Text>
                        {item.rejected === true?<Image source={images.rejected_icon} style= {{width:30,height:30,marginLeft:20}}/>:null}
                    </TouchableOpacity>
                    </View>
                    );
                }}
                />
            </View>
            </View>

        </View>
    )

}
export default PhotoViewer;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FCF7F4",
        paddingVertical:40
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        backgroundColor:'#2C8170',
        borderRadius: 10,
        width: '50%',
        height: '20%',
        shadowColor: '#000',
        elevation: 5,
        padding:30
      },
    topButton_style:{
        fontSize:18,
        marginVertical:20,
        justifyContent:'flex-end',
        alignSelf:'flex-end',
        alignItems:'center',
        backgroundColor:'#FF3333',
        paddingVertical:15,
        paddingHorizontal:18,
        borderRadius:5
    },
    imageViewStyles:{
        widthP:'100%',
        height:'75%',
        backgroundColor:'#D1D1D1',
    },
    view_line:{
        width:'100%',
        height:1,
        borderColor:'#A2C0D4',
        borderStyle:'dashed',
        marginVertical:15,
        borderWidth:1
    },
    dropdown: {
        width:'100%',
        height: 45,
        borderColor: '#464646',
        backgroundColor:'#464646',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginTop:15
    },
    date_view_styl:{
        height: 144,
        width:'100%',
        borderWidth: 1,
        borderRadius: 10,
        borderColor: '#464646',
        backgroundColor:'#464646',
        marginTop:15
    },
    popupTextStyl:{
        color:'#ffffff',
        fontSize:16,
        marginTop:15,
       
    },
    popupButton_style:{
        fontSize:18,
        marginVertical:20,
        alignSelf:'flex-start',
        alignItems:'center',
        backgroundColor:'#FF3333',
        paddingVertical:15,
        paddingHorizontal:30,
        borderRadius:5
    },
})