import { hiragana, katakana } from './kana.js';
import { Window } from './queue.js';

export class PopcornKanaScene extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'PopcornKana' });

        this.popcorns;
        this.endline;

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
    }

    create ()
    {
        this.input.setDefaultCursor('url(assets/cursor.cur), pointer');
        this.anims.create({
            key: 'eat',
            frames: this.anims.generateFrameNumbers('popcorn', { start: 0, end: 5 }),
            frameRate: 15,
            repeat: 0
        });

        let pauseButton = this.add.image(this.width-this.STATUS_BAR_CENTER, this.STATUS_BAR_CENTER, 'pause');
        pauseButton.setInteractive();
        
        pauseButton.on('pointerup', function () {
            this.scene.pause();
            this.scene.launch('Pause');
        }, this);

        this.game.events.addListener(Phaser.Core.Events.BLUR, function () {
            this.scene.pause();
            this.scene.launch('Pause');
        }, this);
        
        this.endline = this.add.line(this.width/2, this.height-80, 0, 0, this.width, 0, 0x000000);
        this.endline.setLineWidth(0.5);
        this.physics.add.existing(this.endline, true);

        //Input Text
        this.createTextBox();

        
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
        // Each 1000 ms call onEvent
        this.time.addEvent({ delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true });

        //Lives
        for (let i = 0; i < this.lives; i++) {
            this.hearts.push(new Phaser.GameObjects.Image(this, this.STATUS_BAR_CENTER + i*64, this.STATUS_BAR_CENTER, 'heart'));
            this.add.existing(this.hearts[i]);
        }

        //Game Loop
        
        this.game.events.on('step', function(time, delta) {
            if (this.sys.isPaused()) {
                this.lastSpawnTime += delta;
            }
            else {
                if (this.lastSpawnTime == -1 || (time - this.lastSpawnTime) > this.spawnDelay) {
                    this.lastSpawnTime = time;
                    this.createPopcorn();
                }
            }
        }, this);

        this.scene.pause();
        this.scene.launch('Countdown');

    }

    update ()
    {
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
        this.physics.add.collider(popcorn, this.endline, this.missedAnswer);


        // for answer rate
        if (this.popcorns.getTotalUsed() == 1) {
            this.lastAnswerTime = Date.now();
        }

        return popcorn;
    }

    createTextBox() {
        let maxLength = 4;
        let fontStyle = {
            font: '24px Arial', 
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        };
        var textInput = this.add.text(this.width/2, this.height-60, '', fontStyle);
        textInput.setOrigin(0.5, 0.5);

        var blinkingCursor = this.add.line(this.width/2, this.height-60, 0, 0, 0, 24, 0x000000);
        this.tweens.add({
            targets: blinkingCursor,
            alpha: {from: 0, to: 1},
            ease: 'Sine.InOut',
            duration: 450,
            repeat: -1,
            hold: 0,
            yoyo: true
        });
        
        let scene = this;
        this.input.keyboard.on('keydown', function (event) {

            if (event.keyCode === 8 && textInput.text.length > 0) //backspace
            {
                textInput.text = textInput.text.substring(0, textInput.text.length - 1);
                blinkingCursor.setPosition(textInput.width/2 + scene.width/2, scene.height-60);
            }
            else if (textInput.text.length < maxLength && (event.keyCode >= 48 && event.keyCode <= 90)) //text
            {
                textInput.text += event.key;
                blinkingCursor.setPosition(textInput.width/2 + scene.width/2, scene.height-60);
            }
            else if (event.keyCode == 13) //enter
            {
                let popcorn = scene.popcorns.getFirst(true);
                
                let correctAnswer = popcorn.data.values['answers'].includes(textInput.text);
                scene.totalAttempts += 1;
                if (correctAnswer) {
                    //do animation and clear
                    popcorn.txt.destroy();
                    popcorn.body.setVelocityY(0);
                    popcorn.bg.anims.play('eat');
                    popcorn.bg.on('animationcomplete', function () {
                        let x = popcorn.x;
                        let y = popcorn.y;
                        scene.popcorns.remove(popcorn, true, true);
                        //var nice = scene.add.sprite(x, y, 'nice');
                        scene.addNice(x, y);
                    });
                    
                    //process correct answers
                    scene.totalCorrect += 1;
                    let answerDelay = Date.now() - scene.lastAnswerTime;
                    scene.lastAnswerTime = Date.now();
                    scene.answerWindow.push(answerDelay);
                    
                    scene.increaseSpawnRate();
                    let spawnRate = scene.calcSpawnRate();
                    scene.spawnRateText.setText('Spawn Rate: ' + spawnRate + '\uFF58');
                    let accuracy = scene.calcAccuracy();
                    scene.accuracyText.setText('Accuracy: ' + accuracy + '%');
                }

                textInput.text = '';
                blinkingCursor.setPosition(scene.width/2, scene.height-60);
            }

        });
    }

    missedAnswer(popcorn) {
        popcorn.body.setVelocityY(0);
        popcorn.txt.setText(popcorn.data.values['answers'][0]);
        let scene = popcorn.scene;
        let x = popcorn.x;
        let y = popcorn.y;

        //getMatching() function is bugged... cause of "startIndex + endIndex > len"
        // if we specify startIndex 1, and length = 
        var allPopcorns = scene.popcorns.getChildren();
        for (let i = allPopcorns.length-1; i > 0; i--) {
            scene.popcorns.killAndHide(allPopcorns[i]);
            allPopcorns[i].destroy();
        }

        scene.time.delayedCall(350, function () {
            scene.popcorns.killAndHide(popcorn);
            popcorn.destroy();
            scene.addSad(x, y);
        });
        
        scene.lastAnswerTime = Date.now();
        scene.decreaseSpawnRate();
        let spawnRate = scene.calcSpawnRate();
        scene.spawnRateText.setText('Spawn Rate: ' + spawnRate + '\uFF58');

        if (scene.lives > 0) {
            scene.lives -= 1;
            scene.hearts[scene.lives].setVisible(false);
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


export class PauseScene extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'Pause' });
        this.width;
        this.height;
    }

    preload ()
    {
        this.width = this.game.config.width;
        this.height = this.game.config.height;
    }

    create ()
    {
        let fontStyle = {
            font: '24px Arial', 
            color: '#FFFFFF',
        };
        let clickToContinue = this.add.text(this.width/2, this.height/2, 'Click to continue', fontStyle).setAlpha(0.75);
        clickToContinue.setOrigin(0.5, 0.5);

        this.input.on('pointerup', function () {
            clickToContinue.destroy();
            this.scene.resume('PopcornKana');

        }, this);
    }
}

export class CountdownScene extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'Countdown' });
        this.countdownNum = 5;
        this.width;
        this.height;
    }

    preload ()
    {
        this.width = this.game.config.width;
        this.height = this.game.config.height;
    }

    create ()
    {
        let fontStyle = {
            font: '24px Arial', 
            color: '#FFFFFF',
        };
        this.countdownText = this.add.text(this.width/2, this.height/2, ''+this.countdownNum, fontStyle).setAlpha(0.8);
        this.time.addEvent({ delay: 1000, callback: this.countdown, callbackScope: this, repeat: this.countdownNum-1 });
    }

    countdown() {
        this.countdownNum -= 1;
        this.countdownText.setText(''+this.countdownNum);
        if (this.countdownNum == 0) {
            this.time.delayedCall(500, function () {
                this.countdownText.destroy();
                this.scene.resume('PopcornKana');
            }, [], this);
        }
    }
}