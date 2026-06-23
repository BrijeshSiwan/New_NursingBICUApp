import React, {useState} from 'react';
import {
  View,
  Image,
  TextInput,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const screen_width = Dimensions.get('screen').width;
const screen_height = Dimensions.get('screen').height;
import theme from '../../assets/theme';
const {strings, images, font} = theme;
function InpuText({placeholder,autoCapitalize,keyboardType,onChangeText,value, isPassword}) {
  const [isTicked, SetIsTicked] = useState(true);

  return (
    <View style={styles.main_sty}>
    
        <TextInput
          style={styles.input_sty}
          placeholder={placeholder}
          placeholderTextColor="#2C8170"
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          value={value}
          secureTextEntry={isTicked}
          onChangeText = {onChangeText}
        />
      
      <View>
        {/* {rightLogo} */}
        {isPassword && (
          <TouchableOpacity style={styles.rightLogo_sty} onPress={() => SetIsTicked(!isTicked)}>
            <Image
              style={{width:25,height:25}}
              source={isTicked ? images.closEye_icon : images.openEye_icon}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  main_sty: {
    backgroundColor: '#F5F5F5',
    width: '100%',
    height: 50,
    alignSelf: 'center',
    borderRadius: wp('1%'),
    alignItems: 'center',
    flexDirection: 'row',
    borderColor: 'lightgray',
  },
  rightLogo_sty: {
    resizeMode: 'contain',
    width: 25,
    height: 25,
    position:'absolute',
    right:40,
    bottom:-15,
    justifyContent:'center',
    alignSelf:'center'
  },
  input_sty: {
    width: '100%',
    fontFamily: font.regular,
    fontSize: 16,
    color:'#2C8170',
    marginLeft: screen_width * 0.01,
    backgroundColor:'#D6F1E8'
  },
});

export default InpuText;
