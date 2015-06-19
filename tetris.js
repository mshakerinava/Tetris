/*                 The 7 Tetrominoes

  * *   * *               * *     *      *           *
* *       * *   * * * *   * *   * * *    * * *   * * *

  S       Z        I       O      T        J       L

*/

"use strict";

// Constants
var Width = 10, Height = 20;
var StartDelay = 600;
var SpeedIncCoef = 7;
var ButtonHeight = 10;

var Tetrominoes = [ ["Magenta", [4, -1], [3, -1], [4, -2], [5, -1], [4, -1]],
					["Green", [4, -1], [3, -1], [4, -1], [4, -2], [5, -2]],
					["Red", [4, -1], [3, -2], [4, -1], [4, -2], [5, -1]],
					["Cyan", [4.5, -0.5], [3, -1], [4, -1], [5, -1], [6, -1]],
					["Blue", [4, -1], [5, -1], [4, -1], [3, -1], [3, -2]],
					["Orange", [4, -1], [3, -1], [4, -1], [5, -1], [5, -2]],
					["Yellow", [4.5, -1.5], [4, -1], [4, -2], [5, -1], [5, -2]] ];

// Globals
var matrix = document.getElementById("matrix");
var fallingTetromino = null;
var lineClearPause = false;
var gameover = false;
var lineClears = 0;

// Create two dimensional arrays
var minoRef = [], td = [];
for(var x = 0; x < Width; ++x)
{
	minoRef[x] = [];
	for(var y = -2; y < Height; ++y)
		minoRef[x][y] = null;
	td[x] = [];
}

// Define Point Class (Immutable)
var Point = function(x, y)
{
	this.x = x;
	this.y = y;
}

Point.prototype.minus = function(b)
{
	return new Point(this.x - b.x, this.y - b.y);
}

Point.prototype.plus = function(b)
{
	return new Point(this.x + b.x, this.y + b.y);
}

Point.prototype.rotate = function(pivot)
{
	var res = this.minus(pivot);
	res = new Point(res.y, -res.x);
	res = res.plus(pivot);
	return res;
}

Point.prototype.isNeighbour = function(b)
{
	if(Math.abs(this.x - b.x) + Math.abs(this.y - b.y) === 1)
		return true;
	else
		return false;
}

Point.prototype.inBoard = function()
{
	if(0 <= this.x && this.x < Width && -2 <= this.y && this.y < Height)
		return true;
	else
		return false;
}

// Define Mino Class (Mutable)
var Mino = function(x, y, tetromino)
{
	this.place = new Point(x, y);
	this.tetromino = tetromino;
	minoRef[x][y] = this;
}

Mino.prototype.move = function(x, y)
{
	var p = this.place;
	if(minoRef[p.x][p.y] === this)
		minoRef[p.x][p.y] = null;
	this.place = this.place.plus(new Point(x, y));
	p = this.place;
	minoRef[p.x][p.y] = this;
}

Mino.prototype.rotate = function(pivot)
{
	var p = this.place;
	var newP = this.place.rotate(pivot);
	if(minoRef[p.x][p.y] === this)
		minoRef[p.x][p.y] = null;
	this.place = newP;
	minoRef[newP.x][newP.y] = this;
};

Mino.prototype.destroy = function()
{
	var p = this.place;
	if(minoRef[p.x][p.y] === this)
		minoRef[p.x][p.y] = null;
	for(var i = 0; i < 4; ++i)
		if(this.tetromino.minoes[i] === this)
			this.tetromino.minoes[i] = null;
}

// Define Tetromino Class (Mutable)
var Tetromino = function(color, x, y)
{
	this.color = color;
	this.pivot = new Point(x, y); // is deleted when tetromino is in place.
	this.minoes = [];
}

Tetromino.prototype.rotate = function()
{
	for(var i = 0; i < 4; ++i)
		if(this.minoes[i] != null)
		{
			var p = this.minoes[i].place;
			var newP = this.minoes[i].place.rotate(this.pivot);
			if(!newP.inBoard() || (minoRef[newP.x][newP.y] != null && minoRef[newP.x][newP.y].tetromino != this))
				return false;
		} 
	for(var i = 0; i < 4; ++i)
		if(this.minoes[i] != null)
			this.minoes[i].rotate(this.pivot);
}

Tetromino.prototype.move = function(x, y)
{
	var isEmpty = true;
	for(var i = 0; i < 4; i++)
		if(this.minoes[i] != null)
		{
			isEmpty = false;
			var p = this.minoes[i].place;
			var newP = p.plus(new Point(x, y));
			if(!newP.inBoard() || (minoRef[newP.x][newP.y] != null && minoRef[newP.x][newP.y].tetromino != this))
				return false;
		}
	if(isEmpty)
		return false;
	for(var i = 0; i < 4; ++i)
		if(this.minoes[i] != null)
			this.minoes[i].move(x, y);
	this.pivot = this.pivot.plus(new Point(x, y));
	return true;
}

Tetromino.prototype.split = function()
{
	var newT = new Tetromino(this.color); // The pivot is not needed since it's not going to rotate
	for(var j = 0; j < 3; ++j) // There are atmost three minoes remaining
	{
		newT.minoes[j] = null;
		for(var i = 0; i < 4; ++i)
			if(this.minoes[i] != null && (newT.minoes[0] === null || this.minoes[i].place.isNeighbour(newT.minoes[j - 1].place)))
			{
				newT.minoes[j] = this.minoes[i]; // Comparing only with the last one will work because of the order of the minoes!
				this.minoes[i] = null;
				newT.minoes[j].tetromino = newT;
				break;
			}
		if(newT.minoes[j] === null)
			break;
	}
}

