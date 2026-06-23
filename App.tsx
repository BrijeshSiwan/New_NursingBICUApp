// Example of Splash, Login and Sign Up in React Native
// https://aboutreact.com/react-native-login-and-signup/
import 'react-native-gesture-handler';
import React from 'react';

import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

// Import Screens 
import SplashScreen from './src/Screens/SplashScreen';
import LoginScreen from './src/Screens/LoginScreen';
import ChooseYourICUName from './src/Screens/ChooseYourICUName';
import ChooseYourBedName from './src/Screens/ChooseYourBedName';
import PatientDetailsForm from './src/Screens/PatientDetailsForm';
import AddNewDocuments from './src/Screens/AddNewDocuments';
import PhotoViewer from './src/Screens/PhotoViewer';
import ReUploadDocument from './src/Screens/ReUploadDocument';
import CriticalCareMonitoring from './src/Screens/CriticalCareMonitoring';
import ChatActivity from './src/Screens/ChatActivity';
import CriticalCareChartView from './src/Screens/CriticalCareChartView';
import NotificationList from './src/Screens/NotificationList';
import PatientDocumentsList from './src/Screens/PatientDocumentsList';
import PatientDocumentView from './src/Screens/PatientDocumentView';
import BotChat from './src/Screens/BotChat';
import IcuBedsScreen from './src/Screens/IcuBedsScreen';
import ReferDischargeScreen from './src/Screens/ReferDischargeScreen';
import AddLabReport from './src/Screens/AddLabReport';
import VideoCallScreen from './src/Screens/VideoCallScreen';
import JoinCallScreen from './src/Screens/JoinCallScreen';
import AcceptVideoCall from './src/Screens/AcceptVideoCall';




const Stack = createStackNavigator();

const Auth = () => {
  // Stack Navigator for Login and Sign up Screen
  return (
    <Stack.Navigator initialRouteName="LoginScreen">
      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{headerShown: false}}
      />

      

    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator  initialRouteName="SplashScreen">
        {/* SplashScreen which will come once for 5 Seconds */}
        <Stack.Screen
          name="SplashScreen"
          component={SplashScreen}
          // Hiding header for Splash Screen
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Auth"
          component={Auth}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name='IcuBedsScreen'
          component={IcuBedsScreen}
          options={{headerShown:false}}
        />

        <Stack.Screen
          name='ReferDischargeScreen'
          component={ReferDischargeScreen}
          options={{headerShown:false}}
        />

        <Stack.Screen
          name='ChooseYourICUName'
          component={ChooseYourICUName}
          options={{headerShown:false}}
        />

        <Stack.Screen
          name='ChooseYourBedName'
          component={ChooseYourBedName}
          options={{headerShown:false}}
        />

        <Stack.Screen
          name='PatientDetailsForm'
          component={PatientDetailsForm}
          options={{headerShown:false}}
        />

        <Stack.Screen
          name='PhotoViewer'
          component={PhotoViewer}
          options={{headerShown:false}}
        />

        <Stack.Screen
          name='AddNewDocuments'
          component={AddNewDocuments}
          options={{headerShown:false}}
        />

        <Stack.Screen
          name='ReUploadDocument'
          component={ReUploadDocument}
          options={{headerShown:false}}
        />

        <Stack.Screen
          name='CriticalCareMonitoring'
          component={CriticalCareMonitoring}
          options={{headerShown:false}}
        />
       
        <Stack.Screen 
          name='ChatActivity'
          component={ChatActivity}
          options={{headerShown:false}}
        />

        <Stack.Screen 
          name='CriticalCareChartView'
          component={CriticalCareChartView}
          options={{headerShown:false}}
        />

        <Stack.Screen 
          name='NotificationList'
          component={NotificationList}
          options={{headerShown:false}}
        />

        <Stack.Screen 
          name='PatientDocumentsList'
          component={PatientDocumentsList}
          options={{headerShown:false}}
        />

        <Stack.Screen 
          name='PatientDocumentView'
          component={PatientDocumentView}
          options={{headerShown:false}}
        />

        <Stack.Screen 
          name='BotChat'
          component={BotChat}
          options={{headerShown:false}}
        />

        <Stack.Screen 
          name='AddLabReport'
          component={AddLabReport}
          options={{headerShown:false}}
        />

        <Stack.Screen 
          name='VideoCallScreen'
          component={VideoCallScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen 
          name='JoinCallScreen'
          component={JoinCallScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen 
          name='AcceptVideoCall'
          component={AcceptVideoCall}
          options={{headerShown: false}}
        />
      
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;