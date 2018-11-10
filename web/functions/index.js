const functions = require('firebase-functions');
const admin = require('firebase-admin');
const timestamp = require('firebase-firestore-timestamp');

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_FORBIDDEN = 403;
const HTTP_METHOD_NOT_ALLOWED = 405;

admin.initializeApp(functions.config().firebase);


function insertTankLevelToDatabase(fields) {
    console.log("Inserting tank level",fields.distance);

    fields.measTime = admin.firestore.FieldValue.serverTimestamp();

    console.log(fields);

    return admin.firestore().collection('tankLevelReadings').add(fields)
    .then( () => fields);
}

function insertMeasurementToDatabase(nMeasType, nLocation, fMeasValue, nSensorBattery, sensorMac, rssi)
{
    console.log("Inserting",nMeasType, nLocation, fMeasValue);

    var measurement = new Object();

    measurement.measType = nMeasType;
    measurement.sensorLocation = nLocation;
    measurement.value = fMeasValue;
    measurement.sensorBattery = nSensorBattery;
    measurement.measTime = admin.firestore.FieldValue.serverTimestamp();
    measurement.sensorMac = sensorMac;
    measurement.sensorRssi = rssi;

    console.log(measurement);

    return admin.firestore().collection('measurements').add(measurement)
    .then( () => measurement);
}

function updateGatewayIdentity(gwName, gwAddress)
{
    console.log("Inserting",gwName, gwAddress);

    let data = {};

    data.name = gwName;
    data.ipAddress = gwAddress;
    data.updateTimestamp = admin.firestore.FieldValue.serverTimestamp();

    console.log(data);

    return admin.firestore().collection('gateways').doc(gwName).set(data)
    .then( () => data);
}


function executeCommandTest(command)
{
    return admin.firestore().collection('measurements')
        .get()
    .then(snapshot => { 
        snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
        });
    });
}

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.meas = functions.https.onRequest((req, res) => {
    var response = new Object();
    var nLocation = 1;
    var nSensorBattery = 0;
    var nMeasType;
    var fMeasValue;
    var sensorMac = "";
    var rssi = 0;

    res.setHeader('Content-type', 'Application/json');

    response.success = false;

    if (req.method !== 'POST') {
        response.reason = 'Method Not Allowed';
        res.status(HTTP_METHOD_NOT_ALLOWED).send(JSON.stringify(response));
        return;
    }

    const command = req.body;

    if (!command.type) { 
        response.reason = 'Measurement type not defined';
        res.status(HTTP_BAD_REQUEST).send(JSON.stringify(response));
        return;
    }

    if (!command.value) { 
        response.reason = 'Measurement value not defined';
        res.status(HTTP_BAD_REQUEST).send(JSON.stringify(response));
        return;
    }

    if (command.hasOwnProperty('location')) { 
        nLocation = parseInt(command.location);
    }

    if (command.hasOwnProperty('battery')) { 
        nSensorBattery = parseInt(command.battery);
    }
        
    if (command.hasOwnProperty('mac')) { 
        sensorMac = command.mac;
    }

    if (command.rssi) { 
        rssi = command.rssi;
    }

    nMeasType = parseInt(command.type);
    fMeasValue = parseFloat(command.value);
    
//    executeCommandTest(command)
    insertMeasurementToDatabase(nMeasType, nLocation, fMeasValue, nSensorBattery, sensorMac, rssi)
    .then(() => {
        response.success = true;
        res.status(HTTP_OK).send(JSON.stringify(response));
        return;
    });
});


exports.tanklevel = functions.https.onRequest((req, res) => {
    var response = new Object();

    let fields = {};

    res.setHeader('Content-type', 'Application/json');

    response.success = false;

    if (req.method !== 'POST') {
        response.reason = 'Method Not Allowed';
        res.status(HTTP_METHOD_NOT_ALLOWED).send(JSON.stringify(response));
        return;
    }

    const command = req.body;

    if (!command.distance) { 
        response.reason = 'Distance not defined';
        res.status(HTTP_BAD_REQUEST).send(JSON.stringify(response));
        return;
    }

    fields.distance = parseInt(command.distance);

    fields.sensorBattery = (command.ibatt ? parseInt(command.ibatt) : 0);
    fields.externalBattery = (command.ebatt ? parseInt(command.ebatt) : 0);
    fields.temperature = (command.temperature ? parseInt(command.temperature) : 0);
        
    fields.FillPercentage = (command.fill ? parseInt(command.fill) : -1);
    fields.signalLevel = (command.signal ? parseInt(command.signal) : -1);
    fields.sensorMac = (command.mac ? command.mac : "");
    fields.sensorRssi = (command.rssi ? command.rssi : 0);

    fields.distanceMin = (command.distMin ? command.distMin : fields.distance);
    fields.distanceMax = (command.distMax ? command.distMax : fields.distance);
    fields.signalMin = (command.sigMin ? command.sigMin : fields.signalLevel);
    fields.signalMax = (command.sigMax ? command.sigMax : fields.signalLevel);

    insertTankLevelToDatabase(fields)
    .then(() => {
        response.success = true;
        res.status(HTTP_OK).send(JSON.stringify(response));
        return;
    });
});

exports.gatewayIdent = functions.https.onRequest((req, res) => {
    var response = new Object();

    res.setHeader('Content-type', 'Application/json');

    response.success = false;

    if (req.method !== 'POST') {
        response.reason = 'Method Not Allowed';
        res.status(HTTP_METHOD_NOT_ALLOWED).send(JSON.stringify(response));
        return;
    }

    const command = req.body;

    if (!command.name) { 
        response.reason = 'Gateway name not defined';
        res.status(HTTP_BAD_REQUEST).send(JSON.stringify(response));
        return;
    }

    if (!command.address) { 
        response.reason = 'Gateway address not defined';
        res.status(HTTP_BAD_REQUEST).send(JSON.stringify(response));
        return;
    }

    updateGatewayIdentity(command.name, command.address)
    .then(() => {
        response.success = true;
        res.status(HTTP_OK).send(JSON.stringify(response));
        return;
    });
});
