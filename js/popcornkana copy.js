import { kana } from './kana.js';
import { Window } from './queue.js';

export class PopcornKanaScene extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'PopcornKana' });

        this.popcorns;
        this.endline;

        this.spawnDelay = 4000;
        this.lastSpawn = -1;

        this.avgAnswerDelayText;
        this.totalCorrect = 0;
        this.tempCorrect = 0;
        this.avgAnswerDelay = 0;
        this.lastAnswerTime = 0;
        this.answerWindow = new Window(5);
        this.hasSpawnDelayUpdated = false;
        this.spawnRateFormula = function (averageAnswerDelay, currentSpawnDelay) { return currentSpawnDelay * 0.8 + averageAnswerDelay * 0.1; };


        this.width;
        this.height;
    }

    preload ()
    {
        //this.load.image('popcorn', 'assets/popcorn.png');
        this.load.spritesheet('popcorn', '../assets/popcorn-spritesheet.png', { frameWidth: 86, frameHeight: 67});
        this.load.bitmapFont('kana', 'assets/kana.png', 'assets/kana.xml');
        this.load.image('nice', 'assets/nice.png');
        this.load.image('sad', 'assets/sad.png');

        this.popcorns = this.physics.add.group();
        //this.physics.world.setBoundsCollision();
        //this.physics.world.on('worldbounds', this.missedAnswer);
        this.width = this.game.config.width;
        this.height = this.game.config.height;
    }

    create ()
    {
        this.anims.create({
            key: 'eat',
            frames: this.anims.generateFrameNumbers('popcorn', { start: 0, end: 5 }),
            frameRate: 15,
            repeat: 0
        });
        
        this.endline = this.add.line(this.width/2, this.height-80, 0, 0, this.width, 0, 0x000000);
        this.endline.setLineWidth(0.5);
        this.physics.add.existing(this.endline, true);

        //Objects
        //this.createPopcorn();

        //Input Text
        this.createTextBox();

        
        let fontStyle = {
            font: '24px Arial', 
            color: '#000000',
        };
        this.avgAnswerDelayText = this.add.text(this.width-300, 10, 'Answer Delay: '+this.avgAnswerDelay, fontStyle);
        this.spawnDelayText = this.add.text(this.width-600, 10, 'Spawn Delay: '+this.spawnDelay, fontStyle);

        //Game Loop
        
        this.game.events.on('step', function(time, delta) {
            if (this.lastSpawn == -1 || (time - this.lastSpawn) > this.spawnDelay) {
                this.lastSpawn = time;
                this.createPopcorn();
            }
        }, this);

    }

    update ()
    {
    }

    createPopcorn() {
        var POPCORN_WIDTH = 87;
        var xPos = Math.floor(Math.random()*(this.width - POPCORN_WIDTH))+POPCORN_WIDTH/2;

        var popcornBG = this.add.sprite(0, 0, 'popcorn');
        popcornBG.setOrigin(0.5, 0.5);

        var randomKana = kana[Math.floor(Math.random()*kana.length)];
        var popcornText = this.add.bitmapText(0, 0, 'kana', randomKana.prompt);
        popcornText.setOrigin(0.5, 0.5);

        
        var popcorn = this.add.container(xPos, 0, [popcornBG, popcornText]);
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
            this.tempCorrect = 0;
            this.lastAnswerDelay = 0;
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
        let scene = this;
        this.input.keyboard.on('keydown', function (event) {

            if (event.keyCode === 8 && textInput.text.length > 0) //backspace
            {
                textInput.text = textInput.text.substring(0, textInput.text.length - 1);
            }
            else if (textInput.text.length < maxLength && (event.keyCode >= 48 && event.keyCode <= 90)) //text
            {
                textInput.text += event.key;
            }
            else if (event.keyCode == 13) //enter
            {
                console.log(textInput.text);
                let popcorn = scene.popcorns.getFirst(true);
                console.log(popcorn.data.values['answers']);
                
                let correctAnswer = popcorn.data.values['answers'].includes(textInput.text);
                if (correctAnswer) {
                    //do animation and clear
                    popcorn.txt.destroy();
                    popcorn.body.setVelocityY(0);
                    popcorn.bg.anims.play('eat');
                    popcorn.bg.on('animationcomplete', function () {
                        let x = popcorn.x;
                        let y = popcorn.y;
                        console.log(x + " " + y);
                        console.log(popcorn);
                        scene.popcorns.remove(popcorn, true, true);
                        //var nice = scene.add.sprite(x, y, 'nice');
                        scene.addNice(x, y);
                    });
                    
                    //process correct answers
                    scene.totalCorrect += 1;
                    scene.tempCorrect += 1;
                    // (Time_Took_Answer_All_But_Recent + Time_Took_Answer_Recent)/Total_Correct
                    scene.avgAnswerDelay = (scene.avgAnswerDelay*(scene.totalCorrect-scene.tempCorrect)+(Date.now() - scene.lastAnswerTime))/scene.totalCorrect;
                    console.log(scene.avgAnswerDelay);
                    scene.lastAnswerDelay = Date.now() - scene.lastAnswerTime;
                    scene.lastAnswerTime = Date.now();
                    console.log(scene.lastAnswerDelay);
                    scene.answerWindow.push(scene.lastAnswerDelay);
                    scene.avgAnswerDelayText.setText('Answer Delay: '+scene.lastAnswerDelay);
                    
                    let averageAnswerDelay = scene.answerWindow.getAverage();
                    scene.spawnDelay = Math.floor(scene.spawnRateFormula(averageAnswerDelay, scene.spawnDelay));
                    scene.spawnDelayText.setText('Spawn Delay: '+scene.spawnDelay);
                }

                textInput.text = '';
            }

        });
    }

    missedAnswer(popcorn) {
        console.log("Missed");
        console.log(popcorn.data.values['answers']);
        popcorn.body.setVelocityY(0);
        popcorn.txt.setText(popcorn.data.values['answers'][0]);
        let scene = popcorn.scene;
        let x = popcorn.x;
        let y = popcorn.y;

        scene.time.delayedCall(350, function () {
            scene.popcorns.killAndHide(popcorn);
            popcorn.destroy();
            scene.addSad(x, y);
        });
        
        scene.lastAnswerTime = Date.now();
        scene.tempCorrect = 0;
        scene.lastAnswerDelay = 0;
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

}