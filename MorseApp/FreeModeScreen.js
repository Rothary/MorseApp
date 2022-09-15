import React, {useState} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faVolumeUp, faPause, faTrash, faBroadcastTower } from '@fortawesome/free-solid-svg-icons'
import { CheckBox, Slider } from 'react-native-elements'
import { Audio } from 'expo-av'
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
    Pressable,
} from 'react-native';
import { block } from 'react-native-reanimated';

const lettersText = [" ","a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m" ,"n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z","1","2","3","4","5","6","7","8","9","0"]
const lettersMorse = ["/",".-","-...","-.-.","-..",".","..-.","--.","....","..",".---","-.-",".-..","--","-.","---",".--.","--.-",".-.","...","-","..-","...-",".--","-..-","-.--","--..",".----","..---","...--","....-",".....","-....","--...","---..","----.","-----"]
var morseWPM = 15
var dotDuration = 80 //1200/morseWPM
var morseTimeout1
var morseTimeout2
var morseTimeout3
var transmitting = false
var defaultIcon = faBroadcastTower
var useAutoSpace = true
var letterDone
var morseInterval
var spacePending
const soundObject = new Audio.Sound();

//Had this as a State earlier but turns out states dont work properly in if statements - turning it into a variable here feels cheapo but atleast it works
var listening = false

//Lists of things the user can receive, should probably move to their own file
const listLetters =  ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m" ,"n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
const listNumbers =  ["1","2","3","4","5","6","7","8","9","0"]
//30 most common english words excluding single letter ones. These are a bit boring and short, but they would also be the most useful ones to learn in morse so it's ok I guess
const listWords = ["the", "be", "to", "of", "and", "in", "that", "have", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "will", "my"]

