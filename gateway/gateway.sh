#!/bin/sh

cd /home/pi/homesensor-relay/

GW_NAME=GW-KHH

LAUNCH_DATE=`date +%y%m%d`
LOOP_COUNT=1

while true
do
        ERROR_LOG="log/err.$LAUNCH_DATE.$LOOP_COUNT.txt"
        OPER_LOG="log/log.$LAUNCH_DATE.$LOOP_COUNT.txt"

        python2 homesensor_scan.py $GW_NAME >>$OPER_LOG 2>>$ERROR_LOG
#       python2 homesensor_scan.py $GW_NAME

        sleep 10
        LOOP_COUNT=$((LOOP_COUNT+1))
done
