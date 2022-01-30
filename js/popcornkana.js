import { hiragana, katakana } from './kana.js';
import { Window } from './queue.js';

export class PopcornKanaScene extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'PopcornKana' });

        this.popcorns;
        this.endline;

        this.pauseTime;
        this.wasPaused;
        this.afkTime = 0;
        this.totalAfkTime = 0;

        //Spawn

        this.spawnDelay = 4000;
        this.lastSpawnTime = -1;

        this.totalAttempts = 0;
        this.totalCorrect = 0;
        this.avgAnswerDelay = 0;
        this.lastAnswerTime = 0;
        this.answerWindow = new Window(5);
        this.increaseSpawnRate = function () { this.spawnDelay = Math.max(1000, Math.floor(this.spawnDelay * 0.8 + this.answerWindow.getAverage() * 0.1)); };
        this.decreaseSpawnRate = function () { this.spawnDelay = Math.min(4000, Math.floor(this.spawnDelay * 1.1)); };
        this.calcSpawnRate = function () { return Math.floor(100000/this.spawnDelay)/100; }
        this.spawnRateText;
        this.calcAccuracy = function () { return this.totalAttempts == 0 ? 0 : Math.floor(100*this.totalCorrect/this.totalAttempts); }
        this.accuracyText;

        //Stats
        this.startTime;
        this.getRelativeTimeSeconds = function () { return Math.round((this.time.now - this.startTime - this.totalAfkTime)/1000);};
        this.accuracyData = [{x: 0, y: 0}];
        this.answerRateData = [{x: 0, y: 0}];
        this.avgAnswerRateData = [{x: 0, y: 0}];

        this.STATUS_BAR_HEIGHT = 85;
        this.STATUS_BAR_CENTER = 43;

        this.lives = 3;
        this.hearts = [];

        this.timer = 0;

        this.width;
        this.height;

        this.kana;
    }

    init(data)
    {
        this.kana = [];
        if (data['katakana']) {
            this.kana.push(...katakana);
        }
        if (data['hiragana']) {
            this.kana.push(...hiragana);
        }
    }

    preload ()
    {
        this.load.spritesheet('popcorn', 'assets/popcorn-spritesheet.png', { frameWidth: 86, frameHeight: 67});
        this.load.bitmapFont('kana', 'assets/kana.png', 'assets/kana.xml');
        this.load.image('nice', 'assets/nice.png');
        this.load.image('sad', 'assets/sad.png');
        this.load.image('pause', 'assets/pause.png');
        this.load.image('heart', 'assets/heart.png');

        this.popcorns = this.physics.add.group();
        
        this.width = this.game.config.width;
        this.height = this.game.config.height;

        this.startTime = this.time.now;
    }

    create ()
    {
        this.createEatAnimation();

        this.createPauseButton();

        this.createBoundaryLine();
        
        this.createInputTextBox();

        this.createInfoBar();

        this.pauseSceneAndLaunch('Countdown');
    }

    update (time, delta)
    {
        if (this.wasPaused) {
            this.afkTime += time - this.pauseTime;
            this.totalAfkTime += time - this.pauseTime;
            this.wasPaused = false;
        }
        else if (this.lastSpawnTime == -1 || (time - this.lastSpawnTime - this.afkTime) > this.spawnDelay) {
            this.lastSpawnTime = time;
            this.afkTime = 0;
            this.createPopcorn();
        }
    }

    

    createEatAnimation() {
        this.anims.create({
            key: 'eat',
            frames: this.anims.generateFrameNumbers('popcorn', { start: 0, end: 5 }),
            frameRate: 15,
            repeat: 0
        });
    }

    createPauseButton() {
        let pauseButton = this.add.image(this.width-this.STATUS_BAR_CENTER, this.STATUS_BAR_CENTER, 'pause');
        pauseButton.setInteractive();
        
        pauseButton.on('pointerup', function () {
            this.pauseSceneAndLaunch('Pause');
        }, this);

        this.game.events.addListener(Phaser.Core.Events.BLUR, function () {
            this.pauseSceneAndLaunch('Pause');
        }, this);
    }

    pauseSceneAndLaunch(sceneKey) {
        this.wasPaused = true;
        this.pauseTime = this.time.now;
        this.scene.pause();
        this.scene.launch(sceneKey);
    }

    createBoundaryLine() {
        this.endline = this.add.line(this.width/2, this.height-80, 0, 0, this.width, 0, 0x000000);
        this.endline.setLineWidth(0.5);
        this.physics.add.existing(this.endline, true);
    }

    createBlinkingCursor(startX, startY) {
        var blinkingCursor = this.add.line(startX, startY, 0, 0, 0, 24, 0x000000);
        this.tweens.add({
            targets: blinkingCursor,
            alpha: {from: 0, to: 1},
            ease: 'Sine.InOut',
            duration: 450,
            repeat: -1,
            hold: 0,
            yoyo: true
        });
        return blinkingCursor;
    }

    correctAnswer(popcorn) {
        //do animation and clear
        popcorn.txt.destroy();
        popcorn.body.setVelocityY(0);
        popcorn.bg.anims.play('eat');
        this.popcorns.remove(popcorn, false, false);
        
        popcorn.bg.on('animationcomplete', function () {
            let x = popcorn.x;
            let y = popcorn.y;
            popcorn.destroy();
            //var nice = scene.add.sprite(x, y, 'nice');
            this.addNice(x, y);
        }, this);
        
        //process correct answers
        this.totalCorrect += 1;
        let answerDelay = Date.now() - this.lastAnswerTime;
        this.lastAnswerTime = Date.now();
        this.answerWindow.push(answerDelay);
        
        this.increaseSpawnRate();
        let spawnRate = this.calcSpawnRate();
        this.spawnRateText.setText('Spawn Rate: ' + spawnRate + '\uFF58');
        let accuracy = this.calcAccuracy();
        this.accuracyText.setText('Accuracy: ' + accuracy + '%');
        let relativeTime = this.getRelativeTimeSeconds();
        this.accuracyData.push({x: relativeTime, y: accuracy});
        let answerRate = Math.floor(100000/answerDelay)/100;
        this.answerRateData.push({x: relativeTime, y: answerRate});
        let avgAnswerRate = Math.floor(100000/this.answerWindow.getAverage())/100;
        this.avgAnswerRateData.push({x: relativeTime, y: avgAnswerRate});
    }

    configureTextInput(blinkingCursor, textInput, startX, startY) {
        let BACKSPACE = 8;
        let LOWERCASE_A = 48;
        let LOWERCASE_Z = 90;
        let ENTER = 13;
        let MAX_LENGTH = 4;
        this.input.keyboard.on('keydown', function (event) {

            if (event.keyCode === BACKSPACE && textInput.text.length > 0)
            {
                textInput.text = textInput.text.substring(0, textInput.text.length - 1);
                blinkingCursor.setPosition(startX + textInput.width/2, startY);
            }
            else if (textInput.text.length < MAX_LENGTH && (event.keyCode >= LOWERCASE_A && event.keyCode <= LOWERCASE_Z))
            {
                textInput.text += event.key;
                blinkingCursor.setPosition(startX + textInput.width/2, startY);
            }
            else if (event.keyCode == ENTER) //enter
            {
                let popcorn = this.popcorns.getFirst(true);
                
                let isCorrectAnswer = popcorn.data.values['answers'].includes(textInput.text);
                this.totalAttempts += 1;
                if (isCorrectAnswer) {
                    this.correctAnswer(popcorn);
                }

                // clear text
                textInput.text = '';
                blinkingCursor.setPosition(startX, startY);
            }
        }, this);
    }

    createInputTextBox() {
        let fontStyle = {
            font: '24px Arial', 
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        };
        let startX = this.width/2;
        let startY = this.height - 60;
        var textInput = this.add.text(startX, startY, '', fontStyle);
        textInput.setOrigin(0.5, 0.5);

        var blinkingCursor = this.createBlinkingCursor(startX, startY);
        this.configureTextInput(blinkingCursor, textInput, startX, startY);
    }

    createInfoBar() {
        let fontStyle = {
            font: '24px Arial', 
            color: '#E3FBFF',
        };
        let spawnRate = this.calcSpawnRate();
        this.spawnRateText = this.add.text(220, this.STATUS_BAR_CENTER/2, 'Spawn Rate: ' + spawnRate + '\uFF58', fontStyle);
        this.spawnRateText.setOrigin(0, 0.4);

        let accuracy = this.calcAccuracy();
        this.accuracyText = this.add.text(220, 3*this.STATUS_BAR_CENTER/2, 'Accuracy: ' + accuracy + '%', fontStyle);
        this.accuracyText.setOrigin(0, 0.6);

        this.timerText = this.add.text(220+this.spawnRateText.width+50, this.STATUS_BAR_CENTER/2, 'Time: 0:00', fontStyle);
        this.timerText.setOrigin(0, 0.4);
        // Each 1000 ms call upateTimer
        this.time.addEvent({ delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true });

        //Lives
        for (let i = 0; i < this.lives; i++) {
            this.hearts.push(new Phaser.GameObjects.Image(this, this.STATUS_BAR_CENTER + i*64, this.STATUS_BAR_CENTER, 'heart'));
            this.add.existing(this.hearts[i]);
        }
    }

    createPopcorn() {
        var POPCORN_WIDTH = 86;
        var POPCORN_HEIGHT = 67;
        var xPos = Math.floor(Math.random()*(this.width - POPCORN_WIDTH))+POPCORN_WIDTH/2;

        var popcornBG = this.add.sprite(0, 0, 'popcorn');
        popcornBG.setOrigin(0.5, 0.5);

        var randomKana = this.kana[Math.floor(Math.random()*this.kana.length)];
        var popcornText = this.add.bitmapText(0, 0, 'kana', randomKana.prompt);
        popcornText.setOrigin(0.5, 0.5);

        
        var popcorn = this.add.container(xPos, this.STATUS_BAR_HEIGHT + POPCORN_HEIGHT/2, [popcornBG, popcornText]);
        popcorn.bg = popcornBG;
        popcorn.txt = popcornText;

        popcorn.setData('prompt', randomKana.prompt);
        popcorn.setData('answers', randomKana.answers);
        
        popcorn.setSize(67, 67);
        this.popcorns.add(popcorn);

        popcorn.body.setVelocityY(90);
        this.physics.add.collider(popcorn, this.endline, this.missedAnswer, undefined, this);


        // for answer rate
        if (this.popcorns.getTotalUsed() == 1) {
            this.lastAnswerTime = Date.now();
        }

        return popcorn;
    }

    missedAnswer(popcorn) {
        popcorn.body.setVelocityY(0);
        popcorn.txt.setText(popcorn.data.values['answers'][0]);
        let x = popcorn.x;
        let y = popcorn.y;

        //getMatching() function is bugged... cause of "startIndex + endIndex > len"
        // if we specify startIndex 1, and length = 
        var allPopcorns = this.popcorns.getChildren();
        for (let i = allPopcorns.length-1; i > 0; i--) {
            this.popcorns.remove(allPopcorns[i], true, true);
        }

        this.time.delayedCall(500, function () {
            this.popcorns.remove(popcorn, true, true);
            this.addSad(x, y);
        }, undefined, this);
        
        this.totalAttempts += 1;
        this.lastAnswerTime = Date.now();
        this.decreaseSpawnRate();
        let spawnRate = this.calcSpawnRate();
        this.spawnRateText.setText('Spawn Rate: ' + spawnRate + '\uFF58');
        let accuracy = this.calcAccuracy();
        this.accuracyText.setText('Accuracy: ' + accuracy + '%');
        let relativeTime = this.getRelativeTimeSeconds();
        this.accuracyData.push({x: relativeTime, y: accuracy});

        if (this.lives > 0) {
            this.lives -= 1;
            this.hearts[this.lives].setVisible(false);
            if (this.lives == 0) {
                let stats = {
                    accuracy: this.accuracyData,
                    answerRate: this.answerRateData,
                    avgAnswerRate: this.avgAnswerRateData
                }
                this.scene.launch('Stats', stats);
                this.scene.remove();
            }
        }
    }

    addNice(x, y) {
        var nice = new Phaser.GameObjects.Sprite(this, x, y, 'nice');
        nice.setAlpha(0);
        this.tweens.add({
            targets: nice,
            alpha: {from: 0, to: 1},
            ease: 'Sine.InOut',
            duration: 500,
            repeat: 0,
            hold: 50,
            yoyo: true,
            onComplete: function () {
                nice.destroy();
            }
        });
        this.add.existing(nice);
    }

    addSad(x, y) {
        var sad = new Phaser.GameObjects.Sprite(this, x, y, 'sad');
        sad.setAlpha(0);
        this.tweens.add({
            targets: sad,
            alpha: {from: 0, to: 1},
            ease: 'Sine.InOut',
            duration: 500,
            repeat: 0,
            hold: 50,
            yoyo: true,
            onComplete: function () {
                sad.destroy();
            }
        });
        this.add.existing(sad);
    }

    updateTimer() {
        this.timer += 1;
        let minutes = Math.floor(this.timer/60);
        let seconds = this.timer % 60;
        let secondsStr = seconds > 9 ? seconds : '0'+seconds;
        let text = 'Time: ' + minutes + ':' + secondsStr;
        this.timerText.setText(text);
    }
}