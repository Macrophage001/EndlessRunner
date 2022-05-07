const lerp = (v0, v1, t) => v0 * (1 - t) + v1 * t;
const clamp = (v, min, max) => v < min ? v = min : v > max ? v = max : v;
const range = (min, max) => Math.random() * (max - min) + min;

const generateHTML = (str) => {
    // Older browsers don't support DOMParser, so check to make sure.
    const support = (function () {
        if (!window.DOMParser) return false;
        var parser = new DOMParser();
        try {
            parser.parseFromString('x', 'text/html');
        } catch (err) {
            console.trace(err);
            return false;
        }
        return true;
    })();

    if (support) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(str, 'text/html');
        return doc.body.children[0];
    }
    var dom = document.createElement('div');
    dom.innerHTML = str;
    return dom.children[0];
}

const generateLoopCallback = (callback, interval, arr) => {
    if (arr) {
        arr.push(setInterval(() => {
            callback();
        }, interval));
    } else {
        var i = setInterval(() => {
            callback();
        }, interval);
    }
}

const deepCopy = (item) => {
    const deepCopyArr = (arr) => {
        let newArr = [];
        for (let i = 0; i < arr.length; i++) {
            let element = arr[i];
            if (typeof element === 'array') {
                newArr.push(deepCopyArr(element));
            } else {
                newArr.push(element);
            }
        }
        return newArr;
    }

    const deepCopyObj = (obj) => {
        let newObj = {};
        for (const prop in obj) {
            if (typeof obj[prop] === 'object') {
                newObj[prop] = deepCopyObj(obj[prop]);
            } else {
                newObj[prop] = obj[prop];
            }
        }
        return newObj;
    }

    const type = Object.prototype.toString.call(item).slice(8, -1).toLowerCase();
    if (type === 'array') {
        return deepCopyArr(item);
    } else if (type === 'object') {
        return deepCopyObj(item);
    } else {
        console.error('Invalid data structure', item);
    }
}

export { lerp, clamp, range, generateLoopCallback, generateHTML, deepCopy };