var releaseTetromino = function()
{
	var type = Math.floor(Math.random() * 7);
	fallingTetromino = new Tetromino(Tetrominoes[type][0], Tetrominoes[type][1][0], Tetrominoes[type][1][1]);
	for(var i = 0; i < 4; ++i)
		fallingTetromino.minoes[i] = new Mino(Tetrominoes[type][2 + i][0], Tetrominoes[type][2 + i][1], fallingTetromino);
}

var displayMatrix = function()
{
	for(var x = 0; x < Width; ++x)
		for(var y = 0; y < Height; ++y)
			if(minoRef[x][y] != null)
				td[x][y].style["background-color"] = minoRef[x][y].tetromino.color;
			else
				td[x][y].style["background-color"] = "";
}

var mobileAndTabletCheck = function()
{
	// return true; // for testing TODO
	var check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
}

var createMatrix = function()
{
	for(var y = 0; y < Height; ++y)
	{
		var row = document.createElement("tr");
		for(var x = 0; x < Width; ++x)
		{
			td[x][y] = document.createElement("td");
			row.appendChild(td[x][y]);
		}
		matrix.appendChild(row);
	}
}

var clearLines = function()
{
	var didClearing = false;
	for(var y = 0; y < Height; ++y)
	{
		var isComplete = true;
		for(x = 0; x < Width; ++x)
			if(minoRef[x][y] === null)
			{
				isComplete = false;
				break;
			}
		if(isComplete)
		{
			++lineClears;
			didClearing = true;
			for(x = 0; x < Width; ++x)
			{
				var tetromino = minoRef[x][y].tetromino;
				minoRef[x][y].destroy();
				tetromino.split();
			}
		}
	}
	document.getElementById("topLeftGUIText").innerHTML = "Lines Cleared: " + lineClears;
	return didClearing;
}

var pullDownOne = function()
{
	var didPulling = false;
	for(var x = 0; x < Width; ++x)
		for(var y = 0; y < Height; ++y)
			if(minoRef[x][y] != null)
				minoRef[x][y].tetromino.flag = false; // There is no flag in constructor!
	for(var y = Height - 1; y >= 0; --y)
	{
		var d = +1;
		for(var x = 0; x != -1; x += d)
		{
			if(minoRef[x][y] != null && minoRef[x][y].tetromino.flag === false && minoRef[x][y].tetromino.move(0, 1))
			{
				minoRef[x][y + 1].tetromino.flag = true;
				didPulling = true;
			}
			if(x === 9)
				d *= -1;
		}
	}
	displayMatrix();
	if(didPulling)
		window.setTimeout(pullDownOne, 333);
	else
	{
		lineClearPause = false;
		gameLoop();
	}
}

var gameLoop = function()
{
	if(fallingTetromino === null || !fallingTetromino.move(0, 1)) // if stuck
	{
		fallingTetromino = null;
		if(clearLines())
		{
			lineClearPause = true;
			window.setTimeout(pullDownOne, 333);
		}
		else
		{
			if(checkGameover())
			{
				writeGameover();
				console.log("GAMEOVER");
				gameover = true;
			}
			else
				releaseTetromino();
		}
	}
	displayMatrix();
	if(!lineClearPause && !gameover)
		window.setTimeout(gameLoop, StartDelay - SpeedIncCoef * lineClears);
}

var main = function()
{
	createMatrix();
	if(mobileAndTabletCheck())
	{
		document.getElementById("GUIControls").style.display = "";
		matrix.style.height = 100 - 2*ButtonHeight + "vh";
		matrix.style.width = 50 - ButtonHeight + "vh";
		document.getElementById("ButtonUp").style.height = ButtonHeight + "vh;"
		document.getElementById("ButtonUp").style.width = (50 - ButtonHeight) / 3 + "vh;"
		document.getElementById("ButtonLeft").style.height = ButtonHeight + "vh;"
		document.getElementById("ButtonLeft").style.width = (50 - ButtonHeight) / 3 + "vh;"
		document.getElementById("ButtonDown").style.height = ButtonHeight + "vh;"
		document.getElementById("ButtonDown").style.width = (50 - ButtonHeight) / 3 + "vh;"
		document.getElementById("ButtonRight").style.height = ButtonHeight + "vh;"
		document.getElementById("ButtonRight").style.width = (50 - ButtonHeight) / 3 + "vh;"
	}
	releaseTetromino();
	window.setTimeout(gameLoop, StartDelay - SpeedIncCoef * lineClears);
}

var writeGameover = function()
{
	var gameoverString = "GAMEOVER";
	for(var i = 1; i < 9; ++i)
		td[i][9].innerHTML = gameoverString[i - 1];
}

var checkGameover = function()
{
	for(var x = 0; x < Width; ++x)
		if(minoRef[x][-1] != null)
			return true;
	return false;
}

/* Add event listener for key presses */
document.addEventListener('keydown', function (event)
{
    switch(event.keyCode)
    {
		case 32:
    		console.log("Space was pressed");
    		fallingTetromino.move(0, 1);
    		break;
		
		case 39:
			console.log ("Right was pressed");
			fallingTetromino.move(1, 0);
			break;

    	case 38:
    		console.log("Up was pressed");
    		fallingTetromino.rotate();
    		break;
    		
		case 40:
			console.log("Down was pressed");
			fallingTetromino.move(0, 1);
			break;
			
		case 37:
			console.log ("Left was pressed");
			fallingTetromino.move(-1, 0);
			break;
    }
    displayMatrix();
});

main();