from bluepy import btle
from time import sleep

import struct
import threading
import datetime
import requests
import json
import time
import sys

import socket
import fcntl

import logging
import logging.handlers


g_devTimestamps = dict();
g_gatewayName = ""

g_log = logging.getLogger(__name__)

def firebaseHttpAPI(handler, fields):
    url = 'https://us-central1-home-automation-2ded4.cloudfunctions.net/'+handler
#    url = 'https://api.emecon.fi/rx_logger.php'

    fields_json = json.dumps(fields, sort_keys=True, indent=4, separators=(',', ': '))

    headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}

    print(fields_json)
    response = requests.post(url, data=fields_json, headers=headers)
    print(response.text)
    print(response.status_code, response.reason)

def get_ip_address(ifname):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    return socket.inet_ntoa(fcntl.ioctl(
        s.fileno(),
        0x8915,  # SIOCGIFADDR
        struct.pack('256s', ifname[:15])
    )[20:24])

def gatewayIdentityToDatabase(gwName, localIP):
    data = dict()
    
    data['name'] = gwName
    data['address'] = localIP

    firebaseHttpAPI('gatewayIdent', data)

def exportGatewayIdentity2():
    global g_gatewayName

    g_gatewayName = sys.argv[1]
    ifname = 'wlan0'
    try:
        localip = get_ip_address(ifname)
        iplen = len(localip)

        print "GW name: %s   ADDRESS %s" % (g_gatewayName, localip)
        if iplen > 8:
            gatewayIdentityToDatabase(g_gatewayName, localip)
    except IOError as e:
        print "IP address for %s not available" % (ifname)
    except:
        print "IP fetch error:", sys.exc_info()[0]
        raise        

def distanceToFillLevel(distance):
    EMPTY_DISTANCE = 250
    FULL_DISTANCE = 50
    DISTANCE_RANGE = EMPTY_DISTANCE - FULL_DISTANCE

    if distance >= EMPTY_DISTANCE:
        return(0)

    if distance <= FULL_DISTANCE:
        return(100)

    diffFromEmpty = EMPTY_DISTANCE - distance

    fillLevel = 100 * diffFromEmpty / DISTANCE_RANGE

    print "distance %u => fill level %u" % (distance, fillLevel)

    return fillLevel

# TANK LEVEL SENSOR
# ddddbbbbffnnssssaabbAAAABBBB
#   dddd    distance (cm)
#   bbbb    external battery (mV)
#   ff      fill level (%)
#   nn      number of measurements
#   ssss    signal strength
#   aa      max distance dev low
#   bb      max distance dev high
#   AAAA    max signal dev low
#   BBBB    max signal dev high

def parseTankLevelSensor(sensorInfo, strPayload):
    advData = dict()

    advData['distance'] = int(strPayload[12:16], 16)
    advData['externalBattery'] = int(strPayload[16:20], 16)
    advData['internalBattery'] = batteryVoltage
    advData['temperature'] = int(strPayload[20:22], 16)
    advData['numMeasurements'] = int(strPayload[22:24], 16)
    advData['signalStrength'] = int(strPayload[24:28], 16)
    advData['minDistance'] = advData['distance'] - int(strPayload[28:30], 16)
    advData['maxDistance'] = advData['distance'] + int(strPayload[30:32], 16)
    advData['minSignal'] = advData['signalStrength'] - int(strPayload[32:36], 16)
    advData['maxSignal'] = advData['signalStrength'] + int(strPayload[36:40], 16)

    fill = distanceToFillLevel(advData['distance'])

    print "    DISTANCE %d  FILL %u  EBATT %u  SIG %u  TEMP %d" % (advData['distance'], fill, advData['externalBattery'], advData['signalStrength'], advData['temperature'])
    print "       dDISTANCE %d/%d   dSIG %d/%s" % (advData['minDistance'], advData['maxDistance'], advData['minSignal'], advData['maxSignal'])

    saveTankLevelToDatabase(advData, fill, sensorInfo)

# DOOR SENSOR
# dd
#   dd      door state (0 closed, 1 open)

def parseDoorSensor(sensorInfo, strPayload):
    doorState = int(strPayload[12:14], 16)

    location = getDoorSensorLocation(address)

    print "    DOOR [%d]: %d" % (location, doorState)
    saveMeasurementToDatabase(3, location, doorState, sensorInfo)

def getDoorSensorLocation(address):
#    if address == "47:45:43:4b:4f:54":
#        return(1)   # Outside

    return(0)       # Undefined


# TEMPERATURE SENSOR
# tttt
#   tttt    temperature (0.1C)

def parseTempertureSensor(sensorInfo, strPayload):
    temperature = int(strPayload[12:16], 16)

    if temperature > 600:
        temperature = negativeTemperatureCorrection(temperature)

    location = getTemperatureSensorLocation(address)

    print "    TEMPERATURE [%d]: %d" % (location, temperature)
    saveMeasurementToDatabase(1, location, float(temperature)/10, sensorInfo)

