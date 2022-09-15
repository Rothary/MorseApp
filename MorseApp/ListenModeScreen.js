import React, {useState} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faVolumeUp, faPause, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons'
import { CheckBox, Slider } from 'react-native-elements'
import { Audio } from 'expo-av'
import { AsyncStorage } from 'react-native';
import {
    Text,
    TextInput,
    View,
    Image,
    StyleSheet,
    Button,
    TouchableWithoutFeedback,
    Animated,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { block } from 'react-native-reanimated';



const lettersText = [" ","a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m" ,"n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z","1","2","3","4","5","6","7","8","9","0"]
const lettersMorse = ["/",".-","-...","-.-.","-..",".","..-.","--.","....","..",".---","-.-",".-..","--","-.","---",".--.","--.-",".-.","...","-","..-","...-",".--","-..-","-.--","--..",".----","..---","...--","....-",".....","-....","--...","---..","----.","-----"]
var morseWPM = 15
var dotDuration = 80 //1200/morseWPM
//Timeout variables here so I can easily clear them from anywhere I want whenever I want
var morseTimeout1
var morseTimeout2
var morseTimeout3
const soundObject = new Audio.Sound();

//Had this as a State earlier but turns out states dont work properly in if statements - turning it into a variable here feels cheapo but atleast it works
var listening = false

//Again a bit cheapo solution but it works
var useLetters = true
var useNumbers = false
var useWords = false
var useCustom = false
//Custom words hopefully to come

//The string the user will get to listen and guess
var stringToGuess = ""

//Lists of things the user can receive, should probably move to their own file
const listLetters =  ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m" ,"n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
const listNumbers =  ["1","2","3","4","5","6","7","8","9","0"]
//30 most common english words excluding single letter ones. These are a bit boring and short, but they would also be the most useful ones to learn in morse so it's ok I guess
const listWords = ["the", "be", "to", "of", "and", "in", "that", "have", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "will", "my"]
var listCustom = []

function pickRandom(): String
{
    var completeList = []
    if(useLetters) completeList = [...completeList, ...listLetters];
    if(useNumbers) completeList = [...completeList, ...listNumbers];
    if(useWords) completeList = [...completeList, ...listWords];
    if(useCustom) completeList = [...completeList, ...listCustom];
        
    if(completeList.length > 0)
    {
        var randomNumber = Math.floor(Math.random() * completeList.length) // +1
        stringToGuess = completeList[randomNumber]
    }
    else
    {
        console.log("User hasn't checked any boxes, string to guess will be empty")
        stringToGuess = ''
    }
}

//Turn text to morse form, for example "morse text" -> "-- --- .-. ... / - . -..- -"
function text2morse(textInput: String): String 
{
    var morseString = ""

    //Go through the input string letter by letter
    for (let i = 0; i <= textInput.length; i++)
    {
        //Go through the lettersText list of letters and compare current textInput letter to each letter in that list
        for (let i2 = 0; i2 < lettersText.length; i2++)
        {
            if(textInput.[i] == lettersText[i2])
            {
                //Match is found - add space before a new letter, unless the new letter is the very first one
                if(i > 0)
                {
                    morseString = morseString + " " + lettersMorse[i2]
                } else morseString = morseString + lettersMorse[i2]
            }
        }
    }
    return morseString;
}

function morse2text(morseInput: String): String
{
    var textString = ""
    var morseLetter = ""

    //Go through each symbol one by one until we have built a full letter (indicated by bumping into a space)
    for (let i = 0; i <= morseInput.length; i++)
    {
        if(morseInput[i] == "/")
        {
            textString = textString + " "
        }
        else if(morseInput[i] == ".")
        {
            morseLetter = morseLetter + "."
        }
        else if(morseInput[i] == "-")
        {
            morseLetter = morseLetter + "-"
        }
        else
        //We've found a full letter or symbol, let's find out which one it is
        {
            for (let i2 = 0; i2 < lettersMorse.length; i2++)
            {
                if(morseLetter == lettersMorse[i2])
                {
                    textString = textString + lettersText[i2]
                }
            }
            morseLetter = ""
        }
    }
    return textString;
}






class ListenModeScreen extends React.Component {
    constructor(props) {
        super(props);
    
        this.state = {
            litColor: '#888',
            buttonOpacity: 1,
            submitOpacity: 1,
            buttonIcon: faVolumeUp,
            userAnswer: '',
            answerColor: '#888',
            listenDisabled: false,
            submitDisabled: false
        };
    }

    async UNSAFE_componentWillMount()
    {
        //Have to reset these manually to match the checkboxes when the page is opened after the first time
        useLetters = true
        useNumbers = false
        useWords = false
        useCustom = false
        morseWPM = 15
        dotDuration = 80
        pickRandom()

        //audio system setup
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
            playsInSilentModeIOS: true,
            interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
            shouldDuckANdroid: true,
            staysActiveInBackground: false,
            playsThrouhEarpieceAndroid: true,
        })

        const status = {
            shouldPlay: false
        };
        soundObject.loadAsync(require('./assets/sounds/sinebeep.mp3'), status, true);

        //Load saved data
        AsyncStorage.getItem('customArray', (error, result) => {
            listCustom = JSON.parse(result)
        })
    }
        
    componentWillUnmount()
    {
        this.interruptListen()
        soundObject.unloadAsync()
    }

    playSound() 
    {
        soundObject.playAsync()
        soundObject.setIsLoopingAsync(true)
        soundObject.setIsMutedAsync(false)
    }

    stopSound() 
    {
        //Using mute instead of stopAsync as an attempt to minimize annoying snapping noise when sound is played or stopped
        soundObject.setIsMutedAsync(true)
    }

    setAnswer(answer: String)
    {
        this.setState({userAnswer: answer})
    }

    //A recursive function for playing a morse string and flashing the listen button accordingly
    playMorseString(morseInput: String, index)
    {
        this.stopSound()
        this.setState({buttonIcon: faPause, buttonOpacity: 0.7, submitDisabled: true, submitOpacity: 0.7})
        var timeOut = dotDuration

        if(listening == true)
        {
            if(morseInput[index] == "/")
            {
                this.setState({litColor: '#888', buttonOpacity: 0.7}) //#1d232f
                this.stopSound()
            }
            else if(morseInput[index] == ".")
            {
                this.setState({litColor: '#FFC227', buttonOpacity: 1})
                this.playSound()
            }
            else if(morseInput[index] == "-")
            {
                this.setState({litColor: '#FFC227', buttonOpacity: 1})
                timeOut = timeOut * 3
                this.playSound()
            } else
            {
                timeOut = 0
                this.setState({litColor: '#888', buttonOpacity: 0.7})
            } 
            index++
            morseTimeout1 = setTimeout( () => {
                this.setState({litColor: '#888', buttonOpacity: 0.7})
                if(index >= morseInput.length)
                {
                    morseTimeout2 = setTimeout( () => {
                        this.interruptListen()
                        return
                    }, dotDuration)
                } 
                else
                {
                    morseTimeout2 = setTimeout( () => {
                        this.playMorseString(morseInput, index)
                    }, dotDuration)
                }
            }, timeOut);
        }
        else
        {
            this.interruptListen()
            return
        }
    }

    interruptListen()
    {
        this.stopSound()
        clearTimeout(morseTimeout1)
        clearTimeout(morseTimeout2)
        clearTimeout(morseTimeout3)
        listening = false
        this.setState({
            litColor: '#888',
            buttonIcon: faVolumeUp, 
            buttonOpacity: 1,
            submitDisabled: false,
            submitOpacity: 1
        })
    }

    submitAnswer() {
        console.log(stringToGuess)
        console.log(this.state.userAnswer)
        listening = false
        if(this.state.userAnswer.toLowerCase() == stringToGuess)
        {
            //Correct answer
            this.setState({
                userAnswer: stringToGuess, 
                answerColor: '#00a32e', 
                litColor: '#00a32e', 
                submitOpacity: 0.7, 
                buttonIcon: faCheck, 
                listenDisabled: true, 
                submitDisabled: true
            })
        } 
        else 
        {
            //Wrong answer
            this.setState({
                userAnswer: stringToGuess, 
                answerColor: '#be041a', //Red
                litColor: '#be041a', 
                submitOpacity: 0.7, 
                buttonIcon: faTimes, 
                listenDisabled: true, 
                submitDisabled: true
            })
        }
        //Reset the system and pick new string to listen and guess
        setTimeout( () => {
            this.setState({userAnswer: '', 
            answerColor: '#888',
            litColor: '#888', 
            submitOpacity: 1, 
            buttonIcon: faVolumeUp, 
            listenDisabled: false, 
            submitDisabled: false
            })
            pickRandom()
        }, 1000)
    }
    render() {
        return (
            <ScrollView style={styles.mainPage}>
                <View style={styles.mainActivity}>
                    <TouchableWithoutFeedback
                        disabled={this.state.listenDisabled}
                        touchSoundDisabled={true}
                        onPress={() => 
                            {
                                this.playSound()
                                if(listening == false)
                                {
                                    listening = true
                                    this.playMorseString(text2morse(stringToGuess), 0)                             
                                }
                                else
                                {
                                    this.interruptListen()
                                } 

                            }
                        } 
                    >
                        <View
                        style={[styles.listenButton, {borderColor: this.state.litColor, opacity: this.state.buttonOpacity}]}
                        >
                            <FontAwesomeIcon 
                                style={[styles.listenButtonIcon, {color: this.state.litColor}]} 
                                icon={ this.state.buttonIcon }
                                size={ 50 }
                            /> 
                        </View>
                    </TouchableWithoutFeedback>
                    <TextInput 
                        style={[styles.answerTextbox, {color: this.state.answerColor}]}
                        disabled={this.state.submitDisabled}
                        placeholder={"Type your answer here"}
                        placeholderTextColor='#888' 
                        value = {this.state.userAnswer}
                        onChangeText={text => this.setAnswer(text)}
                    />
                    <TouchableOpacity
                        activeOpacity={0.7}
                        disabled={this.state.submitDisabled}
                        onPress = {() => {
                                this.submitAnswer()
                            }
                        }
                    >
                            <Text style={[styles.submitButton, {opacity: this.state.submitOpacity}]}>Submit</Text>
                    </TouchableOpacity>
                </View>
                <Settings/>
            </ScrollView>
        );
    }
}

