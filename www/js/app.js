var pocPub = angular.module('pocPub', ['onsen.directives']);

pocPub.factory('car', function(){
    var ceasimulator = cordova.require('cordova/plugin/ceasimulator');
    var car = new Car(ceasimulator);

    return {
        subscribe: function(signal, success_callback, error_callback){
            console.debug('subscribing : ' + JSON.stringify(signal));
            car.subscribe(signal, success_callback, error_callback);
        },
        unsubscribe: function(signal, success_callback, error_callback) {
            console.debug('unsubscribing : ' + JSON.stringify(signal));
            car.unsubscribe(signal, success_callback, error_callback);
        },
        get: function(signal, success_callback, error_callback) {
            console.debug('geting : ' + JSON.stringify(signal));
            car.getValue(signal, success_callback, error_callback);
        },
        set: function(signal, value, success_callback, error_callback) {
            console.debug('seting : ' + JSON.stringify(signal) + ' to : ' + JSON.stringify(value));
            car.setValue(signal, value, success_callback, error_callback);
        }
    };
});

pocPub.factory('subscribed_signals', function(){
    var subscribed_signals = [];

    return {
        get_all: function(){
            return subscribed_signals;
        },
        add: function(signal){
            subscribed_signals.push(signal);
        },
        pop: function(){
            return subscribed_signals.pop();
        },
        length: function(){
            return subscribed_signals.length;
        },
        indexOf: function(signal){
            return subscribed_signals.indexOf(signal);
        }
    };
});

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


    $scope.set_user_preference = function(key) {
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
pocPub.controller('LoginController', function($scope, subscribed_signals, car){
    $scope.login = function(id, password){
        if ($scope.check_login(id,password)) {
            $scope.ons.screen.presentPage('sliding_menu.html');
        } else {
            $scope.ons.screen.presentPage('error_menu.html');
        }
    };

    $scope.check_login = function(id, password) {
        return true;
    };

    $scope.logout = function(){
        while(subscribed_signals.length() > 0){
            var my_signal = subscribed_signals.pop();
            car.unsubscribe(my_signal, null, null);
        }
    };
});



/**
* Main controler
* Detect ads and play dedicated ads
*/
pocPub.controller('mainController', function($scope,subscribed_signals,car){

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
    $scope.success_callback = function(data) {
        console.debug('success_callback : ' + JSON.stringify(data));
    };

    //process error value
    $scope.error_callback = function(data) {
        var currentdate = new Date();
        console.error(currentdate + " - " + JSON.stringify(data));
        alert(data);
    };

    // Initialisation
    $scope.init = function(){
        console.debug('init');
        $scope.get_radio_station_text();
    };

    // subscribe to the radio title song signal
    $scope.get_radio_station_text = function() {
        console.debug('get_radio_station_text');
        var attributeIDList = 'CEA.VehicleData.Media.RadioStationText';

        if (subscribed_signals.indexOf(attributeIDList) == -1) {
            subscribed_signals.add(attributeIDList);
            car.subscribe(attributeIDList, $scope.analyze_source, $scope.error_callback);
        } else {
            console.debug('signal already registrered');
        }
    };

    // match the selected program
    $scope.analyze_source = function(data) {
        console.debug('analyze_source');
        var signalname ='CEA.VehicleData.Media.RadioStationText';

        console.debug('data : '+JSON.stringify(data));

        if (typeof $scope.historic_signals[signalname] === 'undefined' ||
            JSON.stringify($scope.historic_signals[signalname]) =="[]" ||
            JSON.stringify($scope.historic_signals[signalname]) != JSON.stringify(data) ){

                console.debug('histo : ' + JSON.stringify($scope.historic_signals[signalname]));

                if ((JSON.stringify(data) != '[]') && data[0]['CEA.VehicleData.Media.RadioStationText'].indexOf("pub") > -1){
                    console.debug('Ad detected');
                    // Here we have an ad !
                    // let's do some work
                    // change input
                    car.set('CEA.VehicleData.Media.RadioStationSource', 3, $scope.success_callback, $scope.error_callback);
                    //increment the global counter of ads and store it.
                    $scope.$apply(function() {
                        $scope.ads++;
                        localStorage.setItem('adsDetected', $scope.ads);
                    });
                    //play some music
                    $scope.play_audio();

                    $scope.historic_signals[signalname] = data;

                } else {
                    // It's a normal program
                    // pumpup the volume !
                    console.log('pump up the volume !');

                    car.set('CEA.VehicleData.Media.Mute', 0, $scope.success_callback, $scope.error_callback);
                    car.set('CEA.VehicleData.Media.RadioStationSource', 0, $scope.success_callback, $scope.error_callback);
                }
        } else {
            console.log('next');
            /**
            * same player shoot again !
            * we've received the same signal
            */
        }
    };

    // Get the state of the mute switch on the simulator
    $scope.get_mute_switch_value = function () {
        var attributeIDList = [];
        attributeIDList.push({
            'CEA.VehicleData.Media.Mute' : ''
        });
        car.get(attributeIDList, $scope.set_mute_switch, $scope.error_callback);
    };

    // switch th mute value
    $scope.set_mute_switch = function(data){
        if(data[0]) {
            var value = (parseInt(data[0]['CEA.VehicleData.Media.Mute']) === 0) ? 1 : 0;
            $scope.set_mute_switch_to(value);
        }
    };

    // set the value of the mute switch
    $scope.set_mute_switch_to = function(b) {
        //var Car = new Car($scope.ceasimulator);
        car.set('CEA.VehicleData.Media.Mute', b, $scope.success_callback, $scope.error_callback);
    };

    // play an audio file
    // for the moment i have only one audio file
    // in the future this function have to take in parameter the
    // name/path of the audio file
    $scope.play_audio = function() {
        var my_media = new Media('pub.mp3',
            function () {
                // it worked !
            },
            function (err) {
                console.error("play_audio():Audio Error");
            }
        );
        // Play audio
        my_media.play();
    };
});
