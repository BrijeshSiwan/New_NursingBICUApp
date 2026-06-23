import React, {useState } from 'react';
import { View, StyleSheet, Image, Text, ToastAndroid, Platform } from 'react-native';
import {  TouchableOpacity } from 'react-native-gesture-handler';
import { Dropdown } from 'react-native-element-dropdown';
import ImagePicker,{ImageOrVideo} from 'react-native-image-crop-picker';
import {storeCaptureDocuments} from '../Services/storage';
import Loader from '../Components/Loader';
import * as FetchAPI from '../Services/fetchAPI'
import { getAuthToken } from "../Services/storage";
import { GetDocumentNameList,ReUploadDocumentHospital } from '../Services/APIManager';
import RNFetchBlob from 'rn-fetch-blob';
import theme from '../assets/theme';
const {strings, images, font} = theme;



const ReUploadDocument = ({route,navigation}) =>{
    const [isloader, setLoader] = useState(false)
    const [value, setValue] = useState(null);
    const [isFocus, setIsFocus] = useState(false);
    const [getImage, setImage] = useState(null);
    const [getBedNameData, setBedNameData] = useState([]);


    React.useEffect(() => {
        setTimeout(async () => {
            select_photo()
       }, 1000);
       
        getAuthToken("auth_token").then(res => {
            getDocumentsNameData("Bearer "+res);  
        })
    }, [])

    const getDocumentsNameData = async (auth_token) => {
        setLoader(true)
        FetchAPI.GetRequestwithauttoken(GetDocumentNameList,auth_token, async (response) => {
          if(response.status === 200){
          
            try {
              setBedNameData(response.data)
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
    

    const select_photo = () => {
        ImagePicker.openCamera({
           
            cropping: true,
          }).then(image => {
          //  console.warn('image =',image);
            setImage({
                uri: image.path,
                width: image.width,
                height: image.height,
                mime: image.mime,
            });
               
          })
          .catch((e) => alert(e));
    }

    const profileimageupdate = async (auth_token,patientID) => {

        RNFetchBlob.fetch('POST', ReUploadDocumentHospital+route.params.documentsID+'/edit/', {
            Authorization : auth_token,
            'Content-Type' : 'multipart/form-data',
        }, [
            
            {
                name: "document_image",
                filename: "image.png",
                type: "image/png",
                data: RNFetchBlob.wrap( getImage.uri),
              },
              {
                name: "document_name",
                data: value,
              },
              {
                name: "patient",
                data: `${patientID}`,
              },
           
        ]).then((resp) => {
            console.log("resppp",resp);
            navigation.replace('PhotoViewer',{"patientID":patientID});
            if (Platform.OS === 'android') {
                ToastAndroid.show("Uploaded Successfully", ToastAndroid.SHORT)
            }
        }).catch((err) => {
            console.log("err_resp",err)
        })

    };

    return(
        <View style={styles.container}>
            {isloader === true && <Loader visible></Loader>}
            <TouchableOpacity onPress={() => {navigation.goBack()}} style = {{flexDirection:'row'}}>
                <Image source={images.back_arrow} 
                style = {{width:45,height:35,marginTop:30,}}/>
                <Image
                    source={images.logo_img}
                    style={{
                    width: '30%',
                    height: 40,
                    resizeMode: 'contain',
                    marginVertical:25,
                    }}
                />
            </TouchableOpacity>

            <View style = {{position:'absolute',top:40,right:40,flexDirection:'row'}}>
                <Text style={{color:'white',fontSize:18}}>{'Re-Uploading Bed '+route.params.bedNumber  +' Patient Documment'}</Text>
            </View>

            <View style={{width:'100%',height:80,flexDirection:'row',backgroundColor:'#353535',justifyContent:'center',alignItems:'center'}}>
                <Text style={{marginRight:10,color:'white',fontSize:18}}>{'New Document Name: '}</Text>

                <Dropdown
                    style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
                    data={getBedNameData}
                    search
                    maxHeight={300}
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
                />
    
            </View>

            <View style = {styles.imageViewStyles}>

               {getImage? <Image style={{width:'100%',height:'100%',resizeMode: 'contain',}} source={{uri:getImage.uri}}/>:null}
            
            </View>

            <View style = {{position:'absolute',bottom:30,right:40,flexDirection:'row'}}>
                <TouchableOpacity style={[styles.topButton_style,{backgroundColor:getImage?'#4E4E4E':'#F3683F',marginEnd:30}]} onPress={() => select_photo()}>
                    <Text style={{color:'white',fontSize:16}}>{getImage?'Recapture':'Capture'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.topButton_style,{backgroundColor:'#F3683F'}]} onPress={() => {
                    storeCaptureDocuments('capture_image',getImage.uri)
                    getAuthToken("auth_token").then(res => {

                        if(value == null){
                            if (Platform.OS === 'android') {
                                ToastAndroid.show("Please Select Documents Name", ToastAndroid.SHORT)
                            }
                            return
                        }else{
                            profileimageupdate("Bearer "+res,route.params.patientID);  
                        }      
                    })
                    ;}}>
                    <Text style={{color:'white',fontSize:16}}>{'Submit'}</Text>
                </TouchableOpacity>
            </View>


        </View>
    )

}
export default ReUploadDocument;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1E1E1E",
    },
    topButton_style:{
        fontSize:18,
        marginVertical:20,
        justifyContent:'flex-end',
        alignSelf:'flex-end',
        alignItems:'center',
        backgroundColor:'#FF3333',
        paddingVertical:15,
        paddingHorizontal:30,
        borderRadius:5
    },
    imageViewStyles:{
        width:'100%',
        height:'75%',
        backgroundColor:'white'
    },
    dropdown: {
        width:'60%',
        height: 45,
        borderColor: 'white',
        backgroundColor:'white',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginTop:5
      },
})