class CheckBoxSetting extends React.Component {
    constructor(props) {
        super(props);
    
        this.state = {
          checked: props.checked,
          checkBoxTitle: props.title,
        };
    }

    render() {
        return(
            <CheckBox
                containerStyle={styles.checkBoxContainer}
                textStyle={styles.checkBoxText}
                checkedColor={'#FFC227'} //#FFC227 for yellow
                uncheckedColor={'#888'}
                title={this.state.checkBoxTitle}
                checked={this.state.checked}
                onPress={(title, checked) => {
                        this.setState({checked: !this.state.checked})
                        if(this.state.checkBoxTitle == "Letters") useLetters = !this.state.checked
                        else if(this.state.checkBoxTitle == "Numbers") useNumbers = !this.state.checked
                        else if(this.state.checkBoxTitle == "Words") useWords = !this.state.checked
                        else if(this.state.checkBoxTitle == "Custom list") useCustom = !this.state.checked
                        //We'll pick a new string to guess based on the updated choices
                        pickRandom()
                    }
                }
            />
        );
    }
}

class Settings extends React.Component {
    state = {
        value: 15
    }

    render() {
        return (
        
          <View style={styles.settings}>
              
            {/* Little dividing line to clearly indicate where the settings start, with scrollview below */}
            <View
                style={{
                    borderBottomColor: '#13171F',
                    borderBottomWidth: 3,
                    marginTop: 10,
                    marginBottom: 10,
                    borderRadius: 5,
                    width: '90%',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                }}
            />
            {/*
            <Text style={styles.settingsTitle}>
                Settings
            </Text>
            */}
            <View>
                <View style={styles.sliderContainer}>
                    <Slider
                        style={styles.slider}
                        thumbStyle={{ height: 20, width: 20, backgroundColor: '#FFC227' }}
                        trackStyle={{ height: 3, borderRadius: 5}}
                        maximumTrackTintColor={'#CCC'}
                        minimumTrackTintColor={'#FFC227'}
                        maximumValue={35}
                        minimumValue={5}
                        step={1}
                        value={this.state.value}
                        onValueChange={(value) => 
                            {
                                
                                morseWPM = value
                                dotDuration = 1200/morseWPM
                                this.setState({value: morseWPM})                    
                            }  
                        }
                    />    
                    <View style={styles.containerArrowLeft}></View>        
                    <Text style={styles.sliderValue}>
                        {morseWPM} WPM
                    </Text>
                </View>
                <View style={styles.checkBoxes}>
                    <CheckBoxSetting title={'Letters'} checked={true}/>
                    <CheckBoxSetting title={'Numbers'} checked={false}/>
                    <CheckBoxSetting title={'Words'} checked={false}/>
                    <CheckBoxSetting title={'Custom list'} checked={false}/>
                </View>
            </View>
        </View>
        );
    }
}

