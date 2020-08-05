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

function preload() {
  bkg = loadImage('images/Bkg_Flat1080p.png');
  font = loadFont('fonts/Barlow/Barlow-Regular.ttf');
  tokenObjs = [loadModel('tokens/Capsule.obj', true),
    loadModel('tokens/Love.obj', true),
    loadModel('tokens/Devotion.obj', true),
    loadModel('tokens/Care.obj', true)
  ];
  loadTable('TAP_Questions.csv', 'csv', 'header', loadQuestions);
  results = loadTable('participant_results.csv', 'csv', 'header');
}

function setup() {
  currQ = allQuestions[0][0];
  createCanvas(windowWidth, windowHeight);
  textFont(font);
  frameRate(30);
  refresh();
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
  }
}


function nextQ(ans) {
  // log answer
  if (currQ.type == 'mc') {
    ansLog[0].push([currQ.id, ans, currQ.ans.indexOf(ans)]);
  } else {
    ansLog[1].push([currQ.id, ans])
  }

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
  if (newQset.length == 0) {
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
  poem = 'When we ' + 'fill' + ' for the last time, I thought about how when the universe ' + 'fill' + ' the final thread into this ' + 'fill' + ', it shook and shook and shook and then somewhere along the lines, my grand plan of ' + 'fill' + ' failed but in it we ' + 'fill' + '. Most of all, though, I never want you to think: \"' + 'fill' + '\" Never again.';

  // set state to completed quiz
  finished = true;

  saveResults();
}

function saveResults() {
  // let newRow = results.addRow();
// newRow.setString('date', String(year()) + '-' + String(month()) + '-' + String(day()));
// newRow.setString('id', guid());
// newRow.setString('poem', poem);
// saveTable()
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
  let displayRatio = width / height;
  let imgRatio = bkg.width / bkg.height;
  if (displayRatio >= 6125 / 4419) {
    image(bkg, 0, height / 2 - width / (imgRatio * 2), width, width / imgRatio);
  } else {
    image(bkg, width / 2 - height * imgRatio / 2, 0, height * imgRatio, height);
  }
}

function guid() {
  //https://slavik.meltser.info/the-efficient-way-to-create-guid-uuid-in-javascript-with-explanation/
  function _p8(s) {
    var p = (Math.random().toString(16) + "000000000").substr(2, 8);
    return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
  }
  return _p8() + _p8(true) + _p8(true) + _p8();
}