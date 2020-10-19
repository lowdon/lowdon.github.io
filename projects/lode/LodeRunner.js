/*     Lode Runner

Aluno 1: ?number ?name <-- mandatory to fill
Aluno 2: ?number ?name <-- mandatory to fill

Comentario:

O ficheiro "LodeRunner.js" tem de incluir, logo nas primeiras linhas,
um comentário inicial contendo: o nome e número dos dois alunos que
realizaram o projeto; indicação de quais as partes do trabalho que
foram feitas e das que não foram feitas (para facilitar uma correção
sem enganos); ainda possivelmente alertando para alguns aspetos da
implementação que possam ser menos óbvios para o avaliador.

01234567890123456789012345678901234567890123456789012345678901234567890123456789
*/


// GLOBAL VARIABLES

// tente não definir mais nenhuma variável global
let audio = null;
let empty, hero, control;



// ACTORS

class Actor {
	constructor(x, y, imageName) {
		this.x = x;
		this.y = y;
		this.imageName = imageName;
		this.show();
	}
	draw(x, y) {
		control.ctx.drawImage(GameImages[this.imageName],
			x * ACTOR_PIXELS_X, y * ACTOR_PIXELS_Y);
	}
	getImageName() {
		return this.imageName;
	}
	move(dx, dy) {
		this.hide();
		this.x += dx;
		this.y += dy;
		this.show();
	}
}

class PassiveActor extends Actor {
	constructor(x, y, imageName, isInsurmountable, isClimbable, isCollectable, isBreakable, isHoldable) {
		super(x, y, imageName);
		this.isInsurmountable = isInsurmountable;
		this.isClimbable = isClimbable;
		this.isCollectable = isCollectable;
		this.isBreakable = isBreakable;
		this.isHoldable = isHoldable;
	}
	isInsurmountable() {
		return isInsurmountable;
	}
	isClimbable() {
		return isClimbable;
	}
	isCollectable() {
		return isCollectable;
	}
	isBreakable() {
		return isBreakable;
	}
	isHoldable() {
		return isHoldable;
	}
	show() {
		control.world[this.x][this.y] = this;
		this.draw(this.x, this.y);
	}
	hide() {
		control.world[this.x][this.y] = empty;
		empty.draw(this.x, this.y);
	}
}

class ActiveActor extends Actor {
	direction = 0;
	hasMoved = false;
	constructor(x, y, imageName, isPeaceful) {
		super(x, y, imageName);
		this.time = 0;	// timestamp used in the control of the animations
		this.isPeaceful = isPeaceful;
		this.direction = -1;
	}

	alterDirection(side) {
		if (side != 0)
			this.direction = side;
	}

	getDirection() {
		return this.direction;
	}
	isPeaceful() {
		return isPeaceful;
	}
	show() {
		control.worldActive[this.x][this.y] = this;
		this.draw(this.x, this.y);
	}
	hide() {
		control.worldActive[this.x][this.y] = empty;
		control.world[this.x][this.y].draw(this.x, this.y);
	}
	animation() {
	}

	fall() {
		this.hide();
		this.x += 0;
		this.y += 1;
		this.show();
		this.move(0, 0);
	}

	isHoldingOn() {
		let behind = control.getBehind(this.x, this.y);
		if (behind.isHoldable)
			return true;
		return false;
	}

	isFalling() {
		let behind = control.getBehind(this.x, this.y);
		let atFeet = control.get(this.x, this.y + 1);
		if (this.y !== WORLD_HEIGHT - 1) {
			if (!behind.isClimbable && !behind.isHoldable && atFeet.isInsurmountable && !atFeet.isClimbable)
				return true;
		}
		else
			return false;
	}

	isClimbing() {
		if (this.clibingAlternate)
			this.clibingAlternate = false;
		else
			this.clibingAlternate = true;

		let behind = control.getBehind(this.x, this.y);
		if (behind.imageName == "ladder" && behind.isClimbable)
			return true;
		return false;
	}
}

class Brick extends PassiveActor {
	constructor(x, y) { super(x, y, "brick", false, false, false, true, false); }
}

