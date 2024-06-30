# signalk-data-logger

A Signal K Node server plugin for logging performance data to csv files.
The file rotation interval can be configured and the old files are compressed to save space.

## Installation

Should be eventually available on the Signal K Appstore.

## Configuration

A directory have to be defined for writing the csv files. Make sure the Node server process has permissions to write to the defined directory!

What is logged is :
- Timestamp
- STW : Speed Through Water
- AWS : Apparent Wind Speed
- AWA : Apparent Wind Angle

## Basis
Very largely inspired by the project signalk-data-logger (https://github.com/mairas/signalk-data-logger/tree/master)
