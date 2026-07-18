import {Alert, Platform} from 'react-native';

let axiosConfig = {
  headers: {
      'Accept': 'application/json',
  }
};

const axios = require('axios');
//const Base_URL = 'http://192.168.1.6:8000/';
//const Base_URL = 'https://budgeticu.toystack.dev/'; 
//const Base_URL = 'https://buddgeticustablebuild.toystack.dev/';
export const Base_URL = 'https://api.aido.care/';

export const LoginApi = Base_URL + 'user/api/v1/login/';
//export const getICUNameList = Base_URL + 'hospital/api/hospital/user/'
export const GetBedByICU = Base_URL + 'hospital/api/beds/icu/';
export const InsertPatientdetails = Base_URL + 'hospital/api/v1/user/add_patient/';
export const GetICUByHospital = Base_URL + 'hospital/api/icu/hospital/';//now
export const GetBedByHospital = Base_URL + 'hospital/api/emptybeds/icu/';
export const GetViewDocumentData = Base_URL + 'hospital/api/documents/patient/';
export const GetDocumentNameList = Base_URL + 'hospital/api/documents/list/';
export const UploadDocuments = Base_URL + 'hospital/v1/documents/';
export const UploadLabReport = Base_URL + 'suggestion/api/extract-text/';
export const NotificationListApi = Base_URL + 'notification/api/notifications/';
export const DischargePatientReasonApi = Base_URL + 'hospital/api/patients/dischargelist/';
export const UpdateDischaegePatientapi = Base_URL + 'hospital/api/patients/discharge/';
export const ReUploadDocumentHospital = Base_URL+'hospital/documents/';
//export const GetHospitalICUList = Base_URL+'hospital/icus';//before
export const SeenNotification = Base_URL+'notification/api/notification/seen/';
export const SendDischargeNotification = Base_URL+'notification/api/discharge_notification/patient/';
export const patientChartRequest = Base_URL+'hospital/patient-v1/';
export const sendNotification = Base_URL+ 'user/send/';
export const getFCMNotification = Base_URL + 'user/get_fcm_token/';
export const checkPatientReadmit = Base_URL + 'hospital/api/check-uhid/';
export const refferPatientNotification = Base_URL + 'notification/api/refer_notification/patient/';
export const refferPatientRequest = Base_URL + 'hospital/api/patients/discharge/';
export const refferPatientAPI = Base_URL + 'notification/api/refer-patient/';
export const checkAppUpdateVersion = Base_URL + 'notification/api/nurse-app/version-control/';
export const viewDocuments = Base_URL + 'hospital/api/documents/document/';
export const rejectDocumentsApi = Base_URL + 'hospital/api/documents/reject/';
export const logoutApi = Base_URL + 'user/api/logout/';
export const videoCallNotification = Base_URL + 'notification/api/notify/video-call';
export const downloadVitalsChart = Base_URL+ 'hospital/chart-download/'





export const doLogin = param => {
  return axios
    .post(Login, param)
    .then(response => response)
    .catch(error => error);
};


export const PostRequest = function (URL, callback) {
  console.log(URL)

  axios({
    method: 'POST',
    url: URL,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    // data: ''
  }).then(response => {
    callback(response.data);
  }).catch(err => {
    callback(err);
  })
}