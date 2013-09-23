// import libraries
import SimpleOpenNI.*;
import oscP5.*;
import netP5.*;

// set global objects
SimpleOpenNI context; 
OscP5 oscP5;
NetAddress myRemoteLocation;

// set some vars
boolean handsTrackFlag = false; 
PVector handVec = new PVector();

void setup() {
  
  // set window size
  size(640, 480);
  
  // start oscP5, telling it to listen for incoming messages
  oscP5 = new OscP5(this,43431);
 
  // set the remote location to be the localhost
  myRemoteLocation = new NetAddress("127.0.0.1",43431);  
  
  // set openNI and some options
  context = new SimpleOpenNI(this);
  context.setMirror(true);
  context.enableDepth();
  context.enableGesture();
  context.enableHands();
  context.setSmoothingHands(.5);
  context.addGesture("Click");
  fill(255, 0, 0);
  
}

void draw() {
 
  // update the cam
  context.update();
 
  //paint the image
  image(context.depthImage(), 0, 0, width, height);
  if (handsTrackFlag) {
    
    //storage device
    PVector myPositionScreenCoords  = new PVector(); 
    
    //convert the weird kinect coordinates to screen coordinates.
    context.convertRealWorldToProjective(handVec, myPositionScreenCoords);
   
    // store coordinates
    float handx = myPositionScreenCoords.x;
    float handy = myPositionScreenCoords.y;
    float handz = myPositionScreenCoords.z;
    
    ellipse(handx, handy, 20, 20);
    
    // create an osc message
    OscMessage myMessage = new OscMessage("handposition/");
    
    // add coordinates to message
    myMessage.add(handx);
    myMessage.add("/");
    myMessage.add(handy);
    myMessage.add("/");
    myMessage.add(handz);
 
    // send the message
    oscP5.send(myMessage, myRemoteLocation);   
    
  }
}

// hand events
void onCreateHands(int handId, PVector pos, float time) {
  
  handsTrackFlag = true;
  handVec = pos;
  
  // create an osc message
  OscMessage myMessage = new OscMessage("found");
 
  // send the message
  oscP5.send(myMessage, myRemoteLocation);       
  
}

void onUpdateHands(int handId, PVector pos, float time) {
  
  //store the location of the hand in a vector object
  handVec = pos;  
  
}

void onDestroyHands(int handId, float time) {     
  
  handsTrackFlag = false;
  
  //go back to looking for the guesture that gave you hand.
  context.addGesture("Click");
  
  // create an osc message
  OscMessage myMessage = new OscMessage("lost");
 
  // send the message
  oscP5.send(myMessage, myRemoteLocation);  
  
}

// gesture events
void onRecognizeGesture(String strGesture, PVector idPosition, PVector endPosition) {
  
  println("onRecognizeGesture - strGesture: " + strGesture + ", idPosition: " + idPosition + ", endPosition:" + endPosition);
  
  //stop looking for the gesture
  context.removeGesture(strGesture);
  
  //use the location of this guesture tell you where to start tracking the hand
  context.startTrackingHands(endPosition);
}

void onProgressGesture(String strGesture, PVector position, float progress) {
  println("onProgressGesture - strGesture: " + strGesture + ", position: " + position + ", progress:" + progress);
}

// Keyboard event
void keyPressed() {
  switch(key)
  {
  case ' ':
    context.setMirror(!context.mirror());
    break;
  }
}
