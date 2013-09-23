# kinect-carousel

Little experiment to control an image carousel with a Kinect.

## Credits

3D CSS carousel code by [David DeSandro](desandro.com)

Check [https://github.com/desandro/3dtransforms](https://github.com/desandro/3dtransforms) for details

## Dependencies/Libraries/Requirements

### Hardware

- Computer
- Kinect ([Drivers/Installation Guide for Mac OS 10.8](http://blog.nelga.com/setup-microsoft-kinect-on-mac-os-x-10-8-mountain-lion/))

### Software

- Server:
	- node.js
		- npm
		- node-osc
		- faye-websocket
	- OSC/Websocket bridge
	
- Kinect:
	- Processing
		- SimpleOpenNI 0.27
		- oscP5
		
- Client:  
	- HTML5
	- CSS3
	- jQuery