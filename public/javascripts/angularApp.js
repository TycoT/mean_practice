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
	});

  $urlRouterProvider.otherwise('home');
}]);

app.factory('posts', ['$http', function($http){
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
    return $http.post('/posts', post).success(function(data){
            o.posts.push(data);
        });
    };
    
    o.upvote = function(post) {
    return $http.put('/posts/' + post._id + '/upvote')
            .success(function(data){
            post.upvotes += 1;
        });
    };
    
    o.addComment = function(id, comment) {
        return $http.post('/posts/' + id + '/comments', comment);
    };
    
    o.upvoteComment = function(post, comment) {
        return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote')
            .success(function(data){
            comment.upvotes += 1;
        });
    };
    
    return o;
}]);

app.controller('MainCtrl', [
	'$scope',
	'posts',
	function($scope, posts){
		
		$scope.test = 'Hello world!';
		

		
		
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
    function($scope, posts, post){
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

