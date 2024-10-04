class Calculator {
    constructor() {
        this.display = document.getElementById('display');
        this.expression = document.getElementById('expression');
        this.buttons = document.querySelectorAll('.btn');
        this.currentExpression = '';
        this.lastResult = '0';
        this.history = JSON.parse(localStorage.getItem('calculatorHistory')) || [];
        this.isPopupActive = false;

        this.initEventListeners();
    }

    initEventListeners() {
        this.buttons.forEach(button => {
            button.addEventListener('click', (e) => this.handleButtonClick(e, button));
        });

        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());
        document.getElementById('closeHistory').addEventListener('click', () => this.toggleHistoryPopup());
        document.getElementById('closeGame').addEventListener('click', () => this.game.closeGamePopup());
    }

    handleButtonClick(e, button) {
        e.preventDefault();
        if (this.isPopupActive) return;

        if (button.dataset.digit) {
            this.appendToExpression(button.dataset.digit);
        } else if (button.dataset.action) {
            this.handleAction(button.dataset.action);
        }
    }

    handleKeyPress(e) {
        if (this.isPopupActive) return;

        if (e.key.match(/[0-9.]/)) {
            this.appendToExpression(e.key);
        } else if (e.key === 'Enter') {
            this.calculate();
        } else if (e.key === 'Backspace') {
            this.backspace();
        } else if (e.key.toLowerCase() === 'h') {
            this.toggleHistoryPopup();
        }
    }

    appendToExpression(value) {
        this.currentExpression += value;
        this.updateDisplay();
    }

    handleAction(action) {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'toggle-sign':
                this.toggleSign();
                break;
            case 'percentage':
                this.percentage();
                break;
            case 'calculate':
                this.calculate();
                break;
            case 'left-parenthesis':
                this.appendToExpression('(');
                break;
            case 'right-parenthesis':
                this.appendToExpression(')');
                break;
            case 'sin':
            case 'cos':
            case 'tan':
            case 'log':
                this.appendToExpression(`${action}(`);
                break;
            case 'add':
                this.appendToExpression('+');
                break;
            case 'subtract':
                this.appendToExpression('-');
                break;
            case 'multiply':
                this.appendToExpression('*');
                break;
            case 'divide':
                this.appendToExpression('/');
                break;
        }
    }

    clear() {
        this.currentExpression = '';
        this.lastResult = '0';
        this.updateDisplay();
    }

    toggleSign() {
        if (this.currentExpression.startsWith('-')) {
            this.currentExpression = this.currentExpression.slice(1);
        } else {
            this.currentExpression = '-' + this.currentExpression;
        }
        this.updateDisplay();
    }

    percentage() {
        try {
            const value = this.safeEval(this.currentExpression);
            this.currentExpression = (value / 100).toString();
            this.updateDisplay();
        } catch (error) {
            this.display.textContent = 'Error';
        }
    }

    calculate() {
        try {
            const expression = this.currentExpression
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/log/g, 'Math.log10');

            let result = this.safeEval(expression);

            if (Math.abs(result) > 1e15) {
                result = result.toExponential(2);
            } else {
                result = parseFloat(result.toFixed(10));
            }

            this.lastResult = result.toString();
            this.addToHistory(`${this.currentExpression} = ${this.lastResult}`);
            this.currentExpression = this.lastResult;
            this.updateDisplay();
        } catch (error) {
            this.display.textContent = 'Error';
        }
    }

    safeEval(expression) {
        return new Function('return ' + expression)();
    }

    backspace() {
        this.currentExpression = this.currentExpression.slice(0, -1);
        this.updateDisplay();
    }

    updateDisplay() {
        this.display.textContent = this.currentExpression || this.lastResult;
        this.expression.textContent = this.currentExpression;
    }

    addToHistory(entry) {
        this.history.push(entry);
        if (this.history.length > 10) {
            this.history.shift();
        }
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        this.history.forEach(entry => {
            const li = document.createElement('li');
            li.textContent = entry;
            historyList.appendChild(li);
        });
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem('calculatorHistory');
        this.updateHistoryDisplay();
    }

    toggleHistoryPopup() {
        const historyContainer = document.getElementById('historyContainer');
        const historyPopup = historyContainer.querySelector('.popup');
        historyContainer.classList.toggle('hidden');
        this.isPopupActive = !historyContainer.classList.contains('hidden');
        if (this.isPopupActive) {
            this.updateHistoryDisplay();
            setTimeout(() => historyPopup.classList.add('popup-enter-active'), 10);
        } else {
            historyPopup.classList.remove('popup-enter-active');
        }
    }

    setGame(game) {
        this.game = game;
    }
}

