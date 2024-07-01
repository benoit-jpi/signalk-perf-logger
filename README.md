# signalk-data-logger

A Signal K Node server plugin for logging performance data to csv files.

## Configuration

A directory have to be defined for writing the csv files. Make sure the signalk-server process has permissions to write to the defined directory !

What is logged ?
- Timestamp
- Latitude WGS84 (decimal degrees)
- Longitude WGS84 (decimal degrees)
- SOG : Speed Over Ground (knots)
- COG : Course Over Ground (degrees/true North)
- STW : Speed Through Water (knots)
- AWS : Apparent Wind Speed (knots)
- AWA : Apparent Wind Angle (degrees/heading line)

## Basis
© Largely inspired by the project signalk-data-logger (https://github.com/mairas/signalk-data-logger)
