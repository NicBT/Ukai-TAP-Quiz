let currCat = 0;
let allQuestions = [];
let newQset;
let currQ;
let ansLog = [
  [],
  []
];
let buttons, skip, input, submit;
let finished = false;
let poem;
let tokenObjs;
let increment;
let scl;
let objRelScl;
let font;
let tokenGraphic;
let capColour, objColour;
let capAngle = 0;
let skipped = 0;
let twStarted = false;
let twDone = false;
let bkg;
let results;
let audio;
let started = false;
let database, storage;
let saved = false;
let poemFiller;

function preload() {
  bkg = loadImage('assets/Bkg_Flat1080p.png');
  font = loadFont('fonts/Barlow/Barlow-Regular.ttf');
  loadTable('TAP_Questions.csv', 'csv', 'header', loadQuestions);
  results = loadTable('participant_results.csv', 'csv', 'header');
  audio = loadSound('assets/TAP_audio.wav');
  tokenObjs = [loadModel('assets/Capsule.obj', true),
    loadModel('assets/Love.obj', true),
    loadModel('assets/Devotion.obj', true),
    loadModel('assets/Care.obj', true)
  ];
  poemFiller = loadTable('TAP_Poem_Filler.csv', 'csv');
}

function setup() {
  initFirebase();

  createCanvas(windowWidth, windowHeight);
  textFont(font);
  textSize(30);
  fill('#FFFCDC');
  showBkg();
  text('A Token of Devotion', width / 2 - textWidth('A Token of Devotion') / 2, height / 3);
  let start = createButton('start');
  start.position(width / 2 - start.width / 2, height / 2);
  let about = createButton('about');
  about.position(width / 2 - about.width / 2, height / 2 + tsize * 3);
  start.mousePressed(function() { startQuiz(start, about) });
  about.mousePressed(function() { aboutPage(start, about) })
  noLoop();
}


function draw() {
  if (started) {
    fill('#FFFCDC');
    resizeCanvas(windowWidth, windowHeight);
    showBkg();

    // while still in quiz, display question and update button pos for adaptive window
    if (!finished) {
      if (!twStarted || twDone) {
        currQ.displayQ();
      }
      let i;
      for (i = 0; i < buttons.length; i++) {
        buttons[i].position(width * 0.95 - buttons[i].width, 250 + 1.6 * i * tsize);
      }
      skip.position(width * 0.95 - skip.width, 300 + 1.6 * i * tsize);

      // when quiz finished, display token
    } else {
      rectMode(CENTER);
      textAlign(CENTER, CENTER);
      let textHeight = ceil(textWidth(poem) / (width * 0.7)) * tsize * 1.25;
      text(poem, width / 2, 0.9 * height - textHeight / 2, width * 0.7, height);

      capAngle += increment;
      let objAngle = capAngle * 1.33;
      let capZ = cos(capAngle) * 250;
      let capX = sin(capAngle) * 250;
      let objZ = cos(objAngle) * 250;
      let objX = -sin(objAngle) * 250;

      tokenGraphic.clear();
      push();
      translate(width / 2 - tokenGraphic.width * scl / 2, 0.9 * height - textHeight - height * scl);
      scale(scl);

      tokenGraphic.pointLight(200, 200, 200, 866, 500, 0);
      tokenGraphic.pointLight(200, 200, 200, -866, 500, 0);
      tokenGraphic.pointLight(200, 200, 200, 0, -1000, 0);
      tokenGraphic.pointLight(200, 200, 200, 0, 0, 1000);
      tokenGraphic.pointLight(200, 200, 200, 0, 0, -1000);

      tokenGraphic.camera(capX, 0, capZ, 0, 0, 0, 0, 1, 0);
      tokenGraphic.ambientMaterial(capColour);
      tokenGraphic.model(tokenObjs[0]);

      tokenGraphic.camera(objX, 0, objZ, 0, 0, 0, 0, 1, 0);
      tokenGraphic.ambientMaterial(objColour);
      tokenGraphic.scale(objRelScl);
      tokenGraphic.model(tokenObjs[ansLog[0][0][2] + 1]);
      image(tokenGraphic, 0, 0, tokenGraphic.width, tokenGraphic.height);
      pop();
      if (!saved) {
        saveResults();
      }
    }
  }
}


function showBkg() {
  let displayRatio = width / height;
  let imgRatio = bkg.width / bkg.height;
  if (displayRatio >= 6125 / 4419) {
    image(bkg, 0, height / 2 - width / (imgRatio * 2), width, width / imgRatio);
  } else {
    image(bkg, width / 2 - height * imgRatio / 2, 0, height * imgRatio, height);
  }
}


