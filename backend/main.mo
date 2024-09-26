import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Text "mo:base/Text";

import Array "mo:base/Array";
import Time "mo:base/Time";
import List "mo:base/List";

actor {
  type Comment = {
    author: Text;
    content: Text;
    timestamp: Int;
  };

  type Post = {
    title: Text;
    body: Text;
    author: Text;
    timestamp: Int;
    comments: [Comment];
  };

  stable var posts : List.List<Post> = List.nil();

  public func addPost(title: Text, body: Text, author: Text) : async () {
    let newPost : Post = {
      title = title;
      body = body;
      author = author;
      timestamp = Time.now();
      comments = [];
    };
    posts := List.push(newPost, posts);
  };

  public query func getPosts() : async [Post] {
    let postArray = List.toArray(posts);
    Array.sort(postArray, func(a: Post, b: Post) : { #less; #equal; #greater } {
      if (a.timestamp > b.timestamp) { #less }
      else if (a.timestamp < b.timestamp) { #greater }
      else { #equal }
    })
  };

  public func addComment(postIndex: Nat, author: Text, content: Text) : async () {
    let postArray = List.toArray(posts);
    if (postIndex < postArray.size()) {
      let post = postArray[postIndex];
      let newComment : Comment = {
        author = author;
        content = content;
        timestamp = Time.now();
      };
      let updatedPost : Post = {
        title = post.title;
        body = post.body;
        author = post.author;
        timestamp = post.timestamp;
        comments = Array.append(post.comments, [newComment]);
      };
      posts := List.fromArray(Array.mapEntries(postArray, func(p: Post, i: Nat) : Post {
        if (i == postIndex) { updatedPost } else { p }
      }));
    };
  };

  // Initialize with 6 pre-defined blog posts
  public func init() : async () {
    if (List.isNil(posts)) {
      await addPost("Welcome to My Internet Computer Protocol Blog", "Hello and welcome to my blog dedicated to the Internet Computer Protocol and DFINITY. Here, we'll explore the revolutionary technology behind ICP and its potential to reshape the internet as we know it.", "Dominic Williams");
      await addPost("Understanding the Basics of Internet Computer Protocol", "In this post, we'll dive into the fundamental concepts of the Internet Computer Protocol. From its unique consensus mechanism to its scalable architecture, we'll cover the key elements that make ICP stand out in the blockchain space.", "Dominic Williams");
      await addPost("DFINITY: The Foundation Behind ICP", "Let's take a closer look at DFINITY, the non-profit organization driving the development of the Internet Computer Protocol. We'll explore its mission, key team members, and the role it plays in advancing decentralized computing.", "Dominic Williams");
      await addPost("The Power of Smart Contracts on ICP", "Smart contracts are at the heart of ICP's functionality. In this post, we'll examine how smart contracts work on the Internet Computer, their advantages over traditional blockchain platforms, and some exciting use cases.", "Dominic Williams");
      await addPost("Tokenomics of ICP: Understanding the Ecosystem", "The ICP token plays a crucial role in the Internet Computer ecosystem. We'll break down the tokenomics, including staking, governance, and the deflationary mechanism that makes ICP unique.", "Dominic Williams");
      await addPost("The Future of Web3 with Internet Computer Protocol", "As we look to the future, ICP is poised to play a significant role in the Web3 revolution. In this post, we'll speculate on the potential impact of ICP on decentralized applications, data ownership, and the internet infrastructure of tomorrow.", "Dominic Williams");
    };
  };
}