class Chimney extends PassiveActor {
	constructor(x, y) { super(x, y, "chimney", true, false, false, false, false); }
}

class Empty extends PassiveActor {
	constructor() { super(-1, -1, "empty", true, false, false, true, false); }
	show() { }
	hide() { }
}

class Gold extends PassiveActor {
	constructor(x, y) { super(x, y, "gold", true, false, true, false, false); }
}

class Invalid extends PassiveActor {
	constructor(x, y) { super(x, y, "invalid", true, false, false, false, false); }
}

class Ladder extends PassiveActor {
	constructor(x, y) {
		super(x, y, "empty", true, true, false, false, false);
	}
	makeVisible() {
		this.imageName = "ladder";
		this.show();
	}
}

class Rope extends PassiveActor {
	constructor(x, y) { super(x, y, "rope", true, false, false, false, true); }
}

class Stone extends PassiveActor {
	constructor(x, y) { super(x, y, "stone", false, false, false, false, false); }
}

class Boundary extends Stone {
	constructor() { super(-1, -1, "empty", false, false, false, false, false); }
	show() { }
	hide() { }
}
class Hole extends PassiveActor {
	constructor(x, y, timeCreated) {
		super(x, y, "empty", true, false, false, false, false)
		this.timeCreated = control.time;
	}
	getTimeCreated() {
		return this.timeCreated;
	}
	show() { }
	hide() { }
}


class Hero extends ActiveActor {
	clibingAlternate = false;
	isShooting = false;

	constructor(x, y) {
		super(x, y, "hero_runs_left", true);
	}

	move(dx, dy) {
		let next = control.get(this.x + dx, this.y + dy);
		let nextBehind = control.getBehind(this.x + dx, this.y + dy);
		let behind = control.getBehind(this.x, this.y);
		if (nextBehind != this.boundary && nextBehind.isCollectable) {
			control.points++;
			control.score++;
			nextBehind.hide();
			this.show();
		}
		if (next == this.boundary)
			/* Do Nothing*/;
		else if (!next.isInsurmountable)
			/* Do Nothing*/;
		else if (dy == -1 && !behind.isClimbable && !next.isClimbable)
			/* Do Nothing*/;
		else if (dy == 1 && !behind.isClimbable && !next.isClimbable && !behind.isHoldable)
			/* Do Nothing*/;
		else if (behind.imageName == "empty" && behind.isClimbable && nextBehind.imageName == "empty" && nextBehind.isClimbable)
			/* Do Nothing*/;
		else if (behind.imageName == "empty" && dy == -1 && next.isClimbable) {
			/* Do Nothing*/;
		}
		else {
			this.hide();
			audioWalk();
			this.x += dx;
			this.y += dy;
			this.show();
			this.hasMoved = true;

			if (control.points == control.nOfGold && !control.isLadderVisible) { // DEVIA ESTAR NO CONTROL
				control.makeLadderVisible();
			} else if (control.points == control.nOfGold && dy == -1
				&& nextBehind.isClimbable && this.y == 0) {
				control.nextLevel();
			}
		}

	}


	

	shoot() {
		this.isShooting = true;
		let brickToBreak = control.get(this.x + super.getDirection(), this.y + 1);
		let topOfBrickToBreak = control.get(this.x + super.getDirection(), this.y);

		if (brickToBreak != this.boundary && brickToBreak != this.invalid)
			if (brickToBreak.isBreakable && !topOfBrickToBreak.isBrickOrStone) {
				if (!this.isHoldingOn() && !this.isFalling() && !this.isClimbing()) {
					brickToBreak.hide();
					let newHole = new Hole(this.x + super.getDirection(), this.y + 1);
					control.world[this.x + super.getDirection()][this.y + 1] = newHole;

					if (super.getDirection() == 1) {
						this.recoil(-1);
					} else {
						this.recoil(1);
					}

				}
			}
	}

	recoil(direction) {
		let behind = control.getBehind(this.x + direction, this.y);
		if (behind != this.boundary && behind.isInsurmountable) {
			this.hide();
			this.x += direction;
			this.show();
		}

	}

