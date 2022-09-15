import React, {useState} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faBroadcastTower, faCheck } from '@fortawesome/free-solid-svg-icons'
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
    Pressable,
} from 'react-native';
import { block } from 'react-native-reanimated';

const lettersText = [" ","a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m" ,"n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z","1","2","3","4","5","6","7","8","9","0"]
const lettersMorse = ["/",".-","-...","-.-.","-..",".","..-.","--.","....","..",".---","-.-",".-..","--","-.","---",".--.","--.-",".-.","...","-","..-","...-",".--","-..-","-.--","--..",".----","..---","...--","....-",".....","-....","--...","---..","----.","-----"]
var morseWPM = 15
var dotDuration = 80 //1200/morseWPM
var transmitting = false
var defaultIcon = faBroadcastTower
const soundObject = new Audio.Sound();

//Ill initate the timer variables here so I can clear them from where ever I want
var letterDone
var morseInterval

//Again a bit cheapo solution but it works
var useLetters = true
var useNumbers = false
var useWords = false
var useCustom = false

//The string the user will get to listen and guess
var stringToSpell = ''
var stringToSpellCorrect = ''

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
        stringToSpell = completeList[randomNumber]
    }
    else
    {
        console.log("User hasn't checked any boxes, string to guess will be empty")
        stringToSpell = ''
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

class WritingModeScreen extends React.Component {
    constructor(props) {
        super(props);
    
        this.state = {
            litColor: '#888',
            buttonOpacity: 1,
            submitOpacity: 1,
            buttonIcon: defaultIcon,
            wordToSpell: stringToSpell,
            wordToSpellCorrect: stringToSpellCorrect,
            answerColor: '#CCC',
            buttonsDisabled: false,
            morseDots: 1,
            tempMorseLetter: '',
            fullMorseLetter: '',
            currentLetterIndex: 0
        };
    }

    async UNSAFE_componentWillMount(){
        //Have to reset these manually to match the checkboxes when the page is opened after the first time
        useLetters = true
        useNumbers = false
        useWords = false
        useCustom = false
        morseWPM = 15
        dotDuration = 80
        this.nextString()
        
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

        AsyncStorage.getItem('customArray', (error, result) => {
            listCustom = JSON.parse(result)
        })
    }
    
    

    componentWillUnmount()
    {
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

    //Called when user presses down the morse button
    morseStart() 
    {
        this.playSound()
        //If the next letter is infact a space, we'll skip it
        if(stringToSpell[this.state.currentLetterIndex] == " ")
        {
            stringToSpellCorrect = stringToSpellCorrect + stringToSpell[this.state.currentLetterIndex]
            this.setState({
                wordToSpellCorrect: stringToSpellCorrect,
                wordToSpell: stringToSpell.slice(this.state.currentLetterIndex+1),
                currentLetterIndex: this.state.currentLetterIndex+1
            })
        }

        clearTimeout(letterDone)
        transmitting = true
        this.setState({litColor: '#FFC227', letterPending: false, morseDots: 1})
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
        this.setState({litColor: '#888', letterPending: true,})
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
            this.setState({fullMorseLetter: this.state.tempMorseLetter, tempMorseLetter: ''})
            this.compareMorse()
        }, dotDuration*3)
        return
    }

    //Compare the letter the user has created to the current index of the word they have to spell
    compareMorse()
    {
        
        var i = this.state.currentLetterIndex
        console.log("is this a space >" + stringToSpell[i] + "<")
        var userLetter = this.state.fullMorseLetter
        if(morse2text(userLetter) == stringToSpell[i].toLowerCase())
        {
            //We have a match
            stringToSpellCorrect = stringToSpellCorrect + stringToSpell[i]
            this.setState({
                wordToSpellCorrect: stringToSpellCorrect,
                wordToSpell: stringToSpell.slice(i+1),
                currentLetterIndex: this.state.currentLetterIndex+1
            })

            //Did the user successfully write the entire word?
            if(this.state.wordToSpell == "")
            {
                this.setState({
                    answerColor: '#00a32e', 
                    litColor: '#00a32e', 
                    submitOpacity: 0.7, 
                    buttonIcon: faCheck, 
                    buttonsDisabled: true, 
                })
                //Reset the system
                setTimeout( () => {
                    this.nextString()
                }, 1000)
            }
        }
    }

    //Reset the entire thing and pick a new string to spell
    nextString()
    {
        stringToSpellCorrect = ''
        pickRandom()
        this.setState({userAnswer: '', 
            answerColor: '#CCC',
            litColor: '#888', 
            submitOpacity: 1, 
            buttonIcon: defaultIcon, 
            buttonsDisabled: false, 
            wordToSpell: stringToSpell,
            wordToSpellCorrect: stringToSpellCorrect,
            tempMorseLetter: '',
            fullMorseLetter: '',
            currentLetterIndex: 0,
        })
    }

    render()
    {
        return (
            <ScrollView style={styles.mainPage}>
                <View style={styles.mainActivity}>
                    <ScrollView 
                        style={styles.wordToSpellContainer} 
                        horizontal={true}
                    >
                        <Text style={styles.wordToSpellCorrect}>
                        {this.state.wordToSpellCorrect}
                        </Text>
                        <Text style={styles.wordToSpell}>
                        {this.state.wordToSpell}
                        </Text>
                    </ScrollView>
                    <TouchableWithoutFeedback
                        disabled={this.state.buttonsDisabled}
                        touchSoundDisabled={true}
                        onPressIn={() => 
                            {
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
                        style={[styles.morseButton, {borderColor: this.state.litColor, opacity: this.state.buttonOpacity}]}
                        >
                            <FontAwesomeIcon 
                                style={[styles.morseButtonIcon, {color: this.state.litColor}]} 
                                icon={ this.state.buttonIcon }
                                size={ 50 }
                            /> 
                        </View>
                    </TouchableWithoutFeedback>
                    <TouchableOpacity
                        disabled={this.state.buttonsDisabled}
                        onPress = {() => {
                                this.nextString()
                            }
                        }
                    >
                            <Text style={[styles.skipButton, {opacity: this.state.submitOpacity}]}>Skip</Text>
                    </TouchableOpacity>
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
                        if(this.state.checkBoxTitle == "Letters") useLetters = !this.state.checked
                        else if(this.state.checkBoxTitle == "Numbers") useNumbers = !this.state.checked
                        else if(this.state.checkBoxTitle == "Words") useWords = !this.state.checked
                        else if(this.state.checkBoxTitle == "Custom list") useCustom = !this.state.checked
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

export default WritingModeScreen

const styles = StyleSheet.create({
    mainPage: {
        backgroundColor: '#191E29',
        height: '100%',
    },
    mainActivity: {
        marginBottom: 30,
    },
    wordToSpellContainer: {
        flexDirection: 'row',
        marginTop: 30,
        marginLeft: 'auto',
        marginRight: 'auto',
        marginBottom: 5,
        maxWidth: '90%',
        overflow: 'scroll',
    },
    wordToSpellCorrect: {
        textAlign: 'right',
        marginLeft: 'auto',
        marginRight: 0,
        fontSize: 45,
        color: '#00a32e',
        marginBottom: 5,
    },
    wordToSpell: {
        textAlign: 'left',
        marginLeft: 0,
        marginRight: 'auto',
        fontSize: 45,
        color: '#888',
        marginBottom: 5,
    },
    morseButton: {
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
    skipButton: {
        backgroundColor: '#13171F',
        borderRadius: 5,
        textAlignVertical: 'center',
        textAlign: 'center',
        borderWidth: 0,
        color: '#CCC',
        fontFamily: 'Roboto',
        marginTop: 25,
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '35%',
        fontSize: 25,
        padding: 5,
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