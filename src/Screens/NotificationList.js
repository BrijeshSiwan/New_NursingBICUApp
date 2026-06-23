import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Text, Image, SectionList, TouchableOpacity, Platform, ToastAndroid } from "react-native";
import Loader from '../Components/Loader';
import * as FetchAPI from '../Services/fetchAPI';
import { getAuthToken, setNotificationCount } from "../Services/storage";
import {notificationReadUpdate,NotificationListApi,SeenNotification } from '../Services/APIManager';
import theme from '../assets/theme';
import { SafeAreaView } from "react-native-safe-area-context";
import { format, isToday, isYesterday, isTomorrow } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
const { images, font, colors } = theme;
import i18n from "../locales/i18n";

const NotificationList = ({ route, navigation }) => {
  const [isLoader, setLoader] = useState(false);
  const [groupedNotifications, setGroupedNotifications] = useState([]);
  const [getUnreadCount, setUnreadCount] = useState('');

  useFocusEffect(
    useCallback(() => {
      getAuthToken("auth_token").then(res => {
        getICUNotificationsData("Bearer " + res); 
      })
    }, [])
  );

  const refreshPage = () => {
    getAuthToken("auth_token").then(res => {
      getICUNotificationsData("Bearer " + res);
    })
  };

  //get notification list data
  const getICUNotificationsData = async (auth_token) => {
    setLoader(true);
    const listOfNotificationApi = NotificationListApi  ;
    FetchAPI.GetRequestwithauttoken(listOfNotificationApi, auth_token, async (response) => {
     // console.log('notify data===',response.data.notifications)
      if (response.status === 200) {
        try {
          const notifications = response.data.notifications;
          groupNotificationsByDate(notifications);
          setLoader(false);
        } catch (e) {
          console.log(e);
          setLoader(false);
        }
      } else {
        setLoader(false);
        ToastAndroid.show(i18n.t('something_went_wrong'), ToastAndroid.SHORT);
      }
    });
  };

  const updateNotificationsRead = async (auth_token,notifi_id) => {
    setLoader(true);
    const listOfNotificationApi = notificationReadUpdate + notifi_id + '/';
    FetchAPI.PutRequest(listOfNotificationApi,'', auth_token, async (response) => {
      if (response.status === 200) {
        try {
          setLoader(false);
        } catch (e) {
          console.log(e);
          setLoader(false);
        }
      } else {
        setLoader(false);
        if (Platform.OS === 'android') {
          ToastAndroid.show(response.msg, ToastAndroid.SHORT);
        }
      }
    });
  };

  const groupNotificationsByDate = (notifications) => {
    let unreadCount = 0;
    const grouped = notifications.reduce((acc, notification) => {
      if (!notification.is_read) unreadCount += 1;
      const date = new Date(notification.timestamp);
      const dateString = formatDateHeader(date);
      if (!acc[dateString]) {
        acc[dateString] = [];
      }
      acc[dateString].push(notification);
      return acc;
    }, {});

    const groupedArray = Object.keys(grouped).map(date => ({
      title: date,
      data: grouped[date]
    }));

    setGroupedNotifications(groupedArray);
    setUnreadCount(unreadCount); // Set the unread count
   // setNotificationCount('notification', unreadCount);
  };

  const formatDateHeader = (date) => {
    if (isToday(date)) {
      return i18n.t('today');
    } else if (isYesterday(date)) {
      return i18n.t('yesterday');
    } else if (isTomorrow(date)) {
      return i18n.t('tomorrow');
    } else {
      return format(date, 'MMMM dd, yyyy');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  const seenNotificationValue = async (auth_token,document_id,notification_id) => {
    setLoader(true)
    FetchAPI.PostCommentRequest(SeenNotification+notification_id+'/',auth_token,'', async (response) => {
      if(response.status === 200){
        try {
         // navigation.navigate('PatientDocumentView', {'document_id': document_id});
         refreshPage();
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
  };

  const renderNotificationData = ({ item }) => {

    return (
      <TouchableOpacity onPress={() => { 
        if(item.title === "New Suggestion received"){
          // navigation.navigate('PatientDocumentView', {'document_id': item?.document_id});
           getAuthToken("auth_token").then(res => {
             seenNotificationValue("Bearer "+res,item?.document_id,item.id);  
             navigation.navigate('PatientDocumentView', {'document_id': item?.document_id});
           })
         }else{
           getAuthToken("auth_token").then(res => {
             seenNotificationValue("Bearer "+res,item?.document_id,item.id);  
           })
         }

       }}
        style={[styles.notifyItemView, { backgroundColor: item.is_read ? colors.white : '#FFEEE0' }]}>

        <View style={[styles.notificationIconStyl, { backgroundColor: item.is_read ? '#FFEEE0' : colors.white }]}>
          <Image source={images.bell_icon} style={{ width: 24, height: 24 }} tintColor={colors.orangeColor} />
        </View>

        <View style={styles.notificationTextStyl}>
          <Text numberOfLines={1} style={styles.itemTitleStyl}>{item.title}</Text>
          <Text numberOfLines={1} style={{ color: colors.midiumGrayy, fontSize: 12, lineHeight: 14, fontFamily: font.regular }}>{item.message}</Text>
          <Text numberOfLines={1} style={{ color: colors.midiumGrayy, fontSize: 10, lineHeight: 17, fontFamily: font.regular, marginTop: 5 }}>{formatTime(item.timestamp)}</Text>
        </View>

        <TouchableOpacity style={[styles.refferButton_style]} >
          <Image source={images.right_arrow} style={{ width: 24, height: 24 }} tintColor={colors.orangeColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      {isLoader === true && <Loader visible></Loader>}
      <TouchableOpacity onPress={() => { navigation.goBack() }} style={styles.backButton}>
        <Image source={images.back_arrow} tintColor={colors.grayColor} style={{ width: 24, height: 24, marginTop: 10, marginRight: 10 }} />
        <Text style={styles.headerText}>{i18n.t('notifications') }</Text>
      </TouchableOpacity>

      <SectionList
        style={{ marginHorizontal: 10 }}
        sections={groupedNotifications}
        keyExtractor={item => item.id}
        renderItem={renderNotificationData}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
      />
    </SafeAreaView>
  );
};

export default NotificationList;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.backgroundScreen,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    paddingLeft: 16,
    paddingTop: 14,
  },
  headerText: {
    fontFamily: font.semiBold,
    fontSize: 16,
    color: colors.headingText,
    paddingTop: 10,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: font.light,
    backgroundColor: colors.backgroundScreen,
    padding: 10,
    color: colors.headingText,
  },
  notifyItemView: {
    width: '100%',
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: colors.borderColor,
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginBottom: 10,
  },
  notificationIconStyl: {
    width: 40,
    height: 40,
    padding: 10,
    borderRadius: 20,
    backgroundColor: colors.lightOrangeColor,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    overflow: 'hidden',
  },
  itemTitleStyl: {
    color: colors.headingText,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: font.bold,
  },
  notificationTextStyl: {
    width: '85%',
  },
  refferButton_style: {
    width: '10%',
  },
});
