# kinect-carousel

Little experiment to control an image carousel with a Kinect.  
Demonstration video coming soon.

## Credits

- 3D CSS carousel code by [David DeSandro](desandro.com)    
  Check [https://github.com/desandro/3dtransforms](https://github.com/desandro/3dtransforms) for details
- OSC Bridge by Javi Agenjo [@tamat](https://twitter.com/tamat)   
  Check [http://www.tamats.com/blog/?p=339](http://www.tamats.com/blog/?p=339)
  
## Installation & Usage
  
- Buy a Kinect
- Install drivers
- Connect Kinect to your computer
- Start OSC/Websocket bridge: `node oscbridge.js -port 4343`
- Start Processing (`/kinect/kinect.pde`)
- Open Client (`/client/index.html`)
- Have fun!

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
	- Modern browser