	animation() {
		control.respawnBricks();
		document.getElementById("points").innerHTML = control.points;
		document.getElementById("score").innerHTML = control.score * 50; // each point is 50 score
		document.getElementById("lives").innerHTML = control.lives;
		let k = control.getKey();
		if (this.y != WORLD_HEIGHT - 1 && this.isFalling())
			this.fall();
		else if (k == null)
			;
		else if (k == ' ')
			this.shoot();
		else {
			let [dx, dy] = k;
			this.alterDirection(dx);
			this.move(dx, dy);
		}
	}

	show() {
		let behind = control.getBehind(this.x, this.y);
		if (this.isFalling() && this.hasMoved) {
			if (this.getDirection() == 1)
				this.imageName = "hero_falls_right";
			else
				this.imageName = "hero_falls_left";
		}
		else if (this.isClimbing()) {
			if (this.clibingAlternate)
				this.imageName = "hero_on_ladder_right";
			else
				this.imageName = "hero_on_ladder_left";
		}
		else if (this.isHoldingOn()) {
			if (this.getDirection() == 1)
				this.imageName = "hero_on_rope_right";
			else
				this.imageName = "hero_on_rope_left";
		}
		else if (this.isShooting) {
			if (this.getDirection() == 1) {
				this.isShooting = false;
				console.log("shot");
				this.imageName = "hero_shoots_right";
			}
			else {
				console.log("shot");
				this.isShooting = false;
				this.imageName = "hero_shoots_left";
			}
		}
		else {
			if (this.direction == 1)
				this.imageName = "hero_runs_right";
			else
				this.imageName = "hero_runs_left";
		}

		super.show();
	}
}

class Robot extends ActiveActor {
	currentState = 0;	// 0 - X axis mode, 1- Y descending, 2- Y ascending
	constructor(x, y) {
		super(x, y, "robot_runs_right", false);
		this.hasFallenInAHole = false;
		this.isHoldingGold = false;
		this.heldedGold = false;
		this.timeInHole = 0;
	}



	executeMove(a, b) { //a is x coordinate, b is y coordinate
		let nextB = control.getBehind(this.x + a, this.y + b);
		this.next = control.get(this.x + a, this.y + b);
		if (nextB.isInsurmountable && !(this.next instanceof Robot)) {
			this.hide();
			if (this.direction != a) {
				this.alterDirection(a);
			}
			this.x += a;
			this.y += b;
			this.show();
		}
	}


	animation() {
		let behind = control.getBehind(this.x, this.y);
		let head = control.get(this.x, this.y - 1);


		 if (this.hasFallenInAHole) {


			if (this.isHoldingGold && !this.heldedGold) {
				let newGold = new Gold(this.x, this.y - 1);
				newGold.show();
			}
			this.heldedGold = true;
			this.hasFallenInAHole = false;

			
		}


		else if (this.timeInHole != 0) {
			if (control.time - this.timeInHole > 50 && head == empty) {
				this.hasFallenInAHole = false;
				this.timeInHole = 0;
				this.hide();
				this.y -= 1;
				this.show();
			}
		}
		else if (behind instanceof Hole) {
			this.timeInHole = control.time;
			this.hasFallenInAHole = true;
			this.show();
		} else if (this.y != WORLD_HEIGHT - 1 && this.isFalling()) {
			this.fall();
		}
		else
			this.move();
	}

	calculateNextMoveX() {
		if (hero.x > this.x) // if hero right of monster
			//this.moveRight();
			this.executeMove(1, 0);
		else if (hero.x < this.x)
			//this.moveLeft();
			this.executeMove(-1, 0);
	}

	setState() {
		if (this.y < hero.y)
			this.currentState = 1; //trying to find ladder to go down
		else if (this.y > hero.y)
			this.currentState = 2; //trying to find ladder to go up
	}

	checkIfLadderDown() {
		let behindBelow = control.getBehind(this.x, this.y + 1);
		if (behindBelow.imageName == "ladder" && behindBelow.isClimbable)
			return true;
		return false;
	}

