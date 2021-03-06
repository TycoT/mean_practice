var app = angular.module('flapperNews', ['ui.router']);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
        url: '/home',
        templateUrl: '/views/home.html',
        controller: 'MainCtrl',
        resolve: {
            postPromise: ['posts', function(posts){
            return posts.getAll();
            }]
        }
    })
	.state('posts', {
		url: '/posts/{id}',
		templateUrl: '/views/posts.html',
		controller: 'PostsCtrl',
        resolve: {
            post: ['$stateParams', 'posts', function($stateParams, posts) {
            return posts.get($stateParams.id);
            }]
        }
	})
    .state('login', {
      url: '/login',
      templateUrl: '/views/login.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    })
    .state('register', {
      url: '/register',
      templateUrl: '/views/register.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    });


  $urlRouterProvider.otherwise('home');
}]);

app.factory('auth', ['$http', '$window', function($http, $window){
    var auth = {};

    auth.saveToken = function (token){
      $window.localStorage['flapper-news-token'] = token;
    };

    auth.getToken = function (){
      return $window.localStorage['flapper-news-token'];
    }   

    auth.isLoggedIn = function(){
      var token = auth.getToken();

      if(token){
        var payload = JSON.parse($window.atob(token.split('.')[1]));

        return payload.exp > Date.now() / 1000;
      } else {
        return false;
      }
    };

    auth.currentUser = function(){
      if(auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));

        return payload.username;
      }
    };

    auth.register = function(user){
      return $http.post('/register', user).success(function(data){
        auth.saveToken(data.token);
      });
    };

    auth.logIn = function(user){
      return $http.post('/login', user).success(function(data){
        auth.saveToken(data.token);
      });
    };

    auth.logOut = function(){
      $window.localStorage.removeItem('flapper-news-token');
    };



    return auth;
}])

app.factory('posts', ['$http', 'auth', function($http, auth){
    var o = {
        posts: []
    };
  
    o.getAll = function() {
    return $http.get('/posts').success(function(data){
            angular.copy(data, o.posts);
        });
    };
    
    o.get = function(id) {
        return $http.get('/posts/' + id).then(function(res){
            return res.data;
        });
    };
    
    o.create = function(post) {
      return $http.post('/posts', post, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data){
        o.posts.push(data);
      });
    };

    o.upvote = function(post) {
      return $http.put('/posts/' + post._id + '/upvote', null, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data){
        post.upvotes += 1;
      });
    };

    o.addComment = function(id, comment) {
      return $http.post('/posts/' + id + '/comments', comment, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      });
    };

    o.upvoteComment = function(post, comment) {
      return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data){
        comment.upvotes += 1;
      });
    };
    
    return o;
}]);

app.controller('MainCtrl', [
	'$scope',
	'posts',
    'auth',
	function($scope, posts, auth){
		
		$scope.isLoggedIn = auth.isLoggedIn;

		
		
		$scope.addPost = function(){
			// check if user submits a empty title - does nothing
			if(!$scope.title || $scope.title === '') { return; }
            
            posts.create({
                title: $scope.title,
                link: $scope.link,
            });
			
			// $scope.posts.push({
			// 	title: $scope.title,
			// 	link: $scope.link,
			// 	upvotes: 0,
			// 	comments: [
			// 		{author: 'Joe', body: 'Cool post!', upvotes: 0},
			// 		{author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
			// 	]
			// });
            
			// reset model
			$scope.title = ''; // reset title
			$scope.link = '';
		}
		
		// $scope.incrementUpvotes = function(post) {
		// 	post.upvotes += 1;
		// }
        $scope.incrementUpvotes = function(post) {
            posts.upvote(post);
        };
		
		//posts.posts = $scope.posts;
		$scope.posts = posts.posts;
		//?? weird behavior
		
		
		
	}
]);

app.controller('PostsCtrl', [
    '$scope',
    'posts',
    'post',
    'auth',
    function($scope, posts, post, auth){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.post = post;
		
		console.log(posts);
		
		$scope.addComment = function(){
            if($scope.body === '') { return; }
            posts.addComment(post._id, {
                body: $scope.body,
                author: 'user',
            }).success(function(comment) {
                $scope.post.comments.push(comment);
            });
            $scope.body = '';
        };
        
        $scope.incrementUpvotes = function(comment){
            posts.upvoteComment(post, comment);
        };
	}
]);

app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};

  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
}])

app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);