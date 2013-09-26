# kinect-carousel

Little experiment to control an image carousel with a Kinect.  
Demonstration video coming soon.

## Credits

- 3D CSS carousel by [David DeSandro](desandro.com)    
  See [https://github.com/desandro/3dtransforms](https://github.com/desandro/3dtransforms) for details
- OSC Bridge by Javi Agenjo [@tamat](https://twitter.com/tamat)   
  See [http://www.tamats.com/blog/?p=339](http://www.tamats.com/blog/?p=339)
- Progress bar for virtual cursor by [blakek.us](http://blakek.us/) and [atomicnogging](http://atomicnoggin.ca/blog/2010/02/20/pure-css3-pie-charts/)  
  See [http://blakek.us/css3-pie-graph-timer-with-jquery/](http://blakek.us/css3-pie-graph-timer-with-jquery/)
  
## Installation & Usage
  
- Buy a Kinect
- Install drivers
- Connect Kinect to your computer
- Start OSC/Websocket bridge: `node oscbridge.js -port 4344`
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
	- OSC/Websocket bridge
	
- Kinect:
	- Processing
		- SimpleOpenNI 0.27
		- oscP5
		
- Client:  
	- Modern browser