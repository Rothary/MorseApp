import 'react-native-gesture-handler';
import * as React from 'react';
import { Text, View, Image, StyleSheet, Button, TouchableOpacity, ScrollView} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faBroadcastTower, faList, faPaintBrush, faPencilAlt, faPlusCircle, faVolumeUp } from '@fortawesome/free-solid-svg-icons'

import ListenModeScreen from './ListenModeScreen';
import WriteModeScreen from './WriteModeScreen';
import FreeModeScreen from './FreeModeScreen';
import CustomWordsScreen from './CustomWordsScreen';


const Stack = createStackNavigator();


const HomeScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.mainPage}>
      <View style={styles.appTitleContainer}>
        <Text style={styles.appTitle}>MORSE APP</Text>
      </View>
      <View style={styles.buttonsContainer}>
        {/* I know the menu buttons could've been a class of their own, but I honestly can't bother with that at this point */}
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() =>
              navigation.navigate('Receive')
          }
        >
          <FontAwesomeIcon 
            style={styles.menuButtonIcon}
            icon={ faVolumeUp }
            size={ 20 }
          /> 
          <Text style={styles.menuButtonText}>Receive</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() =>
            navigation.navigate('Transmit')
          }
        >
          <FontAwesomeIcon 
            style={styles.menuButtonIcon}
            icon={ faBroadcastTower }
            size={ 20 }
          /> 
          <Text style={styles.menuButtonText}>Transmit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() =>
            navigation.navigate('Free mode')
          }
        >
          <FontAwesomeIcon 
            style={styles.menuButtonIcon}
            icon={ faPaintBrush }
            size={ 20 }
          /> 
          <Text style={styles.menuButtonText}>Free mode</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() =>
            navigation.navigate('Custom list')
          }
        >
          <FontAwesomeIcon 
            style={styles.menuButtonIcon}
            icon={ faList }
            size={ 20 }
          /> 
          <Text style={styles.menuButtonText}>Custom list</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};



const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Home' }}
        />
        <Stack.Screen name="Receive" component={ListenModeScreen} />
        <Stack.Screen name="Transmit" component={WriteModeScreen} />
        <Stack.Screen name="Free mode" component={FreeModeScreen} />
        <Stack.Screen name="Custom list" component={CustomWordsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({
  mainPage: {
    backgroundColor: '#191E29',
    height: '100%',
  },
  appTitleContainer: {
    backgroundColor: '#13171F',
    width: '90%',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 25,
    borderRadius: 5,
  },
  appTitle: {
    color: '#888',
    textAlign: 'center',
    fontFamily: 'Roboto',
    fontWeight: '500',
    letterSpacing: 15,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 25,
    width: '90%',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 25,
    borderRadius: 0,
    borderColor: '#888',
    borderBottomWidth: 0,
    marginBottom: 25,
  },
  buttonsContainer: {
    justifyContent: 'center',
    marginTop: 50,
  },
  menuButtonIcon: {
    color: '#FFC227',
    height: '100%',
    borderRadius: 2.5,
    fontSize: 10,
    textAlignVertical: 'center',
    margin: 10,
  },
  menuButtonText: {
    color: '#DDD',
    fontSize: 20,
    fontFamily: 'Roboto',
    textAlignVertical: 'center',
    textAlign: 'left',
    marginLeft: 10,
  },
  menuButton: {
    textAlignVertical: 'center',
    flexDirection: 'row',
    backgroundColor: '#13171F',
    borderRadius: 5,
    borderWidth: 0,
    marginBottom: 15,
    marginLeft: 'auto',
    marginRight: 'auto',
    padding: 5,
    width: '90%',
    height: 50,
  },
});