function startQuiz(startButton, aboutButton) {
  startButton.remove();
  aboutButton.remove();
  frameRate(30);
  getAudioContext().resume();
  audio.setVolume(0.5);
  audio.play();
  audio.setLoop(true);
  started = true;
  currQ = allQuestions[0][0];
  refresh();
  loop();
}


function aboutPage(startButton, aboutButton) {
  startButton.remove();
  aboutButton.remove();
  showBkg();
  text('here are the credits and the FAQ', width / 2 - textWidth('here are the credits and the FAQ') / 2, height / 2);
}


function getToken() {
  // adjust object size
  scl = map(ansLog[1][0][1].length, 0, 100, 0.1, 0.7, true);

  // adjust camera rotation speed
  increment = map(ansLog[1][1][1].length, 0, 100, 0.005, 0.5, true);

  // adjust camera rotation direction
  if (ansLog[1][2][1].length < 40) {
    increment *= -1;
  } else if (ansLog[1][2][1].length < 60) {
    increment = 0;
  }

  // adjust relative scale of two objects 
  objRelScl = map(ansLog[1][3][1].length, 0, 100, 0.8, 2, true);

  let colours = [
    ['#ff9ecf', '#d61c1c', '#e66c7b'],
    ['#ffbd59', '#ff8457', '#ffde59', '#e44444'],
    ['#8c52ff', '#03989e', '#38b6ff', '#084d26']
  ]
  capColour = random(colours[ansLog[0][0][2]]);
  objColour = random(colours[ansLog[0][0][2]])

  tokenGraphic = createGraphics(2 * width, height, WEBGL);
  tokenGraphic.noStroke();

  // fill in poem for token
  poem = getPoem();

  // set state to completed quiz
  finished = true;
}

function getPoem() {
  let numBlanks = poemFiller.getRowCount();
  let fillers = [];

  // create a blank array entry for each filler category
  for (let i = 0; i < numBlanks; i++) {
    fillers[i] = [];
  }

  for (let i = 0; i < numBlanks; i++) {
    let j = 2;
    // if cell (i, j) has text, it will return true, if not it'll return false
    while (poemFiller.get(i, j)) {
      fillers[i].push(poemFiller.get(i, j));
      j++;
    }
  }

  return 'As we ' + random(fillers[0]) + ' for the last time, I thought about how when the universe ' +
    random(fillers[1]) + ' the final thread into this ' + random(fillers[2]) +
    ', it shook and shook and shook and then somewhere along the lines, my grand plan of ' +
    random(fillers[3]) + ' failed but in it, we ' + random(fillers[4]) + '. Most of all, though, I never want you to think, ' +
    ansLog[1][ansLog[1].length - 1][1] + '. Never again.'
}


function saveResults() {
  saved = true;
  let db = database.ref('responses');
  let screenCap = get(0, 0, width, height);
  let responseData = {
    poem: poem,
    answers: ansLog
  }
  db.push(responseData);

  let canvas = document.getElementById('defaultCanvas0');
  let screenShot = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
  let screenShotBlob = dataURLtoBlob(screenShot)
  let tokenRef = storage.ref('tokens/token.png');
  tokenRef.put(screenShotBlob);
}


function guid() {
  //https://slavik.meltser.info/the-efficient-way-to-create-guid-uuid-in-javascript-with-explanation/
  function _p8(s) {
    var p = (Math.random().toString(16) + "000000000").substr(2, 8);
    return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
  }
  return _p8() + _p8(true) + _p8(true) + _p8();
}

function initFirebase() {
  // Your web app's Firebase configuration
  let firebaseConfig = {
    apiKey: "AIzaSyAs_sYZoIfjPFpFUP8Z5z89LqDgFAfGvYU",
    authDomain: "tokens-of-devotion.firebaseapp.com",
    databaseURL: "https://tokens-of-devotion.firebaseio.com",
    projectId: "tokens-of-devotion",
    storageBucket: "tokens-of-devotion.appspot.com",
    messagingSenderId: "104095374730",
    appId: "1:104095374730:web:d3cafbe83093f870153c73",
    measurementId: "G-742JW5LVXC"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  firebase.analytics();
  database = firebase.database();
  storage = firebase.storage();
}


function dataURLtoBlob(dataURL) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURL.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  //Old Code
  //write the ArrayBuffer to a blob, and you're done
  //var bb = new BlobBuilder();
  //bb.append(ab);
  //return bb.getBlob(mimeString);

  //New Code
  return new Blob([ab], { type: mimeString });
}