//Turn text to morse form, for example "morse text" -> "-- --- .-. ... / - . -..- -"
function text2morse(textInput: String): String 
{
    textInput = textInput.toLowerCase()
    var morseString = ""
    var matchFound = false

    //Go through the input string letter by letter
    for (let i = 0; i <= textInput.length; i++)
    {
        //Go through the lettersText list of letters and compare current textInput letter to each letter in that list
        for (let i2 = 0; i2 < lettersText.length; i2++)
        {
            //Does it match?
            if(textInput.[i] == lettersText[i2])
            {
                //Match is found - add space before a new letter, unless the new letter is the very first one
                if(i > 0)
                {
                    morseString = morseString + " " + lettersMorse[i2]
                } else morseString = morseString + lettersMorse[i2]
                matchFound = true
            } 
        }
        if(matchFound == false) morseString = morseString + " "
        matchFound = false
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
        //We've found a full letter or symbol, let's find out which one it is, if its none we'll just ignore it and move on
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


class FreeModeScreen extends React.Component {
    constructor(props) {
        super(props);
    
        this.state = {
            litColorMorse: '#888',
            litColorListen: '#888',
            litColorClear: '#888',
            litColorSpace: '#888',
            buttonOpacity: 1,
            listenButtonOpacity: 1,
            buttonIcon: defaultIcon,
            listenButtonIcon: faVolumeUp,
            textInputValue: '',
            highlightedText: '',
            displayText: '',
            displayTextColor: '#CCC',
            buttonsDisabled: false,
            morseDots: 1,
            tempMorseLetter: '',
            fullMorseLetter: '',
            currentLetterIndex: 0
        };
    }

    async UNSAFE_componentWillMount(){
        //Have to reset these manually to match the checkboxes when the page is opened after the first time
        useAutoSpace = true
        morseWPM = 15
        dotDuration = 80

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

    setTextInput(text: String)
    {
        this.setState({textInputValue: text, displayText: text})
    }

    playMorseString(morseInput: String, index, letterIndex)
    {
        this.stopSound()
        this.setState({
            listenButtonIcon: faPause, 
            listenButtonOpacity: 1, 
            buttonOpacity: 0.7, 
            submitDisabled: true, 
            submitOpacity: 0.7, 
            displayTextColor: '#888',        
        })
        var timeOut = dotDuration

        if(listening == true)
        {
            if(morseInput[index] == "/")
            {
                this.setState({litColorListen: '#888', listenButtonOpacity: 0.7}) //#1d232f
                this.stopSound()
            }
            else if(morseInput[index] == ".")
            {
                this.setState({litColorListen: '#FFC227', listenButtonOpacity: 1})
                this.playSound()
            }
            else if(morseInput[index] == "-")
            {
                this.setState({litColorListen: '#FFC227', listenButtonOpacity: 1})
                this.playSound()
                timeOut = timeOut * 3
            } else
            {
                timeOut = 0
                this.setState({
                    litColorListen: '#888', 
                    listenButtonOpacity: 0.7,
                    highlightedText: this.state.highlightedText + this.state.textInputValue[letterIndex],
                    displayText: this.state.textInputValue.slice(letterIndex+1),
                })
                
                letterIndex++
            } 
            index++
            morseTimeout1 = setTimeout( () => {
                this.setState({litColorListen: '#888', listenButtonOpacity: 0.7})
                if(index >= morseInput.length)
                {
                    listening = false   
                    /*
                    For some reason I must have the following stuff in a timeout, 
                    or else the very last morse symbol will become longer (??????),
                    for example N (-.) will end up as M (--), giving the user false info.
                    */
                    morseTimeout2 = setTimeout( () => {
                        this.interruptListen()
                        return
                    }, dotDuration)
                } 
                else
                {
                    morseTimeout2 = setTimeout( () => {
                        this.playMorseString(morseInput, index, letterIndex)
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
            litColorListen: '#888',
            listenButtonIcon: faVolumeUp, 
            buttonOpacity: 1,
            listenButtonOpacity: 1,
            submitDisabled: false,
            submitOpacity: 1,
            displayTextColor: '#CCC',
            displayText: this.state.textInputValue,
            highlightedText: '',
        })
    }

    //Called when user presses down the morse button
    morseStart() 
    {
        this.playSound()
        clearTimeout(letterDone)
        clearTimeout(spacePending)
        transmitting = true
        this.setState({litColorMorse: '#FFC227', letterPending: false, morseDots: 1})
        //Count morse dots so we can determine if the user has pressed down long enough for it to count as a dash instead of a dot
        morseInterval = setInterval(() => {
            //3 or more "morse dots" already equals a dash so we can clear the interval now
            if(this.state.morseDots >= 3)
            {
                clearInterval(morseInterval)
                return
            }
            else 
            {
                this.setState({morseDots: this.state.morseDots+1})
            }
        }, dotDuration);
    }

    //Called when user lets go of the morse button
    morseStop() 
    {
        this.stopSound()
        clearInterval(morseInterval)
        transmitting = false
        this.setState({litColorMorse: '#888', letterPending: true,})
        //Check if the user pressed down on the button long enough for it to count as a dash instead of a dot
        if(this.state.morseDots > 2)
        {
            //it's a dash (-)
            this.setState({tempMorseLetter: this.state.tempMorseLetter+'-'})
        }
        else 
        {
            //it's a dot (.)
            this.setState({tempMorseLetter: this.state.tempMorseLetter+'.'})
        }
        letterDone = setTimeout( () => {
            this.setState({fullMorseLetter: this.state.tempMorseLetter, tempMorseLetter: '',})
            this.addMorseLetter()
        }, dotDuration*3)
        return
    }

    addMorseLetter()
    {
        var newMorseLetter = morse2text(this.state.fullMorseLetter)
        if(newMorseLetter != '')
        {
            var newTextInputValue = this.state.textInputValue + newMorseLetter
            this.setState({textInputValue: newTextInputValue, displayText: newTextInputValue})

            //Automatically add space if user has automatic space checked and enough time has lapsed (7 dots (3 + 4))
            if(useAutoSpace == true)
            spacePending = setTimeout( () => {
                var newTextInputValue = this.state.textInputValue + ' '
                this.setState({textInputValue: newTextInputValue})
            }, dotDuration*4)
        }
    }

    render()
    {
        return (
            <ScrollView style={styles.mainPage}>
                <View style={styles.mainActivity}>
                    <ScrollView 
                        style={styles.textInputContainer} 
                    >
                    <TextInput 
                        style={styles.textBox}
                        placeholder={"Type text here by hand or in morse"}
                        placeholderTextColor='#888' 
                        multiline={true}
                        //value = {this.state.textInputValue}
                        onChangeText={text => 
                            this.setTextInput(text)
                        }
                    >
                        <Text style={{color:'#FFC227'}}>{this.state.highlightedText}</Text>
                        <Text style={{color: this.state.displayTextColor}}>{this.state.displayText}</Text>
                    </TextInput>
                    </ScrollView>
                    <View style={styles.buttonsContainer}>
                        <View style={styles.singleButtonContainer}>
                            <TouchableWithoutFeedback
                                disabled={this.state.listenDisabled}
                                touchSoundDisabled={true}
                                onPress={() => 
                                    {
                                        if(listening == false)
                                        {
                                            listening = true
                                            //Setting the initial states here is the easiest solution, since PlayMorseString is recursive and repeats on every morse symbol, not full letter
                                            this.setState({
                                                displayText: this.state.textInputValue,
                                                highlightedText: '',
                                            })
                                            this.playMorseString(text2morse(this.state.textInputValue), 0, 0)                        
                                        }
                                        else
                                        {
                                            this.interruptListen()
                                        } 

                                    }
                                } 
                            >
                                <View
                                style={[styles.listenButton, {borderColor: this.state.litColorListen, opacity: this.state.listenButtonOpacity}]}
                                >
                                    <FontAwesomeIcon 
                                        style={[styles.listenButtonIcon, {color: this.state.litColorListen}]} 
                                        icon={ this.state.listenButtonIcon }
                                        size={ 30 }
                                    /> 
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                        <View style={styles.singleButtonContainer}>
                            <TouchableOpacity
                                disabled={this.state.buttonDisabled}
                                touchSoundDisabled={true}
                                onPress={() => 
                                    {
                                        //Interrupt listening if such is going on
                                        this.interruptListen()
                                        this.setState({litColorClear: '#888', textInputValue: '', displayText: '', displayTextColor: '#CCC'})
                                    }
                                } 
                            >
                                <View
                                style={[styles.clearButton, {borderColor: this.state.litColorClear, opacity: this.state.buttonOpacity}]}
                                >
                                    <FontAwesomeIcon 
                                        style={[styles.listenButtonIcon, {color: this.state.litColorClear}]} 
                                        icon={ faTrash }
                                        size={ 30 }
                                    /> 
                                </View>
                            </TouchableOpacity>
                        </View>
                    
                    </View>
                    <TouchableWithoutFeedback
                        disabled={this.state.buttonsDisabled}
                        touchSoundDisabled={true}
                        onPressIn={() => 
                            {
                                //Interrupt listening if such is going on
                                this.interruptListen()
                                this.morseStart()
                            }
                        } 
                        onPressOut={() => 
                            {
                                transmitting = false
                                this.morseStop()
                            }
                        } 
                    >
                        <View
                        style={[styles.morseButton, {borderColor: this.state.litColorMorse, opacity: this.state.buttonOpacity}]}
                        >
                            <FontAwesomeIcon 
                                style={[styles.morseButtonIcon, {color: this.state.litColorMorse}]} 
                                icon={ this.state.buttonIcon }
                                size={ 50 }
                            /> 
                        </View>
                    </TouchableWithoutFeedback>
                </View>
                <Settings/>
            </ScrollView>
        );
    }
};

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
                uncheckedColor={'#CCC'}
                title={this.state.checkBoxTitle}
                checked={this.state.checked}
                onPress={(title, checked) => {
                        this.setState({checked: !this.state.checked})
                        useAutoSpace = !this.state.checked
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
                    <CheckBoxSetting title={'Use automatic spaces in morse (realistic)'} checked={true}/>
                </View>
            </View>
        </View>
        );
    }
}

export default FreeModeScreen

const styles = StyleSheet.create({
    mainPage: {
        backgroundColor: '#191E29',
        height: '100%',
    },
    mainActivity: {
        marginBottom: 30,
    },
    textInputContainer: {
        marginTop: 25,
        marginLeft: 'auto',
        marginRight: 'auto',
        marginBottom: 5,
        maxWidth: '90%',
        overflow: 'scroll',
        height: 100,
    },
    textBox: {
        marginTop: 25,
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'center',
        fontSize: 30,
        marginBottom: 5,
        color: '#CCC',
    },
    buttonsContainer: {
        flexDirection: 'row',
    },
    singleButtonContainer: {
        flex: 1,
    },
    listenButton: {
        width: 80,
        height: 80,
        backgroundColor:'#13171F',
        borderRadius: 40,
        marginLeft: 'auto',
        marginRight: 10,
        marginTop: 25,
        alignItems: 'center',
        textAlign: 'center',
        justifyContent: 'center',
        borderWidth: 3,
    },
    clearButton: {
        width: 80,
        height: 80,
        backgroundColor:'#13171F',
        borderRadius: 40,
        marginLeft: 10,
        marginRight: 'auto',
        marginTop: 25,
        alignItems: 'center',
        textAlign: 'center',
        justifyContent: 'center',
        borderWidth: 3,
    },
    spaceButton: {
        width: 80,
        height: 80,
        backgroundColor:'#13171F',
        borderRadius: 40,
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: 25,
        alignItems: 'center',
        textAlign: 'center',
        justifyContent: 'center',
        borderWidth: 3,
    },
    spaceButtonIcon: {
        fontSize: 50
    },
    morseButton: {
        width: 150,
        height: 150,
        backgroundColor:'#13171F',
        borderRadius: 75,
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: 10,
        alignItems: 'center',
        textAlign: 'center',
        justifyContent: 'center',
        borderWidth: 3,
    },
    settings: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    slider: {
        height: 40,
        width: '100%',
        marginLeft: 'auto',
        marginRight: 'auto',
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
  });