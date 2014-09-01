'use strict';

var _ = require('lodash'),
  gb = null;

exports.createGameBoard = function(req, res) {
  console.log('Creaing new game board.');
  gb = new GameBoard();
  return res.send(200);
};

exports.makeMove = function(req, res) {
  if (gb === null) throw new Error('Gameboard not initialized.');

  //make move from P1 perspective
  gb.makeMove(req.body.move, true);

  //checks whether P1 has won
  if (gb.checkVictory() >= 10) {
    return res.json({
      gameState: gb.checkVictory(),
      move: null
    });
  };

  //gets and makes counter move
  var counterMove = gb.miniMax(false, 0)['move'];
  console.log('Countermove: ' + counterMove)
  return res.json({
    move: counterMove,
    gameState: gb.checkVictory() 
  })
}

function GameBoard(cells) {

  if (typeof cells === 'undefined') {
    this.cells = [];
    
    for (var i = 0; i < 9; i++) {
      this.cells[i] = -1;
    }

    this.numberOfEmptyCells = 9;
  } else {
    this.cells = cells;

    this.numberOfEmptyCells = 0;
    for (var i = 0; i < this.cells.length; i++) {
      if (this.cells[i] === -1) this.numberOfEmptyCells++;
    }
  }
}

GameBoard.prototype.miniMax = function(playerOneTurn, depth) {
  // console.log('depth: ' + depth)
  var moves = [],
    bestMove,
    tempGameBoard,
    tempGameBoardScore,
    that = this,
    checkVictory;

  //checks to see if player has won
  //we factor in depth so that AI will favour moves that win earlier
  //we also introduce slight weighing factor to break ties
  checkVictory = this.checkVictory();
  if (checkVictory >= 10) {
    return checkVictory - depth;
  } else if (checkVictory <= -10) {
    return checkVictory + depth;
  } else if (checkVictory === 0) {
    return 0;
  }

  //checks for all available moves
  moves = this.getAllMoves();

  //for each move, we need to play it from the perspective of current player
  //but when we call minimax, we call it from the perspective of the next player
  if (playerOneTurn) {
    var max_score = Number.NEGATIVE_INFINITY;
    _.each(moves, function(move) {
      tempGameBoard = new GameBoard(that.cells.slice());
      tempGameBoard.makeMove(move, true);      
      tempGameBoardScore = tempGameBoard.miniMax(false, depth + 1);
      // console.log(tempGameBoardScore)

      if (tempGameBoardScore > max_score) {
        max_score = tempGameBoardScore;
        bestMove = move;
      }
      tempGameBoard = null;
    });

    this.score = max_score;
    this.moveToGetToScore = bestMove;
  } else {
    var min_score = Number.POSITIVE_INFINITY;
    _.each(moves, function(move) {

      tempGameBoard = new GameBoard(that.cells.slice());
      tempGameBoard.makeMove(move, false);      
      tempGameBoardScore = tempGameBoard.miniMax(true, depth + 1);

      if (tempGameBoardScore < min_score) {
        min_score = tempGameBoardScore;
        bestMove = move;
      }
    });

    this.score = min_score;
    this.moveToGetToScore = bestMove;
  }

  if (depth === 0) {
    console.log('making move: ' + this.moveToGetToScore);
    this.makeMove(this.moveToGetToScore, playerOneTurn);
    return {
      move: this.moveToGetToScore
    };
  }
  return this.score;
}

//checks if any player has victory based on current board position
//returns score of 10 or -10 in event of victory, 0 if draw, and -1 if to continue
GameBoard.prototype.checkVictory = function() {
  var playerScores = {
      p1: 0,
      p2: 0
    };

  //helper function to calculate scores
  function calculateScore(score, cells) {
    var cellFrequency = {
        empty: 0,
        p1: 0,
        p2: 0
      };

    _.each(cells, function(arg) {
      switch(arg) {
        case -1:
          cellFrequency['empty']++;
          break;

        case 0:
          cellFrequency['p1']++;
          break;

        case 1:
          cellFrequency['p2']++;
          break;                    
      }
    });
    
    //if there is one empty cell, and 2 cells of the same type, give it 0.1 score (meant to break ties)
    if (cellFrequency['empty'] === 1) {   
      if (cellFrequency['p1'] === 2) score['p1'] += 0.1;
      if (cellFrequency['p2'] === 2) score['p2'] += -0.1;
    } 

    //if 3 in a row, return 10 for p1, and -10 for p2
    else if (cellFrequency['p1'] === 3) {
      score['p1'] += 10;
    } 
    else if (cellFrequency['p2'] === 3) {
      score['p2'] += -10;
    }
  }; //end calculateScore function

  //check for horizontal victory
  for (var i = 0; i < 9; i += 3) {
    calculateScore(playerScores, [this.cells[i], this.cells[i + 1], this.cells[i + 2]]);
  }

  //check for vertical victory
  for (var j = 0; j < 3; j++) {
    calculateScore(playerScores, [this.cells[j], this.cells[j + 3], this.cells[j + 6]]);
  }  

  //check for diagonal victories
  calculateScore(playerScores, [this.cells[0], this.cells[4], this.cells[8]]);
  calculateScore(playerScores, [this.cells[2], this.cells[4], this.cells[6]]);

  if (playerScores['p1'] >= 10) return playerScores['p1'];
  if (playerScores['p2'] <= -10) return playerScores['p2'];

  //checks for draw
  if (this.numberOfEmptyCells === 0) return 0;
  
  //returns -1 implying to continue
  return -1;
}

//returns an array of potential moves (pos)
GameBoard.prototype.getAllMoves = function(isPlayerOne) {
  var moves = [];
  for (var i = 0; i < this.cells.length; i++) {
    if (this.cells[i] === -1) moves.push(i);
  }
  return moves;
}

GameBoard.prototype.makeMove = function(pos, isPlayerOne) {
  if (this.cells[pos] !== -1) throw new Error('Cell already occupied');
  this.cells[pos] = isPlayerOne ? 0 : 1;
  this.numberOfEmptyCells--;
}

GameBoard.prototype.printCells = function() {
  var text = '';
  for (var i = 0; i < this.cells.length; i++) {
    text += (this.cells[i] === -1 ? '  ' : '   ') + this.cells[i];
    if ((i + 1) % 3 === 0) {
      console.log(text);
      text = '';
    }
  }
  // console.log('Turn: Player ' + (this.playerOneTurn ? '1' : '2'));
  console.log('Victory: ' + this.checkVictory());
}

// gb = new GameBoard();
// gb.makeMove(0, true);
// gb.makeMove(4, false);
// gb.makeMove(8, true);
// gb.printCells();
// console.log(gb.miniMax(false, 0));

