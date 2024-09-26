import Func "mo:base/Func";
import Int "mo:base/Int";
import Text "mo:base/Text";

import Array "mo:base/Array";
import Time "mo:base/Time";
import List "mo:base/List";

actor {
  // Define the Post type
  type Post = {
    title: Text;
    body: Text;
    author: Text;
    timestamp: Int;
  };

  // Use a stable variable to store posts
  stable var posts : List.List<Post> = List.nil();

  // Function to add a new post
  public func addPost(title: Text, body: Text, author: Text) : async () {
    let newPost : Post = {
      title = title;
      body = body;
      author = author;
      timestamp = Time.now();
    };
    posts := List.push(newPost, posts);
  };

  // Function to get all posts, sorted by timestamp (most recent first)
  public query func getPosts() : async [Post] {
    let postArray = List.toArray(posts);
    Array.sort(postArray, func(a: Post, b: Post) : { #less; #equal; #greater } {
      if (a.timestamp > b.timestamp) { #less }
      else if (a.timestamp < b.timestamp) { #greater }
      else { #equal }
    })
  };
}
