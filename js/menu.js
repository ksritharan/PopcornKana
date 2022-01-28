export class PopcornMenuScene extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'Menu' });

        this.hiragana = true;
        this.katakana = true;
    }

    preload ()
    {
        //this.load.image('popcorn', 'assets/popcorn.png');
        this.load.spritesheet('popcorn', '../assets/popcorn-spritesheet.png', { frameWidth: 86, frameHeight: 67});
        this.load.bitmapFont('kana', 'assets/kana.png', 'assets/kana.xml');
        this.load.image('title', 'assets/title.png');
        this.load.image('play', 'assets/play.png');
        this.load.image('sadmsg', 'assets/sadmsg.png');
        
        this.width = this.game.config.width;
        this.height = this.game.config.height;
    }

    create ()
    {
        this.input.setDefaultCursor('url(assets/cursor.cur), pointer');
        this.add.image(this.width/2, 54, 'title');
        
        var playButton = this.add.image(this.width/2, 300, 'play');
        playButton.setInteractive();
        playButton.on('pointerup', function () {
            if (this.hiragana || this.katakana) {
                this.scene.launch('PopcornKana', {'hiragana': this.hiragana, 'katakana': this.katakana});
                this.scene.remove();
            }
            else {
                this.addSadMessage(this.width/2, 200);
            }
        }, this);        
        
        this.createCheckBox(this.width/2 - 55, 340, 'HIRAGANA', this.hiragana, 20, function(checkBox, scene) { scene.hiragana = checkBox.checked; });
        this.createCheckBox(this.width/2 - 55, 365, 'KATAKANA', this.katakana, 20, function(checkBox, scene) { scene.katakana = checkBox.checked; });
    }

    createCheckBox(x, y, text, checked=true, size=30, toggleCallback=()=>{})
    {
        let textOffset = 4;

        var checkBoxText = this.add.text(x + size/2 + textOffset, y, text, {font: size+'px Arial', color: '#E3FBFF', strokeThickness: 3, stroke: '#91CED8'})
        checkBoxText.setOrigin(0, 0.5);
        console.log(checkBoxText);

        var checkBox = this.add.rectangle(x, y, size, size, 0xE3FBFF);
        checkBox.setStrokeStyle(1, 0x91CED8);
        checkBox.setInteractive();
        checkBox.checked = checked;

        var checkMark = this.add.text(x, y, 'X', {font: size+'px Arial', color: '#91CED8'});
        checkMark.setOrigin(0.5, 0.5);
        checkMark.setVisible(checked);
        console.log(checkBox.checked);
        checkBox.checkMark = checkMark;
        let scene = this;
        checkBox.on('pointerup', function()
        {
            this.checked = !this.checked;
            this.checkMark.setVisible(this.checked);
            if (toggleCallback) {
                toggleCallback(this, scene);
            }
        }, checkBox);
    }

    addSadMessage(x, y) {
        var sad = new Phaser.GameObjects.Sprite(this, x, y, 'sadmsg');
        sad.setAlpha(0);
        this.tweens.add({
            targets: sad,
            alpha: {from: 0, to: 1},
            ease: 'Sine.InOut',
            duration: 1000,
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