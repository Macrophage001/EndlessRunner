var MathEX = (function () {
    var publicFunctions = {};

    publicFunctions.lerp  = (v0, v1, t) => v0 * (1 - t) + v1 * t;
    publicFunctions.clamp = (v, min, max) => v < min ? v = min : v > max ? v = max : v;
    publicFunctions.range = (min, max) => Math.random() * (max - min) + min;

    publicFunctions.sum   = (arr) => arr.reduce((state, value) => state + value);
    publicFunctions.mul   = (arr) => arr.reduce((state, value) => state * value);
    publicFunctions.avg   = (arr) => publicFunctions.sum(arr) / arr.length;
    
    publicFunctions.position = (element) => ({
        x: element.getBoundingClientRect().left,
        y: element.getBoundingClientRect().top,
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height
    });
    return publicFunctions;
})();

var Generators = (function () {
    var publicFunctions = {};
    publicFunctions.generateHTML = (str) => {
        // Some older browsers don't support DOMParser, so check to make sure.
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
    
    publicFunctions.generateLoopCallback = (callback, interval, arr) => {
        var i = setInterval(() => {
            callback();
        }, interval);
        if (arr)
            arr.push(i);
    }
    return publicFunctions;
})();

const findRootParent = (element, predicate) => {
    var curr = element;
    while (predicate(curr)) {
        if (curr.parentNode === null) {
            break;
        }
        curr = curr.parentNode;
    }
    return curr;
}

const deepCopy = (item) => {
    const getType = (element) => Object.prototype.toString.call(element).slice(8, -1).toLowerCase();
    const deepCopyArr = (arr) => {
        let newArr = [];
        for (let element of arr) {
            if (getType(element) === 'array') {
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
            if (getType(obj[prop]) === 'object') {
                newObj[prop] = deepCopyObj(obj[prop]);
            } else {
                newObj[prop] = obj[prop];
            }
        }
        return newObj;
    }

    const type = getType(item);
    if (type === 'array') {
        return deepCopyArr(item);
    } else if (type === 'object') {
        return deepCopyObj(item);
    } else {
        console.error('Invalid data structure', item);
    }
}

export { MathEX, Generators, deepCopy, findRootParent };