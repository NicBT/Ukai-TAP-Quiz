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
            typeWriter(this.statement, 0, width * 0.95 - boxWidth, 150, boxWidth, boxHeight, 100);
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
            input.attribute('rows', 1);
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