	checkIfLadderUp() {
		let behind = control.getBehind(this.x, this.y);
		if (behind.imageName == "ladder" && behind.isClimbable)
			return true;
		return false;
	}


	move() {
		this.setState();
		let nextBehind = control.getBehind(this.x, this.y);

		if (nextBehind != this.boundary && nextBehind.isCollectable && !this.isHoldingGold && !this.heldedGold) {
			this.isHoldingGold = true;
			
			nextBehind.hide();
		}
		if (this.currentState == 1) { // check if ladder exists to go down
			if (this.checkIfLadderDown() && (this.y < hero.y)) {
				this.executeMove(0, 1);
			}
			else
				this.currentState = 0;
		}

		if (this.currentState == 2) { // check if ladder exists to go up
			if (this.checkIfLadderUp() && (this.y > hero.y)) {
				this.executeMove(0, -1);
			}
			else
				this.currentState = 0;
		}

		if (this.currentState == 0) // else move on X axis
			this.calculateNextMoveX();

		this.time += control.robotPace;
		this.hasMoved = true;
	}

	show() {
		let behind = control.getBehind(this.x, this.y);
		if (behind instanceof Hole) {
			this.imageName = "robot_on_ladder_right";
		}
		else if (this.isFalling() && this.hasMoved) {
			if (this.getDirection() == 1)
				this.imageName = "robot_falls_right";
			else
				this.imageName = "robot_falls_left";
		}

		else if (this.isClimbing()) {
			if (this.clibingAlternate)
				this.imageName = "robot_on_ladder_right";
			else
				this.imageName = "robot_on_ladder_left";
		}
		else if (this.isHoldingOn()) {
			if (this.getDirection() == 1)
				this.imageName = "robot_on_rope_right";
			else
				this.imageName = "robot_on_rope_left";
		}
		else {
			if (this.direction == 1)
				this.imageName = "robot_runs_right";
			else
				this.imageName = "robot_runs_left";
		}
		super.show();
	}
}



// GAME CONTROL

class GameControl {
	constructor() {
		this.robotPace = 5;
		control = this;
		this.isLadderVisible = false;
		this.nOfGold = 0;
		this.key = 0;
		this.time = 0;
		this.points = 0;
		this.level = 1;
		this.lives = 3;
		this.score = 0;
		this.walkSound = new Audio("https://docs.google.com/uc?export=download&id=1oRZnFcV_RG4CQwSOdCHss1GzJLpJAJXB");
		this.ctx = document.getElementById("canvas1").getContext("2d");
		empty = new Empty();	// only one empty actor needed
		this.world = this.createMatrix();
		this.worldActive = this.createMatrix();
		this.loadLevel(this.level);
		this.setupEvents();
	}
	nextLevel() {
		this.level++;
		if (this.level == 17) { // after last level, repeat first level
			this.level = 1;
		}
		this.cleanMatrix(control.world);
		this.cleanMatrix(control.worldActive);
		this.loadLevel(control.level);
	}
	createMatrix() { // stored by columns
		let matrix = new Array(WORLD_WIDTH);
		for (let x = 0; x < WORLD_WIDTH; x++) {
			let a = new Array(WORLD_HEIGHT);
			for (let y = 0; y < WORLD_HEIGHT; y++)
				a[y] = empty;
			matrix[x] = a;
		}
		return matrix;
	}
	makeLadderVisible() {
		for (let x = 0; x < WORLD_WIDTH; x++) {
			for (let y = 0; y < WORLD_HEIGHT; y++)
				if (this.world[x][y].isClimbable)
					this.world[x][y].makeVisible();

		}
		this.isLadderVisible = true;
	}
	respawnBricks() {
		for (let x = 0; x < WORLD_WIDTH; x++) {
			for (let y = 0; y < WORLD_HEIGHT; y++)
				if (this.world[x][y] instanceof Hole) {
					if (this.time - this.world[x][y].getTimeCreated() > 50 && this.worldActive[x][y] == empty) {
						this.world[x][y].hide();
						this.world[x][y] = new Brick(x, y);;

					}
				}

		}
	}
	cleanMatrix(matrix) {
		for (let x = 0; x < WORLD_WIDTH; x++) {
			for (let y = 0; y < WORLD_HEIGHT; y++)
				matrix[x][y].hide();
		}
		return matrix;
	}
	countGoldPots() {
		let n = 0;
		for (let x = 0; x < WORLD_WIDTH; x++) {
			for (let y = 0; y < WORLD_HEIGHT; y++)
				if (this.world[x][y].isCollectable) {
					n++
				}
		}
		this.nOfGold = n;
		document.getElementById("neededpoints").innerHTML = this.nOfGold;
		document.getElementById("ndonivel").innerHTML = this.level;
		return this.nOfGold;
	}
	loadLevel(level) {
		if (level > MAPS.length) {
			alert("CONGRATS!");
			b1();
		}
		if (level < 1)
			fatalError("Invalid level " + level)
		let map = MAPS[level - 1];  // -1 because levels start at 1
		for (let x = 0; x < WORLD_WIDTH; x++)
			for (let y = 0; y < WORLD_HEIGHT; y++) {
				// x/y reversed because map stored by lines
				GameFactory.actorFromCode(map[y][x], x, y);
			}
		this.countGoldPots();
		this.isLadderVisible = false;
		this.points = 0;
	}
	getKey() {
		let k = control.key;
		control.key = 0;
		switch (k) {
			case 37: case 79: case 74: return [-1, 0]; //  LEFT, O, J
			case 38: case 81: case 73: return [0, -1]; //    UP, Q, I
			case 39: case 80: case 76: return [1, 0];  // RIGHT, P, L
			case 40: case 65: case 75: return [0, 1];  //  DOWN, A, K
			case 0: return null;
			default: return String.fromCharCode(k);
			// http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
		};
	}
	setupEvents() {
		addEventListener("keydown", this.keyDownEvent, false);
		addEventListener("keyup", this.keyUpEvent, false);
		setInterval(this.animationEvent, 1000 / ANIMATION_EVENTS_PER_SECOND);
	}

