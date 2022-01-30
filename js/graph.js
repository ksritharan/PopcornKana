export class Graph {

    constructor (scene, config)
    {
        this.scene = scene;
        this.xDecimalPlaces = 0;
        this.yDecimalPlaces = 0;
        this.fontStyle = {
            font: '14px Arial', 
            color: '#000000',
            stroke: '#E3FBFF',
            strokeThickness: 1.5
        };
        Object.assign(this, config);
        this.originX = -config.plotWidth/2;
        this.originY = config.plotHeight/2;
        this.xMultiplier = Math.pow(10, this.xDecimalPlaces);
        this.yMultiplier = Math.pow(10, this.yDecimalPlaces);
        
        this.container;
        this.#build();
    }

    #validate ()
    {
        if (this.xValues.length != this.yValues.length) {
            throw 'Length mismatch on xValues and yValues';
        }
    }

    #build ()
    {
        this.#validate();

        this.container = new Phaser.GameObjects.Container(this.scene, this.centerX, this.centerY);
        let boundBox = new Phaser.GameObjects.Rectangle(this.scene, 0, 0, this.plotWidth, this.plotHeight);
        boundBox.setStrokeStyle(4, 0x000000);
        this.container.add(boundBox);

        this.#calcCellSize();
        let grid = new Phaser.GameObjects.Grid(this.scene, 0, 0, this.plotWidth, this.plotHeight, this.cellWidth, this.cellHeight, 0xE6E6E6, 0.5, 0x000000, 0.25);
        grid.setScale(1, -1);
        this.container.add(grid);

        this.#addAxisLabels();

        this.#calculatePoints();
        this.#plot();

        //debug box
        if (this.debug) {
            let realBounds = this.container.getBounds(); // x, y is the top left corner
            var realBoundBox = new Phaser.GameObjects.Rectangle(this.scene, realBounds.x, realBounds.y, realBounds.width, realBounds.height);
            realBoundBox.setStrokeStyle(1.5, 0xFF0000);
            realBoundBox.setOrigin(0, 0);
            this.scene.add.existing(realBoundBox);
        }
        if (!this.hideFromScene) {
            this.scene.add.existing(this.container);
        }
    }

    #getMaxLabelWidth (maxVal)
    {
        let labelPadding = 5;
        let testLabel = new Phaser.GameObjects.Text(this.scene, 0, 0, maxVal, this.fontStyle);
        let width = testLabel.width + labelPadding;
        testLabel.destroy();
        return width;
    }

    #getNextInc(curTick, multiplier)
    {
        let newVal = Math.ceil(curTick * multiplier);
        if (newVal == 1)
            return 1/multiplier;
        else if (newVal <= 2)
            return 2/multiplier;
        else if (newVal <= 5)
            return 5/multiplier;
        else if (newVal <= 10)
            return 10/multiplier;
        else
            return 10*Math.ceil(newVal/10)/multiplier;
    }

    #calcLabels ()
    {
        this.minX = Math.min.apply(null, this.xValues);
        this.maxX = Math.max.apply(null, this.xValues);
        this.minY = Math.min.apply(null, this.yValues);
        this.maxY = Math.max.apply(null, this.yValues);

        let xLabelWidth = this.#getMaxLabelWidth(Math.round(this.maxX*this.xMultiplier)/this.xMultiplier);
        let yLabelHeight = this.#getMaxLabelWidth(Math.round(this.maxY*this.yMultiplier)/this.yMultiplier);

        let upperBoundXLabels = Math.floor(this.plotWidth/xLabelWidth);
        let upperBoundYLabels = Math.floor(this.plotHeight/yLabelHeight);

        let currentTickX = (this.maxX - this.minX)/upperBoundXLabels;
        let currentTickY = (this.maxY - this.minY)/upperBoundYLabels;

        this.tickX = this.#getNextInc(currentTickX, this.xMultiplier);
        this.tickY = this.#getNextInc(currentTickY, this.yMultiplier);

        this.numXLabels = Math.ceil((this.maxX - this.minX)/this.tickX);
        this.numYLabels = Math.ceil((this.maxY - this.minY)/this.tickY);
    }

    #calcCellSize ()
    {
        this.#calcLabels();

        this.cellWidth = this.plotWidth/this.numXLabels;
        this.cellHeight = this.plotHeight/this.numYLabels;

        // This multiplied by cellWidth gives the tick mark label
        this.pixelNumRatioX = this.cellWidth/(this.tickX);
        this.pixelNumRatioY = this.cellHeight/(this.tickY);
    }

    #addAxisLabels ()
    {
        let offset = 2;
        let maxWidth = 0;
        let maxHeight = 0;
        if (!this.hideXAxisTicks) {
            for (let i = 0; i <= this.numXLabels; i += 1)
            {
                let num = Math.round(this.xMultiplier * (this.minX + i*this.tickX))/this.xMultiplier;
                let xLabelNum = new Phaser.GameObjects.Text(this.scene, this.originX + i * this.cellWidth, this.originY + offset, num+'', this.fontStyle);
                xLabelNum.setOrigin(0.5, 0);
                maxHeight = Math.max(maxHeight, xLabelNum.height);
                this.container.add(xLabelNum);
            }
        }
        let xLabelText = new Phaser.GameObjects.Text(this.scene, 0, this.originY + offset + maxHeight, this.xAxisLabel, this.fontStyle); 
        xLabelText.setOrigin(0.5, 0);
        this.container.add(xLabelText);
        for (let j = 0; j <= this.numYLabels; j += 1)
        {
            let num = Math.round(this.yMultiplier * (this.minY + j*this.tickY))/this.yMultiplier;
            let yLabelNum = new Phaser.GameObjects.Text(this.scene, this.originX - offset, this.originY - j * this.cellHeight, num+'', this.fontStyle);
            yLabelNum.setOrigin(1, 0.5);
            maxWidth = Math.max(maxWidth, yLabelNum.width);
            this.container.add(yLabelNum);
        }
        let yLabelText = new Phaser.GameObjects.Text(this.scene, this.originX - offset - maxWidth, 0, this.yAxisLabel, this.fontStyle); 
        yLabelText.setRotation(3*Math.PI/2);
        yLabelText.setOrigin(0.5, 1);
        this.container.add(yLabelText);
    }

    #calculatePoints ()
    {
        this.points = [];
        for (let i = 0; i < this.xValues.length; i++)
        {
            let x = this.originX + (this.xValues[i]-this.minX) * this.pixelNumRatioX;
            let y = this.originY - (this.yValues[i]-this.minY) * this.pixelNumRatioY;
            this.points[i] = [x, y];
        }
    }

    #plot ()
    {
        for (let i = 0; i < this.points.length; i++)
        {
            let x = this.points[i][0];
            let y = this.points[i][1];
            let dot = new Phaser.GameObjects.Star(this.scene, x, y, 5, 2, 4, 0xFF0000, 1);
            this.container.add(dot);
            if (i > 0) {
                let lastX = this.points[i-1][0];
                let lastY = this.points[i-1][1];
                let line = new Phaser.GameObjects.Line(this.scene, 0, 0, lastX, lastY, x, y, 0xFF0000, 1);
                line.setOrigin(0, 0);
                this.container.add(line);
            }
        }
    }
    
}