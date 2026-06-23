import { Dimensions, Platform, PixelRatio,PermissionsAndroid } from 'react-native';

import Spinner from 'react-native-loading-spinner-overlay';

export const settings = "app_setting";


// -----staging Base Url------
export const base_url = "https://holybasilplus.com/hb/public/api/markers/";



export const sendOtpapi = base_url+"send-otp";
export const verifyOtplab = base_url+"verify-otp";
export const verifyOtpNormal = base_url+"verify-otp-normal";
export const updateuserdata = base_url+"update-userdata";
export const calculate = base_url+"calculate";
export const userreports = base_url+"check-userreports";
export const getuserreports = base_url+"get-userreports";

//Font Family
export const inter_bold  = "Inter-Bold";
export const inter_regular  = "Inter-Regular";
export const inter_medium  = "Inter-Medium";
export const inter_semiBold  = "Inter-SemiBold";



// export function Loader(props){
// 	return <Spinner
//       visible={props.visible}
//       color={theme_fg}
//       size="large"
//       animation="fade"
//     />

// }

//Color Code
export const colorwhite= '#ffffff';

export const backgroundColor= '#008fe2';
export const backcolorCode= '#171717';

export const theme_fg = "#EF8364";


export const standardWidth = 414;
export const standardHeight = 812;
export const standardWidthiPad = Platform.OS === 'ios' ? 1194 : 1080;
export const standardHeightiPad = Platform.OS === 'ios' ? 834 : 1920;
export const screenWidth = Math.round(Dimensions.get('window').width);
export const screenHeights = Math.round(Dimensions.get('window').height);
export const fontRatioPhones = Math.round(Dimensions.get('window').width) / (Platform.OS === 'ios' ? 375 : 400);
export var drawerNavigation = null;





export function getSizeWidth(value) {
  var screenRatio = screenWidth / standardWidth;
  if (isTabletiPad() === true) {
    screenRatio = screenWidth / standardWidthiPad;
  }
  return (value / standardWidth) * Dimensions.get('window').width;
}
export function getAspectRatioHeight(value) {
  var screenRatio = screenWidth / standardWidth;
  if (isTabletiPad() === true) {
    screenRatio = screenWidth / standardWidthiPad;
  }
  return (value / standardWidth) * Dimensions.get('window').width;
}
export function getSizeHeight(value) {
  var screenRatio = screenHeights / standardHeight;
  if (isTabletiPad() === true) {
    screenRatio = screenHeights / standardHeightiPad;
  }
  return value * screenRatio;
}
export function getFontRatio(value) {
  if (isTabletiPad() === true) {
    return (
      (value * Math.round(Dimensions.get('window').width)) /
      (Platform.OS === 'ios' ? 600 : 500)
    );
  }
  return (
    (value * Math.round(Dimensions.get('window').width)) /
    (Platform.OS === 'ios' ? 375 : 400)
  );
}
export function isTabletiPad() {
  if (Platform.OS === 'ios') {
    return Platform.isPad;
  } else {
    let ratio = PixelRatio.get();
    // let ratio = height / width
    if (ratio > 1.6) {
      return false;
    } else {
      return true;
    }
  }
}

