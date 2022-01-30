export class Tabs {
    constructor (scene, config)
    {
        this.scene = scene;
        this.padding = 10;
        this.active = 0;
        Object.assign(this, config);
        this.tabBoxes = [];
        this.#build();
    }
    
    #build ()
    {
        let x = 0;
        let y = this.scene.STATUS_BAR_HEIGHT;
        let bgFillStartX = 0;
        let bgFillEndX = 0;
        let bgFillHeight = 0;
        let i = 0;
        let objects = [];
        for (let i = 0; i < this.tabLabels.length; i++) {
            let tabColor;
            if ( i == this.active ) {
                tabColor = this.activeTabColor;
                this.tabLayers[i].setVisible(true);
            }
            else {
                tabColor = this.inactiveTabColor;
                this.tabLayers[i].setVisible(false);
            }
            this.scene.add.existing(this.tabLayers[i]);

            let tabLabel = new Phaser.GameObjects.Text(this.scene, 0, 0, this.tabLabels[i], this.fontStyle);
            tabLabel.setOrigin(0.5, 0.5);
            let tabBox = new Phaser.GameObjects.Rectangle(this.scene, 0, 0, tabLabel.width, tabLabel.height, tabColor);
            let tabBoundBox = new Phaser.GameObjects.Rectangle(this.scene, 0, 0, tabLabel.width+this.padding, tabLabel.height+this.padding, 0, 0);
            tabBox.setStrokeStyle(this.padding, tabColor);
            x += tabBox.width/2 + this.padding/2;
            bgFillEndX = x;
            if ( i == 0 ) {
                y -= tabBox.height/2 + this.padding/2;
                bgFillStartX = x;
                bgFillHeight = tabLabel.height+this.padding;
            }
            let tabDivider;
            if ( i > 0 ) {
                tabDivider = new Phaser.GameObjects.Line(this.scene, 0, 0, 0, 0, 0, (tabLabel.height+this.padding)*0.66, this.activeTabColor, 0.5).setLineWidth(0.5);
                tabDivider.setPosition(x - tabBox.width/2 -+ this.padding/2, y);
            }
            tabLabel.setPosition(x, y);
            tabBox.setPosition(x, y);
            tabBoundBox.setPosition(x, y);
            tabBoundBox.setInteractive();
            tabBoundBox.on('pointerup', function () {
                if (this.active != i) {
                    this.tabLayers[this.active].setVisible(false);
                    this.tabBoxes[this.active].setFillStyle(this.inactiveTabColor).setStrokeStyle(this.padding, this.inactiveTabColor);
                    this.tabLayers[i].setVisible(true);
                    this.tabBoxes[i].setFillStyle(this.activeTabColor).setStrokeStyle(this.padding, this.activeTabColor);
                    this.active = i;
                }
            }, this);
            objects.push(tabBox);
            objects.push(tabLabel);
            if (tabDivider !== undefined) {
                objects.push(tabDivider);
            }
            this.tabBoxes.push(tabBox);
            x += tabBox.width/2 + this.padding/2;


        }
        let bgFillWidth = bgFillEndX - bgFillStartX;
        let bgFillX = bgFillStartX + bgFillWidth/2;
        let bgFillBox = new Phaser.GameObjects.Rectangle(this.scene, bgFillX, y, bgFillWidth, bgFillHeight, this.inactiveTabColor, 1);
        this.scene.add.existing(bgFillBox);
        for (let j = 0; j < objects.length; j++)
        {
            this.scene.add.existing(objects[j]);
        }
    }
}