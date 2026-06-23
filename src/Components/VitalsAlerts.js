// Example of Splash, Login and Sign Up in React Native
// https://aboutreact.com/react-native-login-and-signup/

// Import React and Component
import React from 'react';
import {StyleSheet, View, TouchableOpacity,Text,Image} from 'react-native';
import Modal from "react-native-modal";
import { useNavigation } from '@react-navigation/native';
import theme from '../assets/theme';
const { images, font, colors } = theme;
import i18n from '../locales/i18n';

const VitalsAlerts = ({ vitalsAlertModal, isVitalsVisible,vitalsTitle }) => {
    const navigation = useNavigation();

  return (
    <View >
        <Modal isVisible={isVitalsVisible} onBackdropPress={vitalsAlertModal} style={styles.bottomModal}>
            <View style={styles.modalContent}>
                <View style = {{flexDirection:'row',justifyContent:'center'}}>
                    <Text style={styles.modalTitle}>{i18n.t('vitals_alert')}</Text>
                    <Image source={images.rejected_icon} style = {{width:30,height:30,marginStart: 20,}}/>
                </View>
            
                <Text style={styles.modalTitle}>{vitalsTitle}</Text>

                <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity onPress={vitalsAlertModal} style={styles.cancelButton}>
                        <Text style={styles.cancelButtonText}>{i18n.t('update')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    </View>
    
  );
};

export default VitalsAlerts;

const styles = StyleSheet.create({
  bottomModal: {
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.backgroundScreen,
    padding: 20,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor:colors.orangeColor
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: font.semiBold,
    marginBottom: 10,
    alignSelf: 'center',
    color: colors.grayColor,
  },
  cancelButton: {
    marginTop: 10,
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: font.semiBold,
    color: colors.orangeColor,
    textAlign: 'center',
    marginHorizontal:15
  },
});
