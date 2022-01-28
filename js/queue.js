
class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

class Queue {
    constructor(maxSize = -1) {
        this.first = null;
        this.last = null;
        this.size = 0;
        this.maxSize = maxSize;
    }
    push(data) {
        if (this.first === null) {
            this.first = new Node(data);
            this.last = this.first;
        }
        else {
            this.last.next = new Node(data);
            this.last = this.last.next;
        }

        if (this.maxSize >= 0 && this.size == this.maxSize) {
            this.first = this.first.next;
        }
        else {
            this.size += 1;
        }
    }
    pop() {
        var result = this.first.data;
        this.first = this.first.next;
        this.size -= 1;
        if (this.size == 0) {
            this.tail = null;
        }
        return result;
    }
}

class Window extends Queue {
    constructor(maxSize) {
        super(maxSize);
        this.total = 0;
        this.average = 0;
        this.maxSize += 1;
    }
    push(data) {
        super.push(data);
        if (this.size == this.maxSize) {
            this.total -= this.first.data;
        }
        this.average = (this.total + data)/this.size;
        this.total += data;
    }
    pop() {
        throw 'No Popping Allowed!';
    }
    getAverage() {
        return this.average;
    }
    getTotal() {
        return this.total;
    }
}

export { Window };