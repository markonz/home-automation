const functions = require('firebase-functions');
const admin = require('firebase-admin');
const timestamp = require('firebase-firestore-timestamp');

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_FORBIDDEN = 403;
const HTTP_METHOD_NOT_ALLOWED = 405;

admin.initializeApp(functions.config().firebase);


Date.prototype.yyyymmdd = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
  
    return [this.getFullYear(),
            (mm>9 ? '' : '0') + mm,
            (dd>9 ? '' : '0') + dd
           ].join('');
  };
  
function formatSummaryIdentifier(timestamp, measType, location) {
    return [timestamp.yyyymmdd(), measType, location].join('-');
}

function aggregateToDatabase(id, data) {

    return admin.firestore().collection('measDailyData').doc(id).get()
    .then(snapshot => snapshot.data())
    .then(prevdata => {
        if(prevdata) {
            prevdata.count += data.count;
            prevdata.sum += data.sum;
            if(data.max > prevdata.max) prevdata.max = data.max;
            if(data.min > prevdata.min) prevdata.min = data.min;
            admin.firestore().collection('measDailyData').doc(id).set(prevdata);
        } else {
            admin.firestore().collection('measDailyData').doc(id).set(data);
        }
    })
    .then((result) => {
        return(result);
    });
}
//return 
//.then( () => data);

function removeAggregatedMeasurements(snapshot) {
    var batch = admin.firestore().batch();

    snapshot.docs.forEach((doc) => {
        var docRef = admin.firestore().collection('measurements').doc(doc.id);
        batch.delete(docRef);
    });

//        batch.set(docRef, {cleaned: true}, { merge: true });
    // Commit the batch
    return batch.commit().then(function () {
        // ...
        });
    }

function performCleanup(command) {
    let endDate = new Date();

    aggregates = {};
    endDate.setDate(endDate.getDate() - 30);

    return admin.firestore().collection('measurements')
        .where('measTime', '<', endDate)
        .orderBy('measTime', 'asc')
        .limit(500)
        .get()
        .then((snapshot) => {            
            console.log("Cleaning up", snapshot.size, "measurements");
            snapshot.docs.forEach((doc) => {
                data = doc.data();
                id = formatSummaryIdentifier(data.measTime, data.measType || 0, data.sensorLocation || 0);
                if(aggregates[id]) {
                    aggregates[id].count++;
                    aggregates[id].sum += data.value;
                    if(data.value < aggregates[id].min)  aggregates[id].min = data.value;
                    if(data.value > aggregates[id].max)  aggregates[id].max = data.value;
                } else {
                    aggregates[id] = {};
                    aggregates[id].measType = data.measType;
                    aggregates[id].sensorLocation = data.sensorLocation;
                    aggregates[id].date = new Date(data.measTime.getFullYear(), data.measTime.getMonth(), data.measTime.getDate(), 12, 00, 00);
                    aggregates[id].count = 1;
                    aggregates[id].min = data.value;
                    aggregates[id].max = data.value;
                    aggregates[id].sum = data.value;
                }
            });

            return(snapshot);
        })
        .then( (snapshot) => {
            removeAggregatedMeasurements(snapshot);
        })
        .then( () => {
            Object.keys(aggregates).forEach(id => {
                aggregateToDatabase(id, aggregates[id]);
            });
        });
}

function insertTankLevelToDatabase(fields) {
    console.log("Inserting tank level",fields.distance);

    fields.measTime = admin.firestore.FieldValue.serverTimestamp();

    console.log(fields);

    return admin.firestore().collection('tankLevelReadings').add(fields)
    .then( () => fields);
}

//function insertMeasurementToDatabase(nMeasType, nLocation, fMeasValue, nSensorBattery, sensorMac, rssi)
function insertMeasurementToDatabase(measurement)
{
    console.log("Inserting", measurement);

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
    var measurement = new Object();

    measurement.measTime = admin.firestore.FieldValue.serverTimestamp();

    measurement.sensorLocation = -1;
    measurement.sensorBattery = 0;
    measurement.sensorMac = "";
    measurement.sensorRssi = 0;
    measurement.gateway = 0;
    measurement.sequence = 0;

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
        measurement.sensorLocation = parseInt(command.location);
    }

    if (command.hasOwnProperty('battery')) { 
        measurement.sensorBattery = parseInt(command.battery);
    }
        
    if (command.hasOwnProperty('mac')) { 
        measurement.sensorMac = command.mac;
    }

    if (command.rssi) { 
        measurement.sensorRssi = command.rssi;
    }

    if (command.hasOwnProperty('gateway')) { 
        measurement.gateway = command.gateway;
    }

    if (command.hasOwnProperty('sequence')) { 
        measurement.sequence = command.sequence;
    }

    measurement.measType = parseInt(command.type);
    measurement.value = parseFloat(command.value);

    insertMeasurementToDatabase(measurement)
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

exports.backgroundCleanup = functions.https.onRequest((req, res) => {
    var response = new Object();

    res.setHeader('Content-type', 'Application/json');

    response.success = false;

    const command = req.body;

    performCleanup(command)
    .then(() => {
        response.success = true;
        res.status(HTTP_OK).send(JSON.stringify(response));
        return;
    });
});
