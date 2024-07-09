#!/bin/bash
for ((i=1; i<=$1; i++)); do
    file="file$i.txt";
    node.exe index.js $2 >> $file &
    echo "Script executed";
    sleep 0.5;
done
