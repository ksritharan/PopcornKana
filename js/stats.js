//import { Window } from './queue.js';
import { Graph } from './graph.js';
import { Tabs } from './tabs.js';

export class StatsScene extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'Stats' });

        this.STATUS_BAR_HEIGHT = 85;
        this.STATUS_BAR_CENTER = 43;

        this.accuracy;

        this.width;
        this.height;
    }

    init(data)
    {
        // Get stats from popcornkana
        this.accuracy = data['accuracy'];
        this.answerRate = data['answerRate'];
        this.avgAnswerRate = data['avgAnswerRate'];
        this.promptData = data['promptData'];
    }

    preload ()
    {
        this.load.spritesheet('popcorn', 'assets/popcorn-spritesheet.png', { frameWidth: 86, frameHeight: 67});
        this.load.bitmapFont('kana', 'assets/kana.png', 'assets/kana.xml');
        this.load.image('nice', 'assets/nice.png');
        this.load.image('sad', 'assets/sad.png');
        this.load.image('tomenu', 'assets/tomenu.png');

        this.width = this.game.config.width;
        this.height = this.game.config.height;
    }

    create ()
    {
        //Average Accuracy
        let fontStyle = {
            font: '36px Arial', 
            color: '#E3FBFF',
            stroke: '#333333',
            strokeThickness: 2,
            strokeAlpha: 0.75
        };
        this.add.text(this.width/2, this.STATUS_BAR_CENTER/2, 'Results', fontStyle).setOrigin(0.5, 0.5);
        var tabLabels = ['Accuracy', 'Avg. Answer Rate', 'Performance']
        var tabLayers = [this.createAccuracyInfo(), this.createAvgAnswerRateInfo(), this.createPerformanceInfo()];
        this.createTabs(50, 100, tabLabels, tabLayers);
        this.createToMenuButton();
    }

    createToMenuButton () {
        let toMenuButton = this.add.image(this.width-this.STATUS_BAR_CENTER, this.STATUS_BAR_CENTER, 'tomenu');
        toMenuButton.setInteractive();
        
        toMenuButton.on('pointerup', function () {
            this.scene.start('Menu');
        }, this);
    }

    createAccuracyInfo () {
        let xValues = this.accuracy.map(e => e.x);
        let yValues = this.accuracy.map(e => e.y);
        
  
        //Average Accuracy
        let fontStyle = {
            font: '18px Arial', 
            color: '#E3FBFF',
            stroke: '#000000',
            strokeThickness: 2,
            strokeAlpha: 0.75
        };
        let averageAccuracyNum = Math.floor(100*yValues.reduce((a, b) => a + b, 0)/(yValues.length - 1))/100;
        var averageAccuracyLabel = new Phaser.GameObjects.Text(this, 0, 0, 'Avg. Accuracy: '+averageAccuracyNum+'%', fontStyle);
        averageAccuracyLabel.setOrigin(0, 0.5);
        let labelWidth = averageAccuracyLabel.width;
        let labelOffset = 20;
              
        let config = {
            centerX: this.width/2 - labelWidth/2 - labelOffset/2,
            centerY: this.height/2,
            plotWidth: 500,
            plotHeight: 400,
            xValues: xValues,
            yValues: yValues,
            xAxisLabel: 'Time (s)',
            yAxisLabel: 'Accuracy (%)',
            hideXAxisTicks: false,
            hideFromScene: true,
            debug: false
        };

        var accuracy = new Graph(this, config);

        let labelX = config.centerX + config.plotWidth/2 + labelOffset;
        let labelY = config.centerY - config.plotHeight/2 + labelOffset;
        averageAccuracyLabel.setPosition(labelX, labelY);

        var layer = new Phaser.GameObjects.Layer(this, [accuracy.container, averageAccuracyLabel]);
        return layer;
    }

    createAvgAnswerRateInfo () {
        let xValues = this.avgAnswerRate.map(e => e.x);
        let yValues = this.avgAnswerRate.map(e => e.y);

        let config = {
            centerX: this.width/2,
            centerY: this.height/2,
            plotWidth: 500,
            plotHeight: 400,
            xValues: xValues,
            yValues: yValues,
            xAxisLabel: 'Time (s)',
            yAxisLabel: 'Answers per second',
            yDecimalPlaces: 2,
            hideXAxisTicks: false,
            hideFromScene: true,
            debug: false
        };
        var avgAnswerRate = new Graph(this, config);
        var layer = new Phaser.GameObjects.Layer(this, [avgAnswerRate.container]);
        return layer;
    }

    createPopcornPerformance(x, y, prompt) {
        var popcornBG = this.add.sprite(x, y, 'popcorn');
        var popcornText = this.add.bitmapText(x, y, 'kana', prompt);
        popcornText.setOrigin(0.5, 0.5);
        
        let smallStyle = {
            font: '12px Arial', 
            color: '#333333',
        };
        var romajiText = this.add.text(x, y-popcornText.height/2, this.promptData[prompt].answer, smallStyle);
        romajiText.setOrigin(0.5, 1);

        let fontStyle = {
            font: '18px Arial', 
            color: '#E3FBFF',
            stroke: '#000000',
            strokeThickness: 2,
            strokeAlpha: 0.5
        };
        let offsetY = 10;
        var accuracyText = this.add.text(x - popcornBG.width/2, y + popcornBG.height/2 + offsetY, 'Accuracy: ' + this.promptData[prompt].accuracy + '%', fontStyle);
        var avgTTAText = this.add.text(x - popcornBG.width/2, y + popcornBG.height/2 + accuracyText.height + offsetY, 'Avg. TTA: ' + this.promptData[prompt].avgTTA + ' ms', fontStyle);

        return [popcornBG, popcornText, romajiText, accuracyText, avgTTAText];
    }

    createPerformanceInfo() {
        this.processPromptDataInfo();
        //Average Accuracy
        let fontStyle = {
            font: '24px Arial', 
            color: '#E3FBFF',
            stroke: '#000000',
            strokeThickness: 2,
            strokeAlpha: 0.75
        };

        var objectList = [];
        var bestText = new Phaser.GameObjects.Text(this, 200, 150, 'Best', fontStyle);
        objectList.push(bestText);
        var nice = new Phaser.GameObjects.Image(this, 150, 200, 'nice');
        objectList.push(nice);
        var worstText = new Phaser.GameObjects.Text(this, 200, 350, 'Worst', fontStyle);
        objectList.push(worstText);
        var sad = new Phaser.GameObjects.Image(this, 150, 400, 'sad');
        objectList.push(sad);
        let x = 225;
        let y = 225;
        let offsetX = 175;
        let offsetY = 200;
        let numPrompts = this.promptData.best.length;
        for (let i = 0; i < 3; i++) {
            objectList.push(...this.createPopcornPerformance(x + i*offsetX, y, this.promptData.best[i]));
            objectList.push(...this.createPopcornPerformance(x + i*offsetX, y+offsetY, this.promptData.best[numPrompts-i-1]));
        }
        var layer = new Phaser.GameObjects.Layer(this, objectList);
        return layer;
    }

    processPromptDataInfo() {
        let prompts = this.promptData['prompts'];
        for (let i = 0; i < prompts.length; i++) {
            let prompt = prompts[i];
            let data = this.promptData[prompt];
            this.promptData[prompt]['accuracy'] = Math.round(10000*data.numCorrect/(data.numAttempts + data.numCorrect + data.numMissed))/100;
            this.promptData[prompt]['avgTTA'] = Math.round(data.delays.reduce((a, b) => a + b, 0)/data.delays.length);
        }
        this.promptData['best'] = [...prompts];
        this.promptData['best'].sort((a, b) => {
            let data = this.promptData;
            if (data[a].accuracy == data[b].accuracy) {
                return data[a].avgTTA - data[b].avgTTA; //asc avgTTA
            }
            else {
                return data[b].accuracy - data[a].accuracy; //desc accuracy
            }
        });
    }

    createTabs (x, y, tabLabels, tabLayers) {
        let config = {
            activeTabColor: 0x24d9ea,
            inactiveTabColor: 0xd6f8fb,
            startX: x,
            startY: y,
            tabLabels: tabLabels,
            tabLayers: tabLayers,
            fontStyle: {
                font: '24px Arial', 
                color: '#FFFFFF',
                stroke: '#4EDAE7',
                strokeThickness: 2,
                strokeAlpha: 0.33
            }
        }
        var tabs = new Tabs(this, config);
    }
}