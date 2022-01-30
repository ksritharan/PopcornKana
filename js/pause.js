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
            this.scene.stop();
            this.scene.resume('PopcornKana');

        }, this);
    }
}