import 'react-native-gesture-handler';
import * as React from 'react';
import { Text, View, Image, StyleSheet, Button, TouchableOpacity, ScrollView, TextInput, Keyboard } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faPlusCircle, faTimes } from '@fortawesome/free-solid-svg-icons'
import { AsyncStorage } from 'react-native';

//!! Almost all of this code is from the JAMK Mobile Development course "To Do List" exercise

class ListItem extends React.Component {
    deleteItem = (index) => {
      this.props.deleteItem(index);
    }
  
    render() {
      return (
        <View style={styles.listItem}>
            <ScrollView 
                style={styles.listItemTextContainer}
                horizontal={true}>
                <Text style={styles.listItemText}>{this.props.text}</Text>
            </ScrollView>
            <TouchableOpacity onPress={(e) => this.deleteItem(this.props.index)}>
                <FontAwesomeIcon 
                    style={styles.listItemDelete}
                    icon={ faTimes }
                    size={ 20 }
                /> 
            </TouchableOpacity>
        </View>
      )
    }
  }
  

  
class CustomWordsScreen extends React.Component {
    constructor(props) {
        super(props);

        this.state = { 
            words: [], 
            text: '' 
        };
    }

    async UNSAFE_componentWillMount()
    {
        //Load saved data
        AsyncStorage.getItem('customArray', (error, result) => {
            this.setState({words: JSON.parse(result)})
        })
    }
        
    async componentWillUnmount()
    {
        //Save data
        AsyncStorage.setItem('customArray', JSON.stringify(this.state.words));
    }

    addItem = () => {
        if (this.state.text !== '') {
        this.setState({
            words: [...this.state.words, this.state.text],
            text: ''
        });
        
        Keyboard.dismiss();
        }
    }

    deleteItem = (index) => {
        var words = this.state.words;
        words.splice(index, 1);
        this.setState({words:words});
    }
     
    
    render() {
        var words = this.state.words.map(function(item,index){
            return (
              <ListItem text={item} key={index} index={index} 
                deleteItem={this.deleteItem}/>
            )
        }.bind(this));
      

        return (
            <View style={styles.mainPage}>
                <View style={styles.textInputContainer}>
                    <ScrollView horizontal={true}>
                        <TextInput
                            style={styles.textInput}
                            placeholder={'Type your text here'}
                            placeholderTextColor={'#888'}
                            onChangeText={(text) => this.setState({text})}
                            value={this.state.text}
                        />
                    </ScrollView>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={this.addItem}
                    >
                        {/* <Text style={styles.addButton}>Add</Text> */}
                        <FontAwesomeIcon 
                            style={styles.addButtonIcon}
                            icon={ faPlusCircle }
                            size={ 35 }
                        /> 
                    </TouchableOpacity>
                </View>
                <ScrollView>
                    {words}
                </ScrollView>
            </View>
        );
    }
}

export default CustomWordsScreen;

const styles = StyleSheet.create({
    mainPage: {
        backgroundColor: '#191E29',
        flex: 1,
    },
    listItem: {
        backgroundColor: '#13171F',
        borderRadius: 5,
        width: '90%',
        marginBottom: 10,
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: 5,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    listItemText: {
        color: '#CCC',
        fontSize: 25,
        overflow: 'scroll',
    },
    listItemTextContainer: {
        marginLeft: 10,
        marginRight: 'auto',
    },
    listItemDelete: {
        color: '#888', //#be041a for red
        margin: 8,
        marginLeft: 10,
        textAlignVertical: 'center',
    },
    textInputContainer: {
        width: '90%',
        marginTop: 30,
        marginBottom: 15,
        marginLeft: 'auto',
        marginRight: 'auto',
        flexDirection: 'row',
        paddingBottom: 15,
        borderBottomColor: '#13171F',
        borderBottomWidth: 3,
    },
    textInput: {
        marginLeft: 0,
        marginRight: 'auto',
        textAlign: 'left',
        fontSize: 25,
        color: '#CCC',
    },
    addButton: {
        backgroundColor: '#13171F',
        borderRadius: 5,
        textAlignVertical: 'center',
        textAlign: 'center',
        borderWidth: 0,
        color: '#CCC',
        fontFamily: 'Roboto',
        marginLeft: 'auto',
        marginRight: 0,
        width: 80,
        fontSize: 25,
        padding: 5,
    },
    addButtonIcon: {
        color: '#888', //FFC227 for yellow
        marginRight: 5,
    },
});