//Reference to the car simulator
var ceasimulator = cordova.require('cordova/plugin/ceasimulator');
var historic_signals = {};
var locationService = true;
var driveService = true;
var familyService = true;

//process success value
function resultMethod(data) {
  console.info(JSON.stringify(data));
}

//process error value
function errorFunction(data) {
  var currentdate = new Date();
  console.error(currentdate + " - " + data);
};

function init(){
  alert('ho ?');
  getRadioStationText();

  var scope = angular.element(document.getElementById('mainController'));
  scope.init();
}

function getRadioStationText() {
  var attributeIDList = [];
  attributeIDList.push({
    'CEA.VehicleData.Media.RadioStationText' : ''
  });
  ceasimulator.subscribe(attributeIDList, analyzeSource, errorFunction);
};


//process success value
function analyzeSource(data) {

  var signalname ='CEA.VehicleData.Media.RadioStationText';

    if (typeof historic_signals[signalname] === 'undefined' ||
    JSON.stringify(historic_signals[signalname]) =="[]" ||
    JSON.stringify(historic_signals[signalname]) != JSON.stringify(data)){

      historic_signals[signalname] = data;

      var car = new Car(ceasimulator);
      if (data[0]['CEA.VehicleData.Media.RadioStationText'] == "pub"){
        console.info('ad detected');
        car.setValue('CEA.VehicleData.Media.Mute', 1, resultMethod, errorFunction);
        var ads = window.localStorage.getItem("adsDetected");
        ads++;
        localStorage.setItem('adsDetected', ads);
        playAudio();
      } else {
        console.info('normal program detected');
        car.setValue('CEA.VehicleData.Media.Mute', 0, resultMethod, errorFunction);
      }
    } else {
      console.error('analyzeSource => same player shoot again');
    }
};



function getSimulatorValue() {
    console.info('Getting Signals Value');
    var attributeIDList = [];
    attributeIDList.push({
        'CEA.VehicleData.Media.Mute' : ''
    });
    //the interface call has two functions: one to be called in the success
    //and another to be called in the failure
    ceasimulator.get(attributeIDList, update, errorFunction);
};

function update(data){
  if(data[0]) {
    console.info('Updating');

//		var value = parseInt(data[0]['CEA.VehicleData.Media.Mute']);
    var value = (parseInt(data[0]['CEA.VehicleData.Media.Mute']) == 0) ? 1 : 0;
/*    if (value == 0){
      setTo(1);
    } else {*/
      setTo(value);
    //}
  }
}

function setTo(b) {
  var car = new Car(ceasimulator);
  car.setValue('CEA.VehicleData.Media.Mute', b, resultMethod, errorFunction);
}

function getPhoneGapPath() {

  var path = window.location.pathname;
  path = path.substr( path, path.length - 10 );
  return 'file://' + path;

};

function playAudio() {

    // Play the audio file at url
    var my_media = new Media('pub.mp3',
        // success callback
        function () {
            console.log("playAudio():Audio Success");
        },
        // error callback
        function (err) {
            console.log("playAudio():Audio Error: " + getPhoneGapPath() );
        }
    );
    // Play audio
    my_media.play();
}
