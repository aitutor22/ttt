'use strict';

angular.module('tttApp')
  .controller('MainCtrl', function ($scope, $http) {
    $http.get('/api/awesomeThings').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
    });

    $scope.data = {
      running: false,
      initialized: false,
      loading: false,
      gameState: ''
    };

    //used to store positions; -1 refers to empty cell, 1 refers to player 1, 2 refers to player 2
    $scope.data.cells = [];

    $scope.createGame = function() {
      $scope.data.running = !$scope.data.running;

      $scope.data.gameState = '';
      //initialising (-1 refers to empty cells)
      for (var i = 0; i < 9; i++) {
        $scope.data.cells[i] = -1;
      };

      $http.post('/api/creategameboard', {})
        .success(function(data) {
          console.log('created');
          $scope.data.initialized = true;
        });
    }

    $scope.playTurn = function(index) {
      if ($scope.data.cells[index] !== -1) {
        console.log('Cell not empty');
        return;
      }

      if ($scope.data.gameState !== '') return;

      $scope.data.cells[index] = 0;
      $scope.data.loading = true;

      $http.post('/api/makemove', {move: index})
        .success(function(data){
          $scope.data.loading = false;

          console.log(data.move)
          $scope.data.cells[data.move] = 1;

          if (data.gameState === 0) {
            $scope.data.gameState = 'Draw';
          } else if (data.gameState >= 10) {
            $scope.data.gameState = 'P1 Won';
          } else if (data.gameState <= -10) {
            $scope.data.gameState = 'P2 Won'
          };
        });
    }

    $scope.toggle = function(index) {
      var cell = _.findWhere($scope.data.cells, {id: index});
      if (cell) {
        cell.status = 'cross';
      }
    }
  });
