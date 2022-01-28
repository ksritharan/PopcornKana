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