export default ListenModeScreen

const styles = StyleSheet.create({
    mainPage: {
        backgroundColor: '#191E29', //#191E29
        height: '100%',
    },
    mainActivity: {
        marginBottom: 30,
    },
    answerTextbox: {
        marginTop: 25,
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'center',
        fontSize: 30,
        marginBottom: 5,
        maxWidth: '90%',
    },
    submitButton: {
        backgroundColor: '#13171F',
        borderRadius: 5,
        textAlignVertical: 'center',
        textAlign: 'center',
        borderWidth: 0,
        color: '#CCC',
        fontFamily: 'Roboto',
        marginTop: 5,
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '35%',
        fontSize: 25,
        padding: 5,
    },
    listenButton: {
        width: 150,
        height: 150,
        backgroundColor:'#13171F',
        borderRadius: 75,
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: 25,
        alignItems: 'center',
        textAlign: 'center',
        justifyContent: 'center',
        borderWidth: 3,
    },
    listenButtonIcon: {
    },
    settings: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    settingsTitle: {
        textAlignVertical: 'center',
        textAlign: 'center',
        color: '#CCC',
        fontFamily: 'Roboto',
        fontSize: 20,
        marginBottom: 10,
    },
    slider: {
        height: 40,
        width: '100%',
        marginLeft: 'auto',
        marginRight: 'auto',    
    },
    checkBoxContainer: {
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: 5,
        width: '100%',
        backgroundColor: '#13171F',
        borderWidth: 0,
        borderRadius: 5,
    },
    checkBoxes: {
        paddingLeft: '5%',
        paddingRight: '5%',
    },
    checkBoxText: {
        color: '#CCC',
        fontFamily: 'Roboto',
        fontWeight: 'normal',
    },
    sliderContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginBottom: 5,
        paddingLeft: '5%',
        paddingRight: '5%',
    }, 
    slider: {
        flex: 8,
        paddingRight: 10,
    },
    sliderValue: {
        width: '20%',
        flex: 3,
        backgroundColor: '#13171F',
        borderRadius: 5,
        textAlignVertical: 'center',
        textAlign: 'center',
        borderWidth: 0,
        color: '#CCC',
        height: '100%',
        fontFamily: 'Roboto',
    },
    containerArrowLeft: {
        backgroundColor: '#13171F',
        height: 16,
        width: 16,
        transform: [
            { rotateZ: "45deg" },
            { translateX: 6 },
            { translateY: -6 }
        ]
    },
  });