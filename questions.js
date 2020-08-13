let allQuestions = [];
let currCat = 0;
let currQ;
let newQset;
let buttons, skip, input, submit;
let boxWidth, boxHeight;


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
    if (width > 400) {
      boxWidth = width / 2;
    } else {
      boxWidth = width * 0.9;
    }
    let textRows = ceil(textWidth(this.statement) / boxWidth);
    boxHeight = textRows * tsize;

    textLeading(25);
    text(this.statement, width * 0.95 - boxWidth, 200, boxWidth, boxHeight * 1.1);
  }

  displayA() {
    rectMode(CORNER);
    if (currQ != allQuestions[0][0]) {
      var skip = createButton('can you ask me something else?');
    }

    if (width > 400) {
      boxWidth = width / 2;
    } else {
      boxWidth = width * 0.9;
    }
    let textRows = ceil(textWidth(this.statement) / boxWidth);
    boxHeight = textRows * tsize;

    if (this.type == 'mc') {
      textSize(tsize);
      textAlign(RIGHT);

      let buttons = [];
      for (let i = 0; i < this.ansQty; i++) {
        let button = createButton(this.ans[i]);
        append(buttons, button);
      }

      buttons[0].position(width * 0.95 - buttons[0].width, 230 + boxHeight);
      for (let i = 1; i < this.ansQty; i++) {
        buttons[i].position(width * 0.95 - buttons[i].width, buttons[i - 1].position().y + buttons[i - 1].height);
      }

      if (currQ != allQuestions[0][0]) {
        skip.position(width * 0.95 - skip.width, 0.8 * height);
        return [buttons, skip];
      } else {
        return buttons;
      }

    } else if (this.type == 'sa') {
      let input = createElement('textarea');
      input.attribute('placeholder', 'tell me');
      input.attribute('rows', 3);
      input.attribute('autofocus', true);
      input.size(width * 0.75);
      input.position(width * 0.95 - input.width, 230 + boxHeight);
      let submit = createButton('does that work for you?');
      submit.position(width * 0.95 - submit.width, input.position().y + input.height + 2 * tsize);
      skip.position(width * 0.95 - skip.width, 0.8 * height);
      return [input, submit, skip];
    }
  }
}


function loadQuestions(allQs) {
  let numQ = allQs.getRowCount();
  let numCats = max(allQs.getColumn('Sequence')) + 1;

  // create a blank array entry for each question category (sequence) 
  for (let i = 0; i < numCats; i++) {
    allQuestions[i] = [];
  }

  for (let i = 0; i < numQ; i++) {
    // if Q is mc, fetch answers, else leave answers as an empty array
    let answers = [];
    if (allQs.get(i, 1) == 'mc') {
      let j = 3;
      // if cell (i, j) has text, it will return true, if not it'll return false
      while (allQs.get(i, j)) {
        answers.push(allQs.get(i, j));
        j++;
      }
    }

    // create question from table information and fetched answers
    let question = new Question(allQs.get(i, 1), i, allQs.get(i, 2), answers);

    // push question to appropriate question category
    allQuestions[Number(allQs.get(i, 0))].push(question);
  }
}


async function nextQ(ans) {
  // log answer
  if (currQ.type == 'mc') {
    ansLog[0].push([currQ, ans, currQ.ans.indexOf(ans)]);
  } else {
    ansLog[1].push([currQ, ans]);
  }

  clearAs();

  if ([0, 3, 6, 9, 10].includes(currCat)) {
    interstitialPage();
    await promise;
  }

  currCat += 1;

  // if quiz complete, generate token
  if (currCat == allQuestions.length) {
    getToken();
    return;
  }

  // fetch new question and update display
  currQ = random(allQuestions[currCat]);
  skipped = 0;
  refresh();
}

// function typeWriter(sentence, n, x, y, w, h, speed) {
//   if (n < (sentence.length)) {
//     noLoop();
//     showBkg();
//     twStarted = true;
//     text(sentence.substring(0, n + 1), x, y, w, h);
//     n++;
//     setTimeout(function() {
//       typeWriter(sentence, n, x, y, w, h, speed)
//     }, speed);
//   } else {
//     loop();
//     twDone = true;
//   }
// }


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
  if (currQ.type == 'mc') {
    if (currQ != allQuestions[0][0]) {
      [buttons, skip] = currQ.displayA();
    } else {
      buttons = currQ.displayA();
    }
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
  if (currQ != allQuestions[0][0]) {
    skip.mousePressed(diffQ);
  }
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
  if (currQ != allQuestions[0][0]) {
    skip.remove();
  }
}