class Game {
    constructor(calculator) {
        this.calculator = calculator;
        this.gameContainer = document.getElementById('gameContainer');
        this.gamePopup = this.gameContainer.querySelector('.popup');
        this.gameMessage = document.getElementById('gameMessage');
        this.gameInput = document.getElementById('gameInput');
        this.gameButton = document.getElementById('gameButton');

        this.secretCode = '';
        this.initEventListeners();
    }

    initEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.gameInput.addEventListener('input', (e) => e.stopPropagation());
        this.gameButton.addEventListener('click', () => this.checkAnswer());
    }

    handleKeyPress(e) {
        if (this.calculator.isPopupActive) return;

        this.secretCode += e.key;
        if (this.secretCode.endsWith('1234')) {
            this.startGame('number');
        } else if (this.secretCode.endsWith('4321')) {
            this.startGame('math');
        } else if (this.secretCode.endsWith('0000')) {
            this.startEasterEgg();
        }
        if (this.secretCode.length > 10) this.secretCode = this.secretCode.slice(-10);
    }

    startGame(type) {
        this.gameContainer.classList.remove('hidden');
        this.calculator.isPopupActive = true;
        setTimeout(() => this.gamePopup.classList.add('popup-enter-active'), 10);
        this.gameInput.value = '';
        if (type === 'number') {
            this.currentGame = this.numberGame;
            this.secretNumber = Math.floor(Math.random() * 100) + 1;
            this.gameMessage.innerText = "I made a number from 1 to 100. Try to guess!";
        } else if (type === 'math') {
            this.currentGame = this.mathGame;
            this.num1 = Math.floor(Math.random() * 10) + 1;
            this.num2 = Math.floor(Math.random() * 10) + 1;
            this.gameMessage.innerText = `How will ${this.num1} × ${this.num2}?`;
        }
    }

    checkAnswer() {
        const userAnswer = parseInt(this.gameInput.value);
        if (isNaN(userAnswer)) {
            this.gameMessage.innerText = "Please enter a number.";
            return;
        }
        this.currentGame(userAnswer);
    }

    numberGame(guess) {
        if (guess === this.secretNumber) {
            this.gameMessage.innerText = "Congratulations! You guessed the number!";
        } else if (guess < this.secretNumber) {
            this.gameMessage.innerText = "Too little. Try again!";
        } else {
            this.gameMessage.innerText = "Too much. Try again!";
        }
    }

    mathGame(answer) {
        const correctAnswer = this.num1 * this.num2;
        if (answer === correctAnswer) {
            this.gameMessage.innerText = "Right! Good job!";
        } else {
            this.gameMessage.innerText = `Wrong. Right answer: ${correctAnswer}`;
        }
    }

    startEasterEgg() {
        this.calculator.display.textContent = "Hello!";
        setTimeout(() => {
            this.calculator.display.textContent = "I'm a calculator";
            setTimeout(() => {
                this.calculator.display.textContent = "with surprises :)";
                setTimeout(() => this.calculator.clear(), 2000);
            }, 2000);
        }, 2000);
    }

    closeGamePopup() {
        this.gamePopup.classList.remove('popup-enter-active');
        setTimeout(() => {
            this.gameContainer.classList.add('hidden');
            this.calculator.isPopupActive = false;
        }, 300);
    }
}

const calculator = new Calculator();
const game = new Game(calculator);
calculator.setGame(game);