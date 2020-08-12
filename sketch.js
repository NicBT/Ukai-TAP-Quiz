// TO DO
// make questions fade in
// make answers fade in after question finishes fading in




let ansLog = [
  [],
  []
];
let finished = false;
let tsize = 20;
let poem;
let bkg, font, audio, tokenObjs, poemFiller;
let increment, scl, objRelScl;
let tokenGraphic, c0, c1, c2, c3, c4;
let capAngle = 0;
let skipped = 0;
let twStarted = false;
let twDone = false;
let quizStarted = false;
let database, storage;
let saved = false;
let saveButton;


function preload() {
  bkg = loadImage('assets/Bkg_Flat1080p.png');
  font = loadFont('fonts/Barlow/Barlow-Regular.ttf');
  audio = loadSound('assets/TAP_audio.wav');
  tokenObjs = [loadModel('assets/Capsule.obj', true),
    loadModel('assets/Love.obj', true),
    loadModel('assets/Devotion.obj', true),
    loadModel('assets/Care.obj', true)
  ];
  poemFiller = loadTable('TAP_Poem_Filler.csv', 'csv');
  loadTable('TAP_Questions.csv', 'csv', 'header', loadQuestions);
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
  if (quizStarted) {
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
      text(poem, width / 2, height / 2 + tokenGraphic.height * scl / 2, width * 0.7, height);

      capAngle += increment;
      let objAngle = capAngle * 1.33;
      let capZ = cos(capAngle) * 250;
      let capX = sin(capAngle) * 250;
      let objZ = cos(objAngle) * 250;
      let objX = -sin(objAngle) * 250;

      tokenGraphic.clear();
      push();
      translate(width / 2 - tokenGraphic.width * scl / 2, height / 2 - textHeight / 2 - tokenGraphic.height * scl / 2);
      scale(scl);

      tokenGraphic.pointLight(c0, 866, 500, 0);
      tokenGraphic.pointLight(c1, -866, 500, 0);
      tokenGraphic.pointLight(c2, 0, -1000, 0);
      tokenGraphic.pointLight(c3, 0, 0, 1000);
      tokenGraphic.pointLight(c4, 0, 0, -1000);

      tokenGraphic.camera(capX, 0, capZ, 0, 0, 0, 0, 1, 0);
      tokenGraphic.model(tokenObjs[0]);

      tokenGraphic.camera(objX, 0, objZ, 0, 0, 0, 0, 1, 0);
      tokenGraphic.scale(objRelScl);
      tokenGraphic.model(tokenObjs[ansLog[0][0][2] + 1]);

      image(tokenGraphic, 0, 0, tokenGraphic.width, tokenGraphic.height);
      pop();
      if (!saved) {
        saveButton.position(width / 2 - saveButton.width / 2, height / 2 + tokenGraphic.height * scl / 2 + textHeight);
      } else {
        text('Thank you', width / 2, height / 2 + tokenGraphic.height * scl / 2 + textHeight);
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
  quizStarted = true;
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
    ['#747060', '#677D6B', '#4B5229', '#B78B80', '#B3A694'],
    ['#664564', '#8B8EB3', '#CADB4F', '#7D645D', '#FFC8C7'],
    ['#B39594', '#F4AF9F', '#88ACBF', '#CBB3E5', '#E2C7FF'],
    ['#254C31', '#E8ED45', '#7695A6', '#9E88BF', '#B0F73B'],
    ['#D9D559', '#E0C036', '#B3E5C3', '#2125AD', '#C2C73A']
  ]
  c0 = color(colours[0][ansLog[0][0][2]]);
  c1 = color(colours[1][ansLog[0][0][2]]);
  c2 = color(colours[2][ansLog[0][0][2]]);
  c3 = color(colours[3][ansLog[0][0][2]]);
  c4 = color(colours[4][ansLog[0][0][2]]);

  tokenGraphic = createGraphics(2 * width, height, WEBGL);
  tokenGraphic.noStroke();

  // fill in poem for token
  poem = getPoem();

  // set state to completed quiz
  finished = true;

  saveButton = createButton('Allow TAP to save my token and poem');
  saveButton.mousePressed(saveResults);
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
  saveButton.remove();

  let db = database.ref();
  let screenCap = get(0, 0, width, height);
  let responseData = {
    poem: poem,
    answers: ansLog
  }
  // pushes responseData to the database and stores that new reference in key. Then use getKey() to get the key (id tag) of key (new reference)
  let key = db.push(responseData);
  key = key.getKey();

  let canvas = document.getElementById('defaultCanvas0');
  let screenShot = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
  let screenShotBlob = dataURLtoBlob(screenShot)
  let tokenRef = storage.ref('tokens/' + key + '.png');
  tokenRef.put(screenShotBlob);
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

  //New Code
  return new Blob([ab], { type: mimeString });
}