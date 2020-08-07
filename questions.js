let tsize = 20;

class Question {
  constructor(tempType, tempID, tempStatement, tempAns = []) {
    this.type = tempType;
    this.id = tempID;
    this.statement = tempStatement;
    this.ans = tempAns;
    this.ansQty = this.ans.length;
  }

  displayQ() {
    textSize(tsize);
    rectMode(CORNER);
    textAlign(RIGHT);
    let boxWidth = width * 0.8;
    let textRows = ceil(textWidth(this.statement) / boxWidth);
    let boxHeight = textRows * tsize * 1.25;
    if (!twStarted) {
      typeWriter(this.statement, 0, width * 0.95 - boxWidth, 150, boxWidth, boxHeight, 150);
    } else {
      text(this.statement, width * 0.95 - boxWidth, 150, boxWidth, boxHeight);
    }
  }

  displayA() {
    rectMode(CORNER);
    let skip = createButton('can you ask me something else?');
    let boxWidth = width * 0.8;
    let textRows = ceil(textWidth(this.statement) / boxWidth);
    let boxHeight = textRows * tsize * 1.25;

    if (this.type == 'mc') {
      textSize(tsize);
      textAlign(RIGHT);
      let buttons = [];
      let i;
      for (i = 0; i < this.ansQty; i++) {
        let button = createButton(this.ans[i]);
        button.position(width * 0.95 - button.width, 250 + 1.6 * i * tsize);
        append(buttons, button);
      }
      skip.position(width * 0.95 - skip.width, 250 + 1.6 * i * tsize);
      skip.style('font-size', tsize + 'px');

      return [buttons, skip];

    } else if (this.type == 'sa') {
      let input = createElement('textarea');
      input.attribute('placeholder', 'tell me');
      input.attribute('rows', 3);
      input.attribute('autofocus', true);
      input.size(width * 0.75);
      input.position(width * 0.95 - input.width, 250 + 1.6 * tsize);
      let submit = createButton('submit');
      // update below to set y pos with input.position().y and submit.position().y
      submit.position(width * 0.95 - submit.width, 250 + input.height + 2 * 1.6 * tsize);
      skip.position(width * 0.95 - skip.width, 250 + input.height + submit.height + 3 * 1.6 * tsize);
      return [input, submit, skip];
    } else {
      console.log('invalid question type');
    }
  }
}


function loadQuestions(allQs) {
  let numQ = allQs.getRowCount();
  let numCats = 9;

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

function typeWriter(sentence, n, x, y, w, h, speed) {
  if (n < (sentence.length)) {
    noLoop();
    showBkg();
    twStarted = true;
    text(sentence.substring(0, n + 1), x, y, w, h);
    n++;
    setTimeout(function() {
      typeWriter(sentence, n, x, y, w, h, speed)
    }, speed);
  } else {
    loop();
    twDone = true;
  }
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