def negativeTemperatureCorrection(temperature):
    temperature *= 100
    hex_string = format(temperature, '#04X')[-4:]

    temperature = int(hex_string, 16) - 0x10000

    return(temperature / 100)

def getTemperatureSensorLocation(address):
    if address == "47:45:43:4b:4f:54":
        return(1)   # Outside
    if address == "90:fd:9f:7b:53:1c":
        return(2)   # Inside

    return(0)       # Undefined

# FF1234ssqqbbbb...
#   ss      sensor type
#               1  temperature sensor
#               2  tank level sensor
#               3  door sensor
#   qq      report sequence number
#   bbbb    sensor battery (mV)

def parseSensorData(address, rssi, strPayload):
    sensorInfo = dict()

    advData['distance'] = int(strPayload[12:16], 16)
    now = int(time.time())
    sensorInfo['address'] = address
    sensorInfo['rssi'] = rssi
    sensorInfo['sensorType'] = int(strPayload[4:6], 16)
    sensorInfo['sequenceNumber'] = int(strPayload[6:8], 16)
    sensorInfo['batteryVoltage'] = int(strPayload[8:12], 16)

    exportGatewayIdentity2()
#    g_log.debug('Message from '+address+': '+strPayload)

    tdiff = 999
    if address in g_devTimestamps:
        tdiff = now - g_devTimestamps[address]

    print "%s" % (strPayload)
    print "%s: %s  SEQ %u  TDIFF %d   SENSOR %d   VOLTAGE %u" % (datetime.datetime.now(), address, sensorInfo['sequenceNumber'], tdiff, sensorInfo['sensorType'], sensorInfo['batteryVoltage'])
    
    if sensorType == 1:
        parseTempertureSensor(sensorInfo, strPayload)

    if sensorType == 2:
        parseTankLevelSensor(sensorInfo, strPayload)

    if sensorType == 3:
        parseDoorSensor(sensorInfo, strPayload)

    g_devTimestamps[address] = int(time.time())

def scan():
    """ Scans for available devices. """
    scan = btle.Scanner()
    devs = scan.scan(5)
    for dev in devs:
#            print "Device %s (%s), RSSI=%d dB" % (dev.addr, dev.addrType, dev.rssi)
        for (adtype, desc, value) in dev.getScanData():
            if adtype==255 and value.startswith("1234"):
                parseSensorData(dev.addr, dev.rssi, value)


def saveTankLevelToDatabase(advData, fill, sensorInfo):
    postData = dict()
    
    postData['distance'] = str(advData['distance'])
    postData['fill'] = str(fill)
    postData['temperature'] = str(advData['temperature'])
    postData['ibatt'] = str(advData['internalBattery'])
    postData['ebatt'] = str(advData['externalBattery'])
    postData['signal'] = str(advData['signalStrength'])
    postData['distMin'] = str(advData['minDistance'])
    postData['distMax'] = str(advData['maxDistance'])
    postData['sigMin'] = str(advData['minSignal'])
    postData['sigMax'] = str(advData['maxSignal'])

    postData['sequence'] = str(sensorInfo['sequenceNumber'])
    postData['rssi'] = str(sensorInfo['rssi'])
    postData['mac'] = sensorInfo['address']
    postData['gateway'] = g_gatewayName

    firebaseHttpAPI('tanklevel', postData)

def saveMeasurementToDatabase(sensorType, sensorLocation, measValue, sensorInfo):
    postData = dict()
    
    postData['type'] = str(sensorInfo['sensorType'])
    postData['location'] = str(sensorLocation)
    postData['value'] = str(sensorInfo['measValue'])

    postData['sequence'] = str(sensorInfo['sequenceNumber'])
    postData['rssi'] = str(sensorInfo['rssi'])
    postData['battery'] = str(sensorInfo['sensorBattery'])
    postData['mac'] = sensorInfo['address']
    postData['gateway'] = g_gatewayName
    
    firebaseHttpAPI('meas', postData)

def setupLogging():
    g_log.setLevel(logging.DEBUG)
    
    handler = logging.handlers.SysLogHandler(address = '/dev/log')
    formatter = logging.Formatter('%(module)s.%(funcName)s: %(message)s')

    handler.setFormatter(formatter)

    g_log.addHandler(handler)

def get_ip_address(ifname):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    return socket.inet_ntoa(fcntl.ioctl(
        s.fileno(),
        0x8915,  # SIOCGIFADDR
        struct.pack('256s', ifname[:15])
    )[20:24])
    
def exportGatewayIdentity():
    
    localIP = sys.argv[2]

#    g_log.debug('Homesensor IP address '+localIP)

if __name__ == '__main__':
    setupLogging()

    exportGatewayIdentity2()

    g_log.debug('Homesensor gateway started')

    while True:
        scan();
