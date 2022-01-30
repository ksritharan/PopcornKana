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
    }

    preload ()
    {
        this.load.spritesheet('popcorn', 'assets/popcorn-spritesheet.png', { frameWidth: 86, frameHeight: 67});
        this.load.bitmapFont('kana', 'assets/kana.png', 'assets/kana.xml');
        this.load.image('nice', 'assets/nice.png');
        this.load.image('sad', 'assets/sad.png');
        this.load.image('pause', 'assets/pause.png');
        this.load.image('heart', 'assets/heart.png');
        
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
        var tabLabels = ['Accuracy', 'Avg. Answer Rate']
        var tabLayers = [this.createAccuracyInfo(), this.createAvgAnswerRateInfo()];
        this.createTabs(50, 100, tabLabels, tabLayers);        
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
        let averageAccuracyLabel = new Phaser.GameObjects.Text(this, 0, 0, 'Avg. Accuracy: '+averageAccuracyNum+'%', fontStyle);
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