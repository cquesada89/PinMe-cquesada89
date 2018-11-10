import React, { Component } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Container, Header, Content, Button, Text} from 'native-base';
import { Navigation } from 'react-native-navigation';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Expo, { Constants, Location, Permissions } from 'expo';
import API, { graphqlOperation } from '@aws-amplify/api'
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import styles from './map.component.style.js';
import myMapStyle from './mapstyle';

let id = 0;
var _mapView: MapView;
var myTimestamp = new Date();

const pinDetails = {
  userId: "321",
  eventName: "Test Pin",
  eventType: "Test Type",
  startTime: "Sat 2:25PM",
  endTime: "Sat 2:30PM",
  description: "This is a test pin description",
  latitude: "36.81261365334545",
  longitude: "-119.74580140784383"
}

function randomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

const initialMarkers = [];

export default class MapScreen extends Component {
  constructor(props){
    super(props);

    this.state = {
      region: {
        latitude: 36.812617,
        longitude: -119.745802,
        latitudeDelta: 0.0422,
        longitudeDelta: 0.0221,
      },
      loading: true,
      markers: initialMarkers
    };

    this.getInitialState.bind(this);
    this._getLocationAsync.bind(this);
  }

  // Needed for Native-Base Buttons
  async componentDidMount() {
    await Expo.Font.loadAsync({
      Roboto: require("native-base/Fonts/Roboto.ttf"),
      Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
      Ionicons: require("@expo/vector-icons/fonts/Ionicons.ttf"),
    });
    this.setState({ loading: false });
    this.loadPins();
  }

  // Creates pin on DynamoDB on map press
  onMapPress(e) {
    // console.log(e.nativeEvent.coordinate);
    const newPin = API.graphql(graphqlOperation(mutations.createPin,
      {
        input:
        {
          userId: '123',
          eventName: 'new pin',
          eventType: pinDetails.eventType,
          description: 'my description',
          latitude: e.nativeEvent.coordinate.latitude,
          longitude: e.nativeEvent.coordinate.longitude
        }
      }
    ));

    console.log(newPin);
    this.setState({
      markers: [
        ...this.state.markers,
        {
          name: 'new pin',
          description: 'my description',
          key: id++,
          coordinate: e.nativeEvent.coordinate,
          color: randomColor(),
        },
      ],
    });
  }

  getInitialState() {
    return {
      latitude: 36.812617,
      longitude: -119.745802,
      latitudeDelta: 0.0422,
      longitudeDelta: 0.0221,
    };
  }

  _getLocationAsync = async () => {
    let location = await Location.getCurrentPositionAsync({});
    this.setState({ location });
    let userLocation = {
      latitude: this.state.location.coords.latitude,
      longitude: this.state.location.coords.longitude,
    }
    console.log(JSON.stringify(userLocation));
    _mapView.animateToCoordinate(userLocation, 1000);
  };

  // Adds new pin with info in pinDetails
  addPin = async () => {
    const newPin = API.graphql(graphqlOperation(mutations.createPin, {input: pinDetails}));
    // console.log(newPin);
    Alert.alert('PinMe', "Pin successfully added!");
  }

  // Queries and returns all entries
  getAllPins = async () => {
    const allPins = await API.graphql(graphqlOperation(queries.listPins, {limit: 100}));
    console.log(allPins);
  }

  loadPins = async () => {
    this.setState({markers: []});
    const allPins = await API.graphql(graphqlOperation(queries.listPins, {limit: 100}));
    allPins.data.listPins.items.map(pin => (
      // console.log()
      this.setState({
        markers: [
          ...this.state.markers,
          {
            name: pin.eventName,
            description: pin.description,
            key: pin.id,
            coordinate: {
              latitude: Number(pin.latitude),
              longitude: Number(pin.longitude)
            },
            color: randomColor(),
          }
        ]
      })
    ))
    console.log('All pins loaded!');
  }

  // Queries for entry with matching id
  getOnePin = async () => {
    const onePin = await API.graphql(graphqlOperation(queries.getPin, { id: '30e700b4-31bb-48e3-a9e7-ab4b30e81f73' }));
    console.log(onePin);
  }

  render() {
    if (this.state.loading) {
      return <Expo.AppLoading />;
    }
    return (
      <View style ={styles.container}>
        <StatusBar hidden/>

        <MapView
          // provider={PROVIDER_GOOGLE}
          ref = {(mapView) => { _mapView = mapView; }}
          customMapStyle={myMapStyle}
          style={styles.map}
          onRegionChange={(region) => {this.setState({region}); console.log(region);}}
          initialRegion={this.getInitialState()}
          onPress={(e) => this.onMapPress(e)}
        >

        {this.state.markers.map((marker, index) => (
          <Marker draggable
            key={marker.key}
            title={marker.name}
            description={marker.description}
            coordinate={marker.coordinate}
            pinColor={marker.color}
          />
        ))}

        </MapView>

        <View style={styles.buttonContainer}>
          <Button rounded light
            onPress={this.addPin}
            >
            <Text>Add Pin</Text>
          </Button>

          <Button rounded light
            style={{top: 10}}
            onPress={this.getAllPins}
            >
            <Text>Get All Pins</Text>
          </Button>

          <Button rounded light
            style={{top: 20}}
            onPress={this.getOnePin}
            >
            <Text>Get One Pin</Text>
          </Button>

          <Button rounded light
            style={{top: 30}}
            onPress={this._getLocationAsync}
            >
            <Text>Re-center on User</Text>
          </Button>

          <Button rounded light
            style={{top: 40}}
            onPress={this.loadPins}
            >
            <Text>Load Pins</Text>
          </Button>


        </View>

        <View style={[styles.bubble, styles.latlng, {bottom: 10}]}>
          <Text style={{ textAlign: 'center'}}
            onPress = {() => _mapView.animateToCoordinate(this.getInitialState(), 1000)}
            >
            {this.state.region.latitude.toPrecision(7)},
            {this.state.region.longitude.toPrecision(7)}
          </Text>
        </View>


      </View>
    );
  }
}