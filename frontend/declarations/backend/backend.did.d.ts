import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Comment {
  'content' : string,
  'author' : string,
  'timestamp' : bigint,
}
export interface Post {
  'title' : string,
  'body' : string,
  'author' : string,
  'timestamp' : bigint,
  'comments' : Array<Comment>,
}
export interface _SERVICE {
  'addComment' : ActorMethod<[bigint, string, string], undefined>,
  'addPost' : ActorMethod<[string, string, string], undefined>,
  'getPosts' : ActorMethod<[], Array<Post>>,
  'init' : ActorMethod<[], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