	animationEvent() {
		control.time++;
		for (let x = 0; x < WORLD_WIDTH; x++)
			for (let y = 0; y < WORLD_HEIGHT; y++) {
				let a = control.worldActive[x][y];
				if (a.time < control.time) {
					a.time = control.time;
					a.animation();
					if (control.get(hero.x, hero.y).isPeaceful == false) { //checking if player dies
						control.playerRespawn();
						alert("YOU DIED");
						--control.lives;
						if (control.lives == 0) {
							alert("GAME OVER\nFINAL SCORE: " + control.score * 50);
							b1();
						}
					}
				}
			}
	}

	playerRespawn() {
		control.cleanMatrix(control.world);
		control.cleanMatrix(control.worldActive);
		control.loadLevel(control.level);
	}

	keyDownEvent(k) {
		control.key = k.keyCode;
	}
	keyUpEvent(k) {
	}
	isInside(x, y) {
		return 0 <= x && x <= WORLD_WIDTH - 1 && 0 <= y && y <= WORLD_HEIGHT;
	}

	get(x, y) {
		if (!this.isInside(x, y))
			return this.boundary;
		else if (control.worldActive[x][y] !== empty)
			return control.worldActive[x][y];
		else
			return control.world[x][y];
	}
	getBehind(x, y) {
		if (!this.isInside(x, y))
			return this.boundary;
		else return control.world[x][y];
	}
}


// HTML FORM

function onLoad() {
	// Asynchronously load the images an then run the game
	GameImages.loadAll(function () { new GameControl(); });
}

function b1() {
	location.reload();
}

function b2() {
	if (audio == null)
		audio = new Audio("http://ctp.di.fct.unl.pt/miei/lap"
			+ "/projs/proj2020-3/files/louiscole.m4a");
	audio.loop = true;
	audio.play();  // requires a previous user interaction with the page
}

function b3() {
	if (audio != null)
		audio.pause();
}


function b4() {
	control.robotPace++;
}

function b5() {
	if ((control.robotPace - 1) > 0)
		control.robotPace--;
}

function audioWalk(){
	control.walkSound.play();
}



