let currCat = 0;
let allQuestions = [];
let currQ;
let ansLog = {};
let buttons, skip, input, submit;
let finished = false;
let poem;
let tokenObjs;
let font;
let tokenGraphic;
let camAngle = 0;
let skipped = 0;
let newQset;
let twStarted = false;
let twDone = false;
let mountains;
let ratios = [];

function preload() {
  font = loadFont('fonts/Barlow/Barlow-Regular.ttf');
  tokenObjs = [loadModel('tokens/Care.obj', true),
    loadModel('tokens/Love.obj', true),
    loadModel('tokens/Devotion.obj', true)
  ];
  loadTable('TAP_Questions.csv', 'csv', 'header', loadQuestions);
  mountains = [loadImage('images/Mtn0.png'),
    loadImage('images/Mtn1.png'),
    loadImage('images/Mtn2.png'),
    loadImage('images/Mtn3.png'),
    loadImage('images/Mtn4.png'),
    loadImage('images/Mtn5.png'),
    loadImage('images/Mtn6.png')
  ];
}

function setup() {
  currQ = allQuestions[0][0];
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < mountains.length; i++) {
    ratios[i] = mountains[i].width / mountains[i].height;
  }

  textFont(font);
  refresh();
  frameRate(30);
}


function draw() {
  createCanvas(windowWidth, windowHeight);
  showBkg();
  fill('#FFFCDC');

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
    camAngle += 0.05;
    let z = cos(camAngle) * 250;
    let x = sin(camAngle) * 250;
    tokenGraphic.clear();
    tokenGraphic.camera(x, 0, z, 0, 0, 0, 0, 1, 0);
    tokenGraphic.model(tokenObjs[2]);
    image(tokenGraphic, 0, 0, width, height);

    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    text(poem, width / 2, height / 2, width * 0.7, height);
  }
}


function nextQ(ans) {
  // log answer
  ansLog[currCat] = [currQ.id, ans];
  console.log(ansLog);

  // increment to next Q Category
  currCat += 1;

  // remove inputs from canvas
  clearAs();

  // if quiz complete, generate token
  if (currCat == allQuestions.length) {
    getToken();
    return false;
  }

  // fetch new question and update display
  currQ = random(allQuestions[currCat]);
  skipped = 0;
  refresh();
}


function diffQ() {
  if (skipped == 0) {
    newQset = [...allQuestions[currCat]];
  }
  skipped++;
  clearAs();
  let index = newQset.indexOf(currQ);
  newQset.splice(index, 1);
  console.log(skipped);
  console.log(newQset);
  console.log(allQuestions[currCat]);
  if (newQset.length == 0) {
    console.log('no other questions available');
    skipped = 0;
    newQset = [...allQuestions[currCat]];
  }
  currQ = random(newQset);
  refresh();
}


function clearAs() {
  if (currQ.type == 'mc') {
    for (let a = 0; a < currQ.ansQty; a++) {
      buttons[a].remove();
    }
  } else if (currQ.type == 'sa') {
    input.remove();
    submit.remove();
  }
  skip.remove();
}


function refresh() {
  twStarted = false;
  twDone = false;
  if (currQ.type == 'mc') {
    [buttons, skip] = currQ.displayA();
    for (let i = 0; i < currQ.ansQty; i++) {
      buttons[i].mousePressed(function() {
        nextQ(currQ.ans[i])
      });
    }
  } else if (currQ.type == 'sa') {
    [input, submit, skip] = currQ.displayA();
    submit.mousePressed(function() {
      nextQ(input.value())
    });
  }
  skip.mousePressed(diffQ);
}


function getToken() {

  // generate graphic for token
  tokenGraphic = createGraphics(width, height, WEBGL);
  tokenGraphic.noStroke();
  // tokenGraphic.shininess(20);
  // tokenGraphic.specularMaterial(200);
  tokenGraphic.ambientLight(100);
  // tokenGraphic.specularColor(240, 0, 120);
  tokenGraphic.pointLight(240, 0, 120, 100, -100, -100);
  tokenGraphic.pointLight(240, 0, 120, -100, 100, 100);

  tokenGraphic.pointLight(0, 240, 240, -100, 100, -100);
  tokenGraphic.pointLight(0, 240, 240, 100, -100, 100);

  tokenGraphic.pointLight(240, 180, 0, -100, -100, 100);
  tokenGraphic.pointLight(240, 180, 0, 100, 100, -100);

  // fill in poem for token
  poem = 'When we ' + ansLog[0][1] + ' for the last time, I thought about how when the universe ' + ansLog[1][1] + ' the final thread into this ' + ansLog[1][1] + ', it shook and shook and shook and then somewhere along the lines, my grand plan of ' + ansLog[2][1] + ' failed but in it we ' + ansLog[2][1] + '. Most of all, though, I never want you to think: \"' + ansLog[3][1] + '\" Never again.';

  // set state to completed quiz
  finished = true;
}

function loadQuestions(allQs) {
  const numQ = allQs.getRowCount();
  const numCats = 9;

  // create a blank array entry for each question category (sequence) 
  for (let i = 0; i < numCats; i++) {
    allQuestions[i] = [];
  }

  for (let i = 0; i < numQ; i++) {
    // if Q is mc, fetch answers, else leave answers as an empty array
    let answers = [];
    if (allQs.get(i, 2) == 'mc') {
      let j = 4;
      // if cell (i, j) has text, it will return true, if not it'll return false
      while (allQs.get(i, j)) {
        answers.push(allQs.get(i, j));
        j++;
      }
    }

    // create question from table information and fetched answers
    let question = new Question(allQs.get(i, 2), i, allQs.get(i, 3), answers);

    // push question to appropriate question category
    allQuestions[Number(allQs.get(i, 0))].push(question);
  }
}

function showBkg() {
  background('#180A05');

  image(mountains[3], 0, 0, width, width / ratios[3]);
  image(mountains[1], width * 0.25, 0, width * 0.5, width * 0.5 / ratios[1]);
  image(mountains[2], width * 0.6, 0, width * 0.4, width * 0.4 / ratios[2]);
}