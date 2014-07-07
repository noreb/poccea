var pocPub = angular.module('pocPub', ['onsen.directives']);

/**
* Preferences Controler
* Manage all the user settings
*
*/
pocPub.controller('preferencesCtrl', function($scope){
  $scope.pref = [];
  $scope['locationServiceSwitch'] = window.localStorage.getItem("locationServiceSwitch");
  $scope['drivingServiceSwitch']  = window.localStorage.getItem("drivingServiceSwitch");
  $scope['familyServiceSwitch']   = window.localStorage.getItem("familyServiceSwitch");


  $scope.setPreference = function(key) {
    if($scope[key] == "0") {
        localStorage.setItem(key, "1");
        $scope[key] = "1";
    } else {
        localStorage.setItem(key, "0");
        $scope[key] = "0";
    }
  };
});



/**
* Login Controler
* do all the stuff to check the user identity
*
*/
pocPub.controller('LoginController', function($scope){
    $scope.login = function(id, password){
        $scope.ons.screen.presentPage('sliding_menu.html');
    };
});



/**
* Main controler
* Detect ads and play dedicated ads
*/
pocPub.controller('mainController', function($scope){

  $scope.ceasimulator = cordova.require('cordova/plugin/ceasimulator');
  $scope.car = new Car($scope.ceasimulator);

console.log('ceasimulator : ' + JSON.stringify($scope.ceasimulator));
console.log('car : ' + JSON.stringify($scope.car));


  $scope.historic_signals  = {};   // hashtable with the last signals received
  $scope.locationService   = true; // bool : true if user allow us to collect his locaiton
  $scope.driveService      = true; // true if the user allow us to evaluate his driving style
  $scope.familyService     = true; // true if the user allow us to collect data from his familly

    $scope.ads = window.localStorage.getItem("adsDetected"); // ads counter

    if ($scope.ads == '') {
        $scope.ads = 0;
        window.localStorage.setItem("adsDetected",0);
    }

  //process success value
  $scope.resultMethod = function(data) {
    console.info(JSON.stringify(data));
  };

  //process error value
  $scope.errorFunction = function(data) {
    var currentdate = new Date();
    console.error(currentdate + " - " + JSON.stringify(data));
    alert(data);
  };

  // Initialisation
  $scope.init = function(){
    $scope.getRadioStationText();
  };

  // get radio title song
  $scope.getRadioStationText = function() {
    var attributeIDList = [];
    attributeIDList.push({
      'CEA.VehicleData.Media.RadioStationText' : ''
    });
    $scope.ceasimulator.subscribe(attributeIDList, $scope.analyzeSource, $scope.errorFunction);
  };

  // match the selected program
  $scope.analyzeSource = function(data) {

console.log('data : ' + JSON.stringify(data));
console.log('car : ' + JSON.stringify($scope.car));

if (JSON.stringify(data) != "[]") {
    var signalname ='CEA.VehicleData.Media.RadioStationText';

      if (typeof $scope.historic_signals[signalname] === 'undefined' ||
        JSON.stringify($scope.historic_signals[signalname]) =="[]" ||
        JSON.stringify($scope.historic_signals[signalname]) != JSON.stringify(data) ){

        if (data[0]['CEA.VehicleData.Media.RadioStationText'].indexOf("pub") > -1){
            // Here we have an ad !
            // let's do some work
            // set to mute
            $scope.car.setValue('CEA.VehicleData.Media.Mute', 1, $scope.resultMethod, $scope.errorFunction);
            $scope.car.setValue('CEA.VehicleData.Media.RadioStationSource', 3, $scope.resultMethod, $scope.errorFunction);
            //increment the global counter of ads and store it.
            $scope.$apply(function() {
                $scope.ads++;
                localStorage.setItem('adsDetected', $scope.ads);
            });
            //play some music
            $scope.playAudio();

            $scope.historic_signals[signalname] = data;

        } else {
          // It's a normal program
          // pumpup the volume !
          $scope.car.setValue('CEA.VehicleData.Media.Mute', 0, $scope.resultMethod, $scope.errorFunction);
          $scope.car.setValue('CEA.VehicleData.Media.RadioStationSource', 0, $scope.resultMethod, $scope.errorFunction);
        }
      } else {
        /**
        * same player shoot again !
        * we've received the same signal
        */
      }
  }
  };

  // Get the state of the mute switch on the simulator
  $scope.getSimulatorValue = function () {
    var attributeIDList = [];
    attributeIDList.push({
        'CEA.VehicleData.Media.Mute' : ''
    });
    $scope.ceasimulator.get(attributeIDList, $scope.update, $scope.errorFunction);
  };

  // switch th mute value
  $scope.update = function(data){
    if(data[0]) {
      var value = (parseInt(data[0]['CEA.VehicleData.Media.Mute']) === 0) ? 1 : 0;
        $scope.setTo(value);
    }
  };

  // set the value of the mute switch
  $scope.setTo = function(b) {
    //var car = new Car($scope.ceasimulator);
    $scope.car.setValue('CEA.VehicleData.Media.Mute', b, $scope.resultMethod, $scope.errorFunction);
  };

  // play an audio file
  // for the moment i have only one audio file
  // in the future this function have to take in parameter the
  // name/path of the audio file
  $scope.playAudio = function() {
      var my_media = new Media('pub.mp3',
          function () {
            // it worked !
          },
          function (err) {
              console.log("playAudio():Audio Error");
          }
      );
      // Play audio
      my_media.play();
  };

  //============================================================================
  // ok lets start Rock'n'rool !
  //============================================================================
  